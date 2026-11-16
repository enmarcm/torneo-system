/**
 * Limpieza de datos fantasma: lo que quedó de borrados anteriores.
 *
 *  - Jugadores desactivados: "Desactivar" no libera la cédula, así que un
 *    jugador que se creyó borrado sigue ocupando su documento.
 *  - Archivos huérfanos: documentos de identidad en MinIO que ningún jugador
 *    (ni la papelera) referencia, típicamente de jugadores ya borrados.
 *
 * Por defecto NO borra nada: solo muestra qué borraría. Para ejecutar de verdad
 * hay que pasar --apply.
 *
 *   npx tsx scripts/limpiar-fantasmas.ts [opciones]
 *
 *   --jugadores        incluye a los jugadores desactivados
 *   --sin-historial    con --jugadores, solo los que no tienen partidos ni eventos
 *   --archivos         incluye los documentos huérfanos de MinIO
 *   --definitivo       con --apply, los jugadores borrados no pasan por la papelera
 *                      (sus fotos también se borran ya, sin plazo de 30 días)
 *   --apply            ejecuta el borrado
 *
 * Los jugadores se borran por el mismo camino que el botón "Eliminar
 * definitivamente" del admin, así que su cédula queda libre.
 */
import { prisma } from '@/lib/prisma';
import { minioClient } from '@/lib/minio';
import { env } from '@/config/env';
import { playersService } from '@/modules/players/players.service';
import { trashService } from '@/modules/trash/trash.service';
import type { Snapshot } from '@/modules/trash/trash.collectors';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const wantPlayers = args.has('--jugadores');
const wantFiles = args.has('--archivos');
const noHistory = args.has('--sin-historial');
const definitive = args.has('--definitivo');

/** Un archivo recién subido puede pertenecer a un formulario que aún no se guarda. */
const GRACE_MS = 24 * 60 * 60 * 1000;

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const cleanPlayers = async () => {
  console.log('\n== Jugadores desactivados ==');
  const players = await prisma.player.findMany({
    where: { status: 'INACTIVE' },
    include: {
      rosterEntries: { include: { stats: true } },
      _count: { select: { matchEvents: true, mvpMatches: true } },
    },
    orderBy: { lastName: 'asc' },
  });

  const rows = players.map((p) => ({
    id: p.id,
    nombre: `${p.firstName} ${p.lastName}`,
    documento: `${p.documentType} ${p.documentNumber}`,
    plantillas: p.rosterEntries.length,
    partidos: p.rosterEntries.reduce((n, r) => n + (r.stats?.matchesPlayed ?? 0), 0),
    eventos: p._count.matchEvents + p._count.mvpMatches,
  }));
  const targets = noHistory ? rows.filter((r) => r.partidos === 0 && r.eventos === 0) : rows;

  console.log(`Desactivados: ${rows.length}. A borrar${noHistory ? ' (sin historial)' : ''}: ${targets.length}.`);
  if (targets.length) console.table(targets.map(({ id, ...rest }) => rest));
  if (!apply || !targets.length) return;

  let done = 0;
  for (const target of targets) {
    try {
      await playersService.remove(target.id);
      if (definitive) {
        const stashed = await prisma.trashItem.findMany({ where: { kind: 'PLAYER', entityId: target.id }, select: { id: true } });
        for (const item of stashed) await trashService.purge(item.id);
      }
      done++;
    } catch (err) {
      console.error(`  ✗ ${target.nombre} (${target.documento}): ${(err as Error).message}`);
    }
  }
  console.log(`Borrados: ${done} de ${targets.length}.${definitive ? '' : ' Siguen 30 días en la papelera.'}`);
};

const cleanFiles = async () => {
  console.log('\n== Documentos huérfanos en MinIO ==');
  const bucket = env.MINIO_PRIVATE_BUCKET;

  const referenced = new Set<string>();
  for (const p of await prisma.player.findMany({ select: { identityPhotoKey: true, degreeDocUrl: true } })) {
    if (p.identityPhotoKey) referenced.add(p.identityPhotoKey);
    if (p.degreeDocUrl) referenced.add(p.degreeDocUrl);
  }
  // Lo que está en la papelera todavía se puede restaurar: sus archivos cuentan como en uso.
  for (const item of await prisma.trashItem.findMany({ select: { payload: true } })) {
    for (const row of (item.payload as unknown as Snapshot).rows.player ?? []) {
      if (typeof row.identityPhotoKey === 'string') referenced.add(row.identityPhotoKey);
      if (typeof row.degreeDocUrl === 'string') referenced.add(row.degreeDocUrl);
    }
  }

  const orphans: Array<{ name: string; size: number }> = [];
  let total = 0;
  await new Promise<void>((resolve, reject) => {
    const stream = minioClient.listObjectsV2(bucket, '', true);
    stream.on('data', (obj) => {
      if (!obj.name) return;
      total++;
      const old = Date.now() - (obj.lastModified?.getTime() ?? 0) > GRACE_MS;
      if (old && !referenced.has(obj.name)) orphans.push({ name: obj.name, size: obj.size ?? 0 });
    });
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  const bytes = orphans.reduce((n, o) => n + o.size, 0);
  console.log(`Objetos en ${bucket}: ${total}. Huérfanos: ${orphans.length} (${mb(bytes)}).`);
  orphans.slice(0, 20).forEach((o) => console.log(`  ${o.name}`));
  if (orphans.length > 20) console.log(`  … y ${orphans.length - 20} más`);
  if (!apply || !orphans.length) return;

  await minioClient.removeObjects(bucket, orphans.map((o) => o.name));
  console.log(`Borrados ${orphans.length} archivos.`);
};

const main = async () => {
  if (!wantPlayers && !wantFiles) {
    console.log('Indica qué limpiar: --jugadores y/o --archivos (ver la cabecera del script).');
    return;
  }
  console.log(apply ? 'MODO REAL: se va a borrar.' : 'Simulacro: no se borra nada. Agrega --apply para ejecutar.');
  // Primero los jugadores: al borrarlos con --definitivo sus archivos quedan huérfanos y caen en el segundo paso.
  if (wantPlayers) await cleanPlayers();
  if (wantFiles) await cleanFiles();
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
