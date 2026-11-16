import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import { useState } from 'react';
import type { Competition } from '@/api/competitions.api';
import type { Edition } from '@/api/editions.api';
import { usePublicStandingsQuery, useBracketQuery, usePublicRegistrationsQuery } from '@/hooks/queries';
import { formatDate } from '@/utils/formatDate';
import { AppModal } from '@/components/ui/AppModal';
import { Crest } from '@/components/ui/Crest';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { CompetitionTags } from './CompetitionTags';
import { CompetitionRoster } from './CompetitionRoster';
import { StandingsTable } from './StandingsTable';
import { BracketView } from './BracketView';

interface Props {
  competition: Competition;
  edition?: Edition;
  onClose: () => void;
}

type View = 'table' | 'bracket';

/**
 * Ficha de un torneo ya jugado: campeón arriba, y debajo la tabla final o las
 * llaves. Es de solo lectura; lo que se ve es lo que quedó al cerrar.
 */
export const HistoryCompetitionModal: React.FC<Props> = ({ competition, edition, onClose }) => {
  const isCup = competition.format === 'GROUPS_KNOCKOUT';
  const [view, setView] = useState<View>('table');
  const [team, setTeam] = useState<{ registrationId: string; name: string } | null>(null);

  const standings = usePublicStandingsQuery(competition.id);
  const bracket = useBracketQuery(isCup ? competition.id : '');
  const registrations = usePublicRegistrationsQuery(competition.editionId, competition.id);
  const ghostTeams = (registrations.data ?? []).map((r) => ({ ...r.team, registrationId: r.id }));

  /*
    El campeón sale de lo que ya existe: en una copa, el ganador de la final;
    en una liga, el primero de la tabla. Solo se anuncia con el torneo cerrado,
    para no coronar a quien va de líder en uno que quedó a medias.
  */
  const finished = competition.status === 'FINISHED' || edition?.status === 'FINISHED';
  const finalTie = bracket.data?.find((round) => round.stage === 'FINAL')?.ties[0];
  const champion = !finished
    ? null
    : isCup
      ? finalTie?.winnerRegistration
        ? { name: finalTie.winnerRegistration.team.name, logoUrl: finalTie.winnerRegistration.team.logoUrl }
        : null
      : standings.data?.[0] && standings.data[0].pj > 0
        ? { name: standings.data[0].teamName, logoUrl: standings.data[0].logoUrl }
        : null;

  const period = edition ? `${formatDate(edition.startDate)} → ${formatDate(edition.endDate)}` : undefined;

  return (
    <AppModal
      open
      onClose={onClose}
      title={team?.name ?? competition.name}
      subtitle={team ? `${competition.name} · Jugadores` : [edition?.name, period].filter(Boolean).join(' · ') || undefined}
      maxWidth={1040}
    >
      {team ? (
        <Stack spacing={2}>
          <Typography
            component="button"
            onClick={() => setTeam(null)}
            sx={{ alignSelf: 'flex-start', background: 'none', border: 0, p: 0, color: 'primary.main', cursor: 'pointer', font: 'inherit', fontWeight: 700 }}
          >
            ← Volver al torneo
          </Typography>
          <CompetitionRoster key={team.registrationId} registrationId={team.registrationId} />
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          <CompetitionTags competition={competition} />

          {champion && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'warning.main', bgcolor: 'action.hover' }}
            >
              <EmojiEventsRounded sx={{ color: 'warning.main', fontSize: 36 }} />
              <Crest src={champion.logoUrl ?? undefined} sx={{ width: 44, height: 44 }}>{champion.name[0]}</Crest>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Campeón
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{champion.name}</Typography>
              </Box>
            </Stack>
          )}

          {isCup && (
            <Tabs value={view} onChange={(_, v: View) => setView(v)} sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none' } }}>
              <Tab value="table" label="Tabla general" />
              <Tab value="bracket" label="Llaves" />
            </Tabs>
          )}

          {view === 'bracket' && isCup ? (
            bracket.isPending ? <MatchLoader /> : <BracketView rounds={bracket.data ?? []} />
          ) : standings.isPending ? (
            <MatchLoader />
          ) : (
            <StandingsTable
              rows={standings.data ?? []}
              ghostTeams={ghostTeams}
              onTeamClick={(registrationId, name) => setTeam({ registrationId, name })}
            />
          )}
        </Stack>
      )}
    </AppModal>
  );
};
