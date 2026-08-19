import {
  Box,
  Container,
  Grid2 as Grid,
  Card,
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
} from '@mui/material';
import { ArrowBackRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePublicStandingsQuery,
  usePublicGroupsQuery,
  useBracketQuery,
} from '@/hooks/queries';
import { usePublicScope } from '@/hooks/common/usePublicScope';
import { PublicScopeFilters } from '@/components/sport/PublicScopeFilters';
import { CompetitionCard } from '@/components/sport/CompetitionCard';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { BracketView } from '@/components/sport/BracketView';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdSlot } from '@/components/ui/AdSlot';
import { ROUTES } from '@/routes/routes';

type View = 'table' | 'groups' | 'bracket';

interface PublicGroup {
  id: string;
  name: string;
  registrations: Array<{ id: string; team: { id: string; name: string; logoUrl: string | null } }>;
}

const PublicCompetitions: React.FC = () => {
  const navigate = useNavigate();
  const scope = usePublicScope();

  // Aquí siempre se mira una competición concreta: sin elección, la primera.
  const competition = scope.competition ?? scope.competitions[0];
  const cid = competition?.id;
  const isCup = competition?.format === 'GROUPS_KNOCKOUT';

  const [view, setView] = useState<View>('table');
  const activeView: View = isCup ? view : 'table';

  const [groupId, setGroupId] = useState('');
  const { data: groups = [] } = usePublicGroupsQuery(isCup ? (cid ?? '') : '');
  const { data: bracket = [] } = useBracketQuery(isCup ? (cid ?? '') : '');
  const { data: standings = [], isLoading } = usePublicStandingsQuery(
    cid ?? '',
    activeView === 'groups' ? groupId || undefined : undefined,
  );

  const groupList = groups as PublicGroup[];
  const selectedGroup = useMemo(
    () => groupList.find((g) => g.id === groupId) ?? groupList[0],
    [groupList, groupId],
  );

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      {/*
        El encabezado se comía media pantalla antes de mostrar un solo dato: un
        "Volver", un título, un subtítulo y recién después los filtros. El nombre
        del torneo lo dice su propia portada, con la foto que cargó el admin.
      */}
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.home)}
        size="small"
        sx={{ mb: 1.5, color: 'text.secondary' }}
      >
        Volver
      </Button>

      <PublicScopeFilters
        editions={scope.editions}
        editionId={scope.editionId}
        onEditionChange={scope.setEditionId}
        isCurrentEdition={scope.isCurrentEdition}
        competitions={scope.competitions}
        competitionId={cid ?? ''}
        onCompetitionChange={(id) => {
          scope.setCompetitionId(id);
          setView('table');
          setGroupId('');
        }}
        allowAll={false}
      />

      {!competition ? (
        <EmptyState
          icon={<EmojiEventsRounded sx={{ fontSize: 32 }} />}
          title="Todavía no hay competiciones"
          description="Cuando arranque la edición vas a ver aquí las tablas de cada torneo."
        />
      ) : (
        <>
          <Box sx={{ mb: 2.5 }}>
            <CompetitionCard competition={competition} compact />
          </Box>

          {isCup && (
            <Tabs
              value={activeView}
              onChange={(_, v: View) => setView(v)}
              sx={{ mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none' } }}
            >
              <Tab value="table" label="Tabla general" />
              <Tab value="groups" label="Grupos" />
              <Tab value="bracket" label="Llaves" />
            </Tabs>
          )}

          {activeView === 'bracket' ? (
            <BracketView rounds={bracket} />
          ) : activeView === 'groups' ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                    Grupos
                  </Typography>
                  <Stack spacing={1}>
                    {groupList.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Todavía no se sortearon los grupos.
                      </Typography>
                    )}
                    {groupList.map((g) => (
                      <Box
                        key={g.id}
                        onClick={() => setGroupId(g.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: selectedGroup?.id === g.id ? 'primary.main' : 'divider',
                          bgcolor: selectedGroup?.id === g.id ? 'primary.soft' : 'transparent',
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ mb: 1 }}
                        >
                          <Typography sx={{ fontWeight: 700 }}>{g.name}</Typography>
                          <Chip size="small" variant="outlined" label={`${g.registrations.length}`} />
                        </Stack>
                        <Stack spacing={0.5}>
                          {g.registrations.map((r) => (
                            <Stack key={r.id} direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                src={r.team.logoUrl ?? undefined}
                                sx={{ width: 20, height: 20, fontSize: 10 }}
                              >
                                {r.team.name[0]}
                              </Avatar>
                              <Typography variant="body2" noWrap>
                                {r.team.name}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                {isLoading ? <Typography>Cargando…</Typography> : <StandingsTable rows={standings} />}
              </Grid>
            </Grid>
          ) : isLoading ? (
            <Typography>Cargando…</Typography>
          ) : (
            <StandingsTable rows={standings} />
          )}
        </>
      )}

      <AdSlot placement="STANDINGS" sx={{ mt: 4 }} />
    </Container>
  );
};

export default PublicCompetitions;
