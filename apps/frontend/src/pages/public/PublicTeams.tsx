import {
  Box,
  Container,
  Grid2 as Grid,
  Card,
  Stack,
  Typography,
  Avatar,
  Button,
  Chip,
} from '@mui/material';
import { ArrowBackRounded, PersonRounded, GroupsRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePublicRegistrationsQuery, useTeamPlayersQuery } from '@/hooks/queries';
import { usePublicScope } from '@/hooks/common/usePublicScope';
import { PublicScopeFilters } from '@/components/sport/PublicScopeFilters';
import { CompetitionHeading } from '@/components/sport/CompetitionHeading';
import { CompetitionTags } from '@/components/sport/CompetitionTags';
import { AppModal } from '@/components/ui/AppModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdSlot } from '@/components/ui/AdSlot';
import { getCompetitionSubtitle } from '@/utils/competitionMeta';
import { ROUTES } from '@/routes/routes';
import type { PublicRegistration } from '@/api/public.api';
import type { Competition } from '@/api/competitions.api';
import type { TeamRosterEntry } from '@/api/teams.api';

interface Selection {
  registration: PublicRegistration;
  competition: Competition;
}

const PublicTeams: React.FC = () => {
  const navigate = useNavigate();
  const scope = usePublicScope();
  const [selected, setSelected] = useState<Selection | null>(null);

  const { data: registrations = [] } = usePublicRegistrationsQuery(scope.editionId);
  const { data: players = [] } = useTeamPlayersQuery(selected?.registration.teamId);

  /** Cada competición con los equipos que se inscribieron en ella. */
  const sections = useMemo(
    () =>
      scope.visibleCompetitions.map((competition) => ({
        competition,
        teams: registrations.filter((r: PublicRegistration) => r.competitionId === competition.id),
      })),
    [scope.visibleCompetitions, registrations],
  );

  const totalTeams = sections.reduce((acc, s) => acc + s.teams.length, 0);

  // El plantel se pide por club, así que se acota a la competición abierta.
  const roster = useMemo(
    () =>
      players.filter(
        (p: TeamRosterEntry) => p.teamRegistration?.competition?.id === selected?.competition.id,
      ),
    [players, selected],
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.home)}
        sx={{ mb: 1, color: 'text.secondary' }}
      >
        Volver
      </Button>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Equipos
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {scope.edition
          ? `Clubes inscritos en ${scope.edition.name}, competición por competición.`
          : 'Clubes inscritos, competición por competición.'}
      </Typography>

      <PublicScopeFilters
        editions={scope.editions}
        editionId={scope.editionId}
        onEditionChange={scope.setEditionId}
        isCurrentEdition={scope.isCurrentEdition}
        competitions={scope.competitions}
        competitionId={scope.competitionId}
        onCompetitionChange={scope.setCompetitionId}
      />

      {sections.length === 0 ? (
        <EmptyState
          icon={<GroupsRounded sx={{ fontSize: 32 }} />}
          title="Todavía no hay competiciones"
          description="Cuando se abra la edición vas a ver aquí los equipos de cada torneo."
        />
      ) : totalTeams === 0 ? (
        <EmptyState
          icon={<GroupsRounded sx={{ fontSize: 32 }} />}
          title="Sin equipos inscritos"
          description="Todavía no hay clubes inscritos en esta selección."
        />
      ) : (
        <Stack spacing={5}>
          {sections.map(({ competition, teams }) => (
            <Box key={competition.id}>
              <CompetitionHeading
                competition={competition}
                count={`${teams.length} ${teams.length === 1 ? 'equipo' : 'equipos'}`}
              />
              {teams.length === 0 ? (
                <Card sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Todavía no hay equipos inscritos en esta competición.
                  </Typography>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {teams.map((r: PublicRegistration, i: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={r.id}>
                      <Card
                        component={motion.div}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                        whileHover={{ y: -3 }}
                        sx={{ p: 3, textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => setSelected({ registration: r, competition })}
                      >
                        <Avatar
                          src={r.team.logoUrl ?? undefined}
                          sx={{
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: 'primary.soft',
                            color: 'primary.main',
                            fontWeight: 800,
                            fontSize: 24,
                          }}
                        >
                          {r.team.name[0]}
                        </Avatar>
                        <Typography variant="h4" sx={{ mb: 0.5 }}>
                          {r.team.name}
                        </Typography>
                        {r.group && (
                          <Chip size="small" variant="outlined" label={r.group.name} sx={{ mt: 0.5 }} />
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          ))}
        </Stack>
      )}

      <AppModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.registration.team.name ?? ''}
        subtitle={
          selected
            ? `${selected.competition.name} · ${getCompetitionSubtitle(selected.competition)}`
            : undefined
        }
        maxWidth={560}
      >
        {selected && (
          <Stack spacing={2}>
            <CompetitionTags competition={selected.competition} />
            {roster.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Este equipo todavía no tiene jugadores inscritos en esta competición.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {roster.map((p: TeamRosterEntry) => (
                  <Card key={p.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={p.player.photoUrl ?? undefined}
                      sx={{ width: 44, height: 44, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700 }}
                    >
                      {p.player.firstName[0]}
                      {p.player.lastName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {p.player.firstName} {p.player.lastName}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                        {p.jerseyNumber && (
                          <Chip label={`#${p.jerseyNumber}`} size="small" variant="outlined" />
                        )}
                        {p.player.position && (
                          <Chip label={p.player.position} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
                      <PersonRounded sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{p.stats?.goals ?? 0} goles</Typography>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </AppModal>

      <AdSlot placement="TEAMS" sx={{ mt: 4 }} />
    </Container>
  );
};

export default PublicTeams;
