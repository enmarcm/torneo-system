# Copias de seguridad

Un contenedor (`backup`) que cada `BACKUP_INTERVAL_HOURS` horas (6 por defecto):

1. Vuelca Postgres (`pg_dump -Fc`) a `./backups/db/`.
2. **Restaura ese volcado en una base temporal y cuenta filas.** Si no se puede restaurar, la copia cuenta como fallida.
3. Espeja los dos buckets de MinIO (fotos públicas y documentos de identidad) a `./backups/minio/current/`. Lo que se borra o se pisa en MinIO se aparta en `./backups/minio/changed/<fecha>/`.
4. Sube todo **fuera del servidor** si hay `BACKUP_REMOTE`.
5. Avisa a `BACKUP_PING_URL` (si lo pones, te escriben cuando *dejan* de llegar copias).

Retención: 14 días de volcados + 1 por mes durante 12 meses (local); 60 días fuera.

## Puesta en marcha

```bash
docker compose up -d --build backup
docker compose logs -f backup        # a los ~60 s debe decir "copia completa"
docker compose exec backup backup list
```

Sin `BACKUP_REMOTE` las copias solo viven en este servidor y el log lo avisa en cada ronda.
**Eso protege de un `docker volume rm` o de un borrado por error, no de perder el disco o el servidor.**

## Destino fuera del servidor (obligatorio en producción)

Cualquier almacenamiento que rclone entienda. Ejemplo con Backblaze B2 (≈ 10 GB gratis), **cifrado**, porque en MinIO hay fotos de cédulas:

```bash
# 1. Cifra la clave que usarás (la salida va en RCLONE_CONFIG_OFFSITECRYPT_PASSWORD)
docker compose run --rm backup rclone obscure 'una-frase-larga-y-unica'
```

En `.env`:

```env
RCLONE_CONFIG_OFFSITE_TYPE=b2
RCLONE_CONFIG_OFFSITE_ACCOUNT=<keyID de B2>
RCLONE_CONFIG_OFFSITE_KEY=<applicationKey de B2>

RCLONE_CONFIG_OFFSITECRYPT_TYPE=crypt
RCLONE_CONFIG_OFFSITECRYPT_REMOTE=offsite:nombre-del-bucket/torneo
RCLONE_CONFIG_OFFSITECRYPT_PASSWORD=<salida de rclone obscure>

BACKUP_REMOTE=offsitecrypt:
BACKUP_PING_URL=https://hc-ping.com/<uuid>   # opcional, healthchecks.io
```

> **Guarda la frase de cifrado fuera del servidor** (gestor de contraseñas). Sin ella, la copia de B2 no se puede leer.
> Para S3, Google Drive, otro VPS por SFTP… cambia `TYPE` y sus claves ([lista de rclone](https://rclone.org/overview/)).

## Restaurar

Prueba segura (no toca nada real): `docker compose exec backup backup restore-test`

**Recuperar la base** (reemplaza lo actual):

```bash
docker compose stop backend
docker compose exec backup backup list
docker compose exec backup backup restore /backups/db/torneo-AAAAMMDD-HHMMSS.dump --yes
docker compose start backend
```

**Recuperar fotos y documentos**: `docker compose exec backup backup restore-files`
(desde el remoto, en un servidor nuevo: `restore-files --from-remote`).

**Servidor nuevo desde cero**: clonar el repo → poner el mismo `.env` → `docker compose up -d postgres minio` → `restore-files --from-remote` → traer el `.dump` con `rclone copy` a `./backups/db/` → `restore ... --yes` → `docker compose up -d`.

## Haz esto una vez, de verdad

Una copia que nadie ha restaurado no es una copia. Con el sistema ya en marcha:
1. `backup restore-test` → debe terminar en `restore-test OK`.
2. En otra máquina, restaura el `.dump` que bajaste del remoto y entra al sistema. Apunta la fecha.
3. Repite cada trimestre.

## Lo que esto NO cubre

- Perder datos **entre** dos copias (hasta 6 h). Si hace falta menos, baja `BACKUP_INTERVAL_HOURS`; con este tamaño de base cuesta segundos.
- La carpeta `./backups` contiene datos personales (cédulas, menores): mismo cuidado que la base. Permisos solo para root; no la compartas ni la subas a git (ya está en `.gitignore`).
- El archivo `.env` (claves JWT, de MinIO…) no se respalda aquí: guárdalo aparte en un gestor de contraseñas.
