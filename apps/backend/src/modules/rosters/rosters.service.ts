import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { calcAge } from '@/utils/date.util';

export const rostersService = {
  list: (teamRegistrationId: string) =>
    prisma.rosterEntry.findMany({
      where: { teamRegistrationId },
      include: { player: true, stats: true },
    }),

  add: async (teamRegistrationId: string, playerId: string, jerseyNumber?: number) => {
    const reg = await prisma.teamRegistration.findUnique({
      where: { id: teamRegistrationId },
      include: { competition: true },
    });
    if (!reg) throw new AppError(404, 'Inscripción no encontrada', 'NOT_FOUND');
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new AppError(404, 'Jugador no encontrado', 'NOT_FOUND');

    const comp = reg.competition;
    const age = calcAge(player.birthDate);
    if (comp.ageMin != null && age < comp.ageMin) {
      throw new AppError(422, MESSAGES.notEligibleAge, 'AGE');
    }
    if (comp.ageMax != null && age > comp.ageMax) {
      throw new AppError(422, MESSAGES.notEligibleAge, 'AGE');
    }

    const count = await prisma.rosterEntry.count({
      where: { teamRegistrationId, status: 'ACTIVE' },
    });
    if (count >= comp.maxPlayers) {
      throw new AppError(422, MESSAGES.rosterFull, 'FULL');
    }

    return prisma.rosterEntry.create({
      data: {
        teamRegistrationId,
        playerId,
        jerseyNumber: jerseyNumber ?? null,
        eligibilityApproved: !comp.requiresAdminEligibility,
        stats: { create: {} },
      },
      include: { player: true, stats: true },
    });
  },

  setEligibility: (id: string, eligibilityApproved: boolean) =>
    prisma.rosterEntry.update({ where: { id }, data: { eligibilityApproved } }),

  update: (id: string, data: { jerseyNumber?: number; status?: 'ACTIVE' | 'INACTIVE' }) =>
    prisma.rosterEntry.update({ where: { id }, data }),

  remove: (id: string) =>
    prisma.rosterEntry.update({ where: { id }, data: { status: 'INACTIVE' } }),
};
