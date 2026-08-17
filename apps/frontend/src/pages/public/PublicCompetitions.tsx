import {
  Box,
  Container,
  Grid2 as Grid,
  Card,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
} from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePublicEditionsQuery,
  usePublicCompetitionsQuery,
  usePublicStandingsQuery,
  usePublicGroupsQuery,
  useBracketQuery,
} from '@/hooks/queries';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { BracketView } from '@/components/sport/BracketView';
import { ROUTES } from '@/routes/routes';
import type { Edition, Competition } from '@/api/public.api';

type View = 'table' | 'groups' | 'bracket';

interface PublicGroup {
  id: string;
  name: string;
  registrations: Array<{ id: string; team: { id: string; name: string; logoUrl: string | null } }>;
}

const PublicCompetitions: React.FC = () => {
  const navigate = useNavigate();
  const { data: editions = [] } = usePublicEditionsQuery();
  const [editionId, setEditionId] = useState('');
  const eid: string | undefined = editionId || editions[0]?.id;
  const { data: comps = [] } = usePublicCompetitionsQuery(eid);
  const [compId, setCompId] = useState('');
  const cid: string | undefined = compId || comps[0]?.id;

  const competition = comps.find((c: Competition) => c.id === cid);
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.home)}
        sx={{ mb: 1, color: 'text.secondary' }}
      >
        Volver
      </Button>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Competiciones
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Edición</InputLabel>
          <Select
            label="Edición"
            value={eid ?? ''}
            onChange={(e) => {
              setEditionId(e.target.value as string);
              setCompId('');
            }}
          >
            {editions.map((e: Edition) => (
              <MenuItem key={e.id} value={e.id}>
                {e.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Competición</InputLabel>
          <Select
            label="Competición"
            value={cid ?? ''}
            onChange={(e) => {
              setCompId(e.target.value as string);
              setView('table');
              setGroupId('');
            }}
          >
            {comps.map((c: Competition) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {isCup && (
        <Tabs
          value={activeView}
          onChange={(_, v: View) => setView(v)}
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none' } }}
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
            {isLoading ? (
              <Typography>Cargando…</Typography>
            ) : (
              <StandingsTable rows={standings} />
            )}
          </Grid>
        </Grid>
      ) : isLoading ? (
        <Typography>Cargando…</Typography>
      ) : (
        <StandingsTable rows={standings} />
      )}
    </Container>
  );
};

export default PublicCompetitions;
