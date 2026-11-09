#!/bin/sh
# Copias de seguridad de Postgres y MinIO. Guía completa: ops/backup/README.md
#
#   backup daemon                   (por defecto) copia cada BACKUP_INTERVAL_HOURS
#   backup now                      una copia ahora mismo
#   backup list                     copias disponibles
#   backup restore-test [archivo]   restaura en una base temporal y compara
#   backup restore <archivo> --yes  restaura sobre la base real (parar el backend antes)
#   backup restore-files [--from-remote]   devuelve las fotos/documentos a MinIO
#   backup healthcheck              0 si hubo una copia buena hace poco
#   backup <otro comando>           se ejecuta tal cual (p. ej. rclone obscure)
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
INTERVAL_H="${BACKUP_INTERVAL_HOURS:-6}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
KEEP_MONTHS="${BACKUP_KEEP_MONTHS:-12}"
REMOTE="${BACKUP_REMOTE:-}"
REMOTE_KEEP_DAYS="${BACKUP_REMOTE_KEEP_DAYS:-60}"
PING_URL="${BACKUP_PING_URL:-}"

export PGHOST="${PGHOST:-postgres}"
export PGUSER="${POSTGRES_USER:-}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"
DB="${POSTGRES_DB:-}"

# MinIO como "remoto" de rclone, sin archivo de configuración.
export RCLONE_CONFIG_MINIO_TYPE=s3
export RCLONE_CONFIG_MINIO_PROVIDER=Minio
export RCLONE_CONFIG_MINIO_ACCESS_KEY_ID="${MINIO_ROOT_USER:-}"
export RCLONE_CONFIG_MINIO_SECRET_ACCESS_KEY="${MINIO_ROOT_PASSWORD:-}"
export RCLONE_CONFIG_MINIO_ENDPOINT="http://${MINIO_ENDPOINT:-minio}:${MINIO_PORT:-9000}"
BUCKETS="${MINIO_PUBLIC_BUCKET:-public-assets} ${MINIO_PRIVATE_BUCKET:-private-docs}"

LAST_DUMP=""

log() { echo "[backup $(date '+%F %T')] $*"; }
die() { log "ERROR: $*"; exit 1; }

# healthchecks.io y similares: "" = vivo, /start, /fail.
ping() {
  [ -n "$PING_URL" ] || return 0
  wget -q -T 10 -O /dev/null "$PING_URL$1" 2>/dev/null || true
}

need_env() {
  [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$DB" ] || die "faltan POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB"
}

dump_db() {
  mkdir -p "$BACKUP_DIR/db"
  out="$BACKUP_DIR/db/torneo-$(date +%Y%m%d-%H%M%S).dump"
  # Se escribe en un .partial: una copia a medias nunca tiene aspecto de buena.
  pg_dump -Fc --no-owner --no-acl -d "$DB" -f "$out.partial" || { rm -f "$out.partial"; return 1; }
  # Si el índice del archivo no se puede leer, no sirve.
  pg_restore --list "$out.partial" >/dev/null || { rm -f "$out.partial"; return 1; }
  mv "$out.partial" "$out" || return 1
  LAST_DUMP="$out"
  log "volcado: $out ($(du -h "$out" | cut -f1))"
}

# Restaura en una base desechable y cuenta filas. Es la única prueba real de que
# la copia sirve: un archivo que nadie ha restaurado es una esperanza, no un backup.
restore_test() {
  file="${1:-$LAST_DUMP}"
  [ -n "$file" ] && [ -f "$file" ] || { log "restore-test: no hay archivo"; return 1; }
  tdb="restore_test_$$"
  psql -d postgres -qAt -c "DROP DATABASE IF EXISTS $tdb" >/dev/null || return 1
  psql -d postgres -qAt -c "CREATE DATABASE $tdb" >/dev/null || return 1
  ok=0
  if pg_restore --no-owner --no-acl -d "$tdb" "$file" >/dev/null 2>&1; then
    live=$(psql -d "$DB" -qAt -c 'SELECT count(*) FROM "Player"' 2>/dev/null || echo "?")
    got=$(psql -d "$tdb" -qAt -c 'SELECT count(*) FROM "Player"' 2>/dev/null || echo "")
    mig=$(psql -d "$tdb" -qAt -c 'SELECT count(*) FROM _prisma_migrations' 2>/dev/null || echo 0)
    usr=$(psql -d "$tdb" -qAt -c 'SELECT count(*) FROM "User"' 2>/dev/null || echo 0)
    if [ -n "$got" ] && [ "$mig" -gt 0 ] && [ "$usr" -gt 0 ]; then
      log "restore-test OK: jugadores $got (en vivo $live), usuarios $usr, migraciones $mig"
      ok=1
    fi
  fi
  psql -d postgres -qAt -c "DROP DATABASE IF EXISTS $tdb" >/dev/null || true
  [ "$ok" = 1 ] || { log "restore-test FALLÓ con $file"; return 1; }
}

rotate() {
  # Volcados recientes: los de más de KEEP_DAYS días se van.
  find "$BACKUP_DIR/db" -maxdepth 1 -name 'torneo-*.dump' -mtime +"$KEEP_DAYS" -exec rm -f {} + || true
  find "$BACKUP_DIR/minio/changed" -mindepth 1 -maxdepth 1 -mtime +"$KEEP_DAYS" -exec rm -rf {} + 2>/dev/null || true
  # Uno por mes, para poder volver más atrás que las dos semanas.
  [ -n "$LAST_DUMP" ] || return 0
  mkdir -p "$BACKUP_DIR/monthly"
  m="$BACKUP_DIR/monthly/torneo-$(date +%Y%m).dump"
  [ -e "$m" ] || cp "$LAST_DUMP" "$m"
  n=0
  for f in $(ls -1t "$BACKUP_DIR"/monthly/torneo-*.dump 2>/dev/null); do
    n=$((n + 1))
    [ "$n" -le "$KEEP_MONTHS" ] || rm -f "$f"
  done
}

# Espejo de las fotos y documentos. Lo que se borra o se pisa en MinIO no se pierde:
# rclone lo aparta en minio/changed/<fecha> durante KEEP_DAYS días.
mirror_minio() {
  stamp=$(date +%Y%m%d-%H%M%S)
  for b in $BUCKETS; do
    rclone sync "minio:$b" "$BACKUP_DIR/minio/current/$b" \
      --backup-dir "$BACKUP_DIR/minio/changed/$stamp/$b" --quiet || return 1
  done
  log "MinIO espejado ($(du -sh "$BACKUP_DIR/minio/current" | cut -f1))"
}

# Fuera del servidor. Si la copia vive donde vive la base, un disco roto se lleva las dos.
offsite() {
  if [ -z "$REMOTE" ]; then
    log "AVISO: BACKUP_REMOTE sin configurar, las copias solo existen en este servidor"
    return 0
  fi
  stamp=$(date +%Y%m%d-%H%M%S)
  rclone copy "$BACKUP_DIR/db" "$REMOTE/db" --quiet || return 1
  rclone copy "$BACKUP_DIR/monthly" "$REMOTE/monthly" --quiet 2>/dev/null || true
  rclone sync "$BACKUP_DIR/minio/current" "$REMOTE/minio/current" \
    --backup-dir "$REMOTE/minio/changed/$stamp" --quiet || return 1
  rclone delete "$REMOTE/db" --min-age "${REMOTE_KEEP_DAYS}d" --quiet || true
  rclone delete "$REMOTE/minio/changed" --min-age "${REMOTE_KEEP_DAYS}d" --quiet 2>/dev/null || true
  log "subido a $REMOTE"
}

run_once() {
  need_env
  ping /start
  fails=0
  if dump_db; then
    restore_test "$LAST_DUMP" || fails=$((fails + 1))
    rotate || fails=$((fails + 1))
  else
    log "FALLÓ el volcado de Postgres"
    fails=$((fails + 1))
  fi
  mirror_minio || { log "FALLÓ el espejo de MinIO"; fails=$((fails + 1)); }
  offsite || { log "FALLÓ la subida fuera del servidor"; fails=$((fails + 1)); }

  if [ "$fails" -eq 0 ]; then
    date +%s > "$BACKUP_DIR/.last_ok"
    log "copia completa"
    ping ""
  else
    log "copia INCOMPLETA ($fails fallo/s)"
    ping /fail
    return 1
  fi
}

daemon() {
  log "iniciado: cada ${INTERVAL_H}h, local ${KEEP_DAYS} días + ${KEEP_MONTHS} meses, remoto: ${REMOTE:-ninguno}"
  sleep 60 # que Postgres y MinIO terminen de arrancar
  while true; do
    sh "$0" now || true
    sleep $((INTERVAL_H * 3600))
  done
}

restore_real() {
  file="${1:-}"
  [ -f "$file" ] || die "uso: backup restore <archivo.dump> --yes"
  [ "${2:-}" = "--yes" ] || die "esto REEMPLAZA la base '$DB'. Para el backend (docker compose stop backend) y repite con --yes"
  log "restaurando $file sobre $DB"
  pg_restore --clean --if-exists --no-owner --no-acl -d "$DB" "$file"
  log "listo. Levanta el backend: docker compose start backend"
}

restore_files() {
  src="$BACKUP_DIR/minio/current"
  if [ "${1:-}" = "--from-remote" ]; then
    [ -n "$REMOTE" ] || die "BACKUP_REMOTE sin configurar"
    src="$BACKUP_DIR/minio/from-remote"
    rclone copy "$REMOTE/minio/current" "$src"
  fi
  for b in $BUCKETS; do
    log "devolviendo $b a MinIO"
    rclone copy "$src/$b" "minio:$b"
  done
}

list_backups() {
  echo "== Postgres (recientes) =="; ls -lh "$BACKUP_DIR/db" 2>/dev/null || echo "(ninguno)"
  echo "== Postgres (mensuales) =="; ls -lh "$BACKUP_DIR/monthly" 2>/dev/null || echo "(ninguno)"
  [ -f "$BACKUP_DIR/.last_ok" ] && echo "Última copia buena: $(date -d "@$(cat "$BACKUP_DIR/.last_ok")" '+%F %T')" || echo "Aún no hay una copia buena."
}

health() {
  [ -f "$BACKUP_DIR/.last_ok" ] || exit 1
  age=$(( $(date +%s) - $(cat "$BACKUP_DIR/.last_ok") ))
  [ "$age" -lt $((INTERVAL_H * 3600 * 2 + 3600)) ]
}

case "${1:-daemon}" in
  daemon) daemon ;;
  now) run_once ;;
  restore-test) need_env; restore_test "${2:-$(ls -1t "$BACKUP_DIR"/db/torneo-*.dump 2>/dev/null | head -n1)}" ;;
  restore) need_env; shift; restore_real "$@" ;;
  restore-files) shift; restore_files "$@" ;;
  list) list_backups ;;
  healthcheck) health ;;
  *) exec "$@" ;;
esac
