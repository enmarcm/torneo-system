import {
  Box,
  Container,
  Grid2 as Grid,
  Card,
  Stack,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { ArrowBackRounded, GroupsRounded } from '@mui/icons-material';
import { Crest } from '@/components/ui/Crest';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePublicRegistrationsQuery } from '@/hooks/queries';
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
import { CompetitionRoster } from '@/components/sport/CompetitionRoster';

interface Selection {
  registration: PublicRegistration;
  competition: Competition;
}

const PublicTeams: React.FC = () => {
  const navigate = useNavigate();
  const scope = usePublicScope();
  const [selected, setSelected] = useState<Selection | null>(null);

  const { data: registrations = [] } = usePublicRegistrationsQuery(scope.editionId);

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
          variant="bench"
          seats={6}
          filled={0}
          title="Sin equipos inscritos"
          description="Todavía no hay clubes inscritos en esta selección. Cuando la liga los cargue, aparecen acá con su escudo."
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
                <EmptyState
                  variant="bench"
                  compact
                  seats={6}
                  filled={0}
                  title="Todavía no hay equipos inscritos en esta competición"
                />
              ) : (
                <Grid container spacing={2}>
                  {teams.map((r: PublicRegistration, i: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={r.id}>
                      <Card
                        component={motion.div}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                        className="llf-cardlink"
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver jugadores de ${r.team.name}`}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelected({ registration: r, competition });
                          }
                        }}
                        sx={{ p: 3, textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => setSelected({ registration: r, competition })}
                      >
                        <Crest
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
                        </Crest>
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
            <CompetitionRoster key={selected.registration.id} registrationId={selected.registration.id} />
          </Stack>
        )}
      </AppModal>

      <AdSlot placement="TEAMS" sx={{ mt: 4 }} />
    </Container>
  );
};

export default PublicTeams;
