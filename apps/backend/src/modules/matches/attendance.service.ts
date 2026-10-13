import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import type { Prisma } from '@prisma/client';
import type { SetAttendanceDto } from './matches.schema';

const matchInclude = {
  homeRegistration: { include: { team: { select: { id: true, name: true } } } },
  awayRegistration: { include: { team: { select: { id: true, name: true } } } },
} as const;

const getAttendance = async (db: Prisma.TransactionClient, matchId: string) => {
  const match = await db.match.findUnique({ where: { id: matchId }, include: matchInclude });
  if (!match) throw new AppError(404, 'Partido no encontrado', 'NOT_FOUND');
  const registrations = [match.homeRegistration, match.awayRegistration];
  const roster = await db.rosterEntry.findMany({
    where: {
      teamRegistrationId: { in: registrations.map((r) => r.id) },
      teamRegistration: { competitionId: match.competitionId },
      OR: [
        { status: 'ACTIVE', player: { status: 'ACTIVE' } },
        // Preserve the match history when a player later leaves the roster.
        { matchAttendances: { some: { matchId } } },
      ],
    },
    select: {
      id: true, teamRegistrationId: true, jerseyNumber: true, status: true,
      player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, status: true } },
      matchAttendances: { where: { matchId }, select: { present: true } },
    },
    orderBy: [{ player: { lastName: 'asc' } }, { player: { firstName: 'asc' } }],
  });
  return {
    matchId,
    competitionId: match.competitionId,
    updatedAt: match.attendanceUpdatedAt,
    teams: registrations.map((registration) => ({
      registrationId: registration.id,
      team: registration.team,
      players: roster.filter((entry) => entry.teamRegistrationId === registration.id).map((entry) => ({
        rosterEntryId: entry.id,
        jerseyNumber: entry.jerseyNumber,
        player: { id: entry.player.id, firstName: entry.player.firstName, lastName: entry.player.lastName, photoUrl: entry.player.photoUrl },
        active: entry.status === 'ACTIVE' && entry.player.status === 'ACTIVE',
        present: entry.matchAttendances[0]?.present ?? null,
      })),
    })),
  };
};

export const attendanceService = {
  get: (matchId: string) => getAttendance(prisma, matchId),

  save: (matchId: string, data: SetAttendanceDto) => prisma.$transaction(async (tx) => {
    const exists = await tx.match.findUnique({ where: { id: matchId }, select: { id: true } });
    if (!exists) throw new AppError(404, 'Partido no encontrado', 'NOT_FOUND');
    // Lock the parent row so changing a match's teams cannot race this save.
    await tx.match.update({ where: { id: matchId }, data: { attendanceUpdatedAt: new Date() } });
    const sheet = await getAttendance(tx, matchId);
    const allowedIds = new Set(sheet.teams.flatMap((team) => team.players.map((player) => player.rosterEntryId)));
    if (data.entries.some((entry) => !allowedIds.has(entry.rosterEntryId))) {
      throw new AppError(422, 'Solo puedes marcar jugadores inscritos en los equipos de este partido y en esta competición', 'ATTENDANCE_NOT_IN_MATCH');
    }
    if (new Set(data.entries.map((entry) => entry.rosterEntryId)).size !== data.entries.length) {
      throw new AppError(422, 'No se puede repetir un jugador en la asistencia', 'DUPLICATE_ATTENDANCE');
    }
    if (data.entries.length) {
      await tx.matchAttendance.createMany({
        data: data.entries.map((entry) => ({ matchId, ...entry })),
        skipDuplicates: true,
      });
      for (const present of [true, false]) {
        const ids = data.entries.filter((entry) => entry.present === present).map((entry) => entry.rosterEntryId);
        if (ids.length) await tx.matchAttendance.updateMany({
          where: { matchId, rosterEntryId: { in: ids } }, data: { present },
        });
      }
    }
    return getAttendance(tx, matchId);
  }),
};
