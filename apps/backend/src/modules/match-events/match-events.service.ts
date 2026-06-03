import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { getIo } from '@/lib/socket';
import { MatchEventType } from '@prisma/client';

export const matchEventsService = {
  create: async (
    matchId: string,
    data: {
      type: MatchEventType;
      minute: number;
      teamRegistrationId: string;
      playerId?: string;
    },
  ) => {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError(404, 'Partido no encontrado', 'NOT_FOUND');

    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        type: data.type,
        minute: data.minute,
        teamRegistrationId: data.teamRegistrationId,
        playerId: data.playerId ?? null,
      },
    });

    let { homeScore, awayScore } = match;
    if (data.type === 'GOAL') {
      if (data.teamRegistrationId === match.homeRegistrationId) homeScore += 1;
      else if (data.teamRegistrationId === match.awayRegistrationId) awayScore += 1;
      await prisma.match.update({ where: { id: matchId }, data: { homeScore, awayScore } });
    }

    const io = getIo();
    io.to(`match:${matchId}`).emit('match:event', {
      matchId,
      type: data.type,
      minute: data.minute,
      playerId: data.playerId,
      teamRegistrationId: data.teamRegistrationId,
    });
    io.to(`match:${matchId}`).emit('match:update', {
      matchId,
      homeScore,
      awayScore,
      status: match.status,
    });

    return event;
  },

  remove: (id: string) => prisma.matchEvent.delete({ where: { id } }),
};
