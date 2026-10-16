import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Card, MenuItem, Stack, TextField, Button } from '@mui/material';
import { historyApi, type HistoryFilters, type HistoryReportRow } from '@/api/history.api';
import { useCompetitionsQuery, useEditionsQuery } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/common/useDebouncedValue';

export const HistoryControls: React.FC<{ value: HistoryFilters; onChange: (filters: HistoryFilters) => void; report?: boolean; teamFilter?: boolean }> = ({ value, onChange, report = false, teamFilter = false }) => {
  const { data: editions = [] } = useEditionsQuery();
  const { data: competitions = [] } = useCompetitionsQuery(value.editionId);
  const [teamSearch, setTeamSearch] = useState('');
  const [team, setTeam] = useState<HistoryReportRow | null>(null);
  const settledTeamSearch = useDebouncedValue(teamSearch);
  const teams = useQuery({ queryKey: ['history', 'team-options', settledTeamSearch], queryFn: () => historyApi.report('teams', { q: settledTeamSearch, sort: 'name', limit: 25 }), enabled: teamFilter, staleTime: 30000 });
  const set = (key: keyof HistoryFilters, next: unknown) => onChange({ ...value, [key]: next || undefined, page: 1 });
  const available = competitions.filter((c) => (!value.ageGroup || c.ageGroup === value.ageGroup));
  return <Card sx={{ p: 2.5, mb: 3 }}><Stack direction="row" useFlexGap flexWrap="wrap" gap={2}>
    {report && <TextField size="small" label="Buscar por nombre o documento" value={value.q ?? ''} onChange={(e) => set('q', e.target.value)} sx={{ flex: '1 1 230px' }} />}
    <TextField select size="small" label="Año" value={value.year ?? ''} onChange={(e) => onChange({ ...value, year: e.target.value ? Number(e.target.value) : undefined, editionId: undefined, competitionId: undefined, page: 1 })} sx={{ flex: '1 1 120px' }}>
      <MenuItem value="">Todos</MenuItem>{[...new Set(editions.map((e) => e.year))].sort((a, b) => b - a).map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
    </TextField>
    <TextField select size="small" label="Edición" value={value.editionId ?? ''} onChange={(e) => onChange({ ...value, editionId: e.target.value || undefined, competitionId: undefined, page: 1 })} sx={{ flex: '1 1 180px' }}>
      <MenuItem value="">Todas</MenuItem>{editions.filter((e) => !value.year || e.year === value.year).map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
    </TextField>
    <TextField select size="small" label="Apartado" value={value.ageGroup ?? ''} onChange={(e) => onChange({ ...value, ageGroup: (e.target.value || undefined) as HistoryFilters['ageGroup'], competitionId: undefined, page: 1 })} sx={{ flex: '1 1 140px' }}>
      <MenuItem value="">Ambos</MenuItem><MenuItem value="ADULT">Adultos</MenuItem><MenuItem value="YOUTH">Menores</MenuItem>
    </TextField>
    <TextField select size="small" label="Competición" value={value.competitionId ?? ''} onChange={(e) => set('competitionId', e.target.value)} sx={{ flex: '1 1 210px' }}>
      <MenuItem value="">Todas</MenuItem>{available.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} · {editions.find((e) => e.id === c.editionId)?.name}</MenuItem>)}
    </TextField>
    {teamFilter && <Autocomplete size="small" sx={{ flex: '1 1 220px' }} value={team} options={teams.data?.rows ?? []} loading={teams.isFetching}
      getOptionLabel={(option) => option.name} isOptionEqualToValue={(a, b) => a.id === b.id} filterOptions={(options) => options}
      onInputChange={(_e, input) => setTeamSearch(input)} onChange={(_e, option) => { setTeam(option); set('teamId', option?.id); }}
      noOptionsText={teams.isError ? 'No se pudo consultar equipos' : 'Sin equipos encontrados'} loadingText="Buscando equipos…"
      renderInput={(params) => <TextField {...params} label="Equipo" placeholder="Escribe para buscar" />} />}
    {report && <TextField select size="small" label="Estado del registro" value={value.status ?? ''} onChange={(e) => set('status', e.target.value)} sx={{ flex: '1 1 180px' }}>
      <MenuItem value="">Activos e inactivos</MenuItem><MenuItem value="ACTIVE">Activos</MenuItem><MenuItem value="INACTIVE">Inactivos</MenuItem>
    </TextField>}
    {report && <TextField select size="small" label="Ordenar por" value={value.sort ?? 'goals'} onChange={(e) => set('sort', e.target.value)} sx={{ flex: '1 1 150px' }}>
      <MenuItem value="goals">Goles</MenuItem><MenuItem value="matches">Partidos</MenuItem><MenuItem value="tournaments">Torneos</MenuItem><MenuItem value="name">Nombre</MenuItem>
    </TextField>}
    <Button onClick={() => { setTeam(null); setTeamSearch(''); onChange({ page: 1, limit: value.limit }); }}>Limpiar filtros</Button>
  </Stack></Card>;
};
