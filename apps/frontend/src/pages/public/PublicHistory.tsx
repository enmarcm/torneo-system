import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePublicEditionsQuery, usePublicCompetitionsQuery } from '@/hooks/queries';
import { sortCompetitions, getCompetitionAgeGroup, AGE_GROUP_LABELS } from '@/utils/competitionMeta';
import { formatDate } from '@/utils/formatDate';
import type { Edition } from '@/api/editions.api';
import type { Competition } from '@/api/competitions.api';
import { CompetitionCard } from '@/components/sport/CompetitionCard';
import { HistoryCompetitionModal } from '@/components/sport/HistoryCompetitionModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { AdSlot } from '@/components/ui/AdSlot';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Un año con las ediciones que cerraron en él, cada una con sus torneos jugados. */
interface YearBlock {
  year: number;
  editions: Array<{ edition: Edition; competitions: Competition[] }>;
}

/**
 * Archivo del campeonato: los torneos que ya terminaron, ordenados por año y
 * edición. Se llega aquí para zanjar discusiones viejas ("¿quién ganó el
 * Clausura de 2024?"), así que cada filtro vive en la URL y el enlace se puede
 * compartir tal cual.
 */
const PublicHistory: React.FC = () => {
  const { data: editions = [], isLoading: loadingEditions } = usePublicEditionsQuery();
  const { data: rawCompetitions = [], isLoading: loadingCompetitions } = usePublicCompetitionsQuery();

  const [params, setParams] = useSearchParams();
  const year = params.get('y') ?? '';
  const ageGroup = params.get('g') ?? '';
  const format = params.get('f') ?? '';
  const from = params.get('desde') ?? '';
  const to = params.get('hasta') ?? '';
  const oldestFirst = params.get('orden') === 'antiguos';
  const [query, setQuery] = useState('');

  const setParam = useCallback(
    (key: string, value: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const [open, setOpen] = useState<{ competition: Competition; edition?: Edition } | null>(null);

  /*
    "Finalizado" es el torneo cerrado o la edición completa cerrada: una edición
    que se dio por terminada arrastra a todas sus competiciones, aunque alguna
    se haya quedado sin marcar.
  */
  const finished = useMemo(() => {
    const editionById = new Map(editions.map((e: Edition) => [e.id, e]));
    return (rawCompetitions as Competition[])
      .map((c) => ({ competition: c, edition: editionById.get(c.editionId) }))
      .filter(({ competition, edition }) => edition && (competition.status === 'FINISHED' || edition.status === 'FINISHED'));
  }, [editions, rawCompetitions]);

  const years = useMemo(
    () => [...new Set(finished.map(({ edition }) => edition!.year))].sort((a, b) => b - a),
    [finished],
  );

  const blocks = useMemo<YearBlock[]>(() => {
    const q = norm(query.trim());
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTs = to ? new Date(`${to}T23:59:59`).getTime() : null;

    const byEdition = new Map<string, { edition: Edition; competitions: Competition[] }>();
    for (const { competition, edition } of finished) {
      if (!edition) continue;
      if (year && String(edition.year) !== year) continue;
      if (ageGroup && getCompetitionAgeGroup(competition) !== ageGroup) continue;
      if (format && competition.format !== format) continue;
      // Rango por superposición: sirve cualquier edición que haya rozado esas fechas.
      if (fromTs !== null && new Date(edition.endDate).getTime() < fromTs) continue;
      if (toTs !== null && new Date(edition.startDate).getTime() > toTs) continue;
      if (q && !norm(`${competition.name} ${edition.name}`).includes(q)) continue;
      const slot = byEdition.get(edition.id) ?? { edition, competitions: [] };
      slot.competitions.push(competition);
      byEdition.set(edition.id, slot);
    }

    const direction = oldestFirst ? 1 : -1;
    const byYear = new Map<number, YearBlock>();
    for (const slot of [...byEdition.values()].sort(
      (a, b) => direction * (new Date(a.edition.startDate).getTime() - new Date(b.edition.startDate).getTime()),
    )) {
      const block = byYear.get(slot.edition.year) ?? { year: slot.edition.year, editions: [] };
      block.editions.push({ edition: slot.edition, competitions: sortCompetitions(slot.competitions) });
      byYear.set(slot.edition.year, block);
    }
    return [...byYear.values()].sort((a, b) => direction * (a.year - b.year));
  }, [finished, year, ageGroup, format, from, to, query, oldestFirst]);

  const total = blocks.reduce((n, b) => n + b.editions.reduce((m, e) => m + e.competitions.length, 0), 0);
  const filtering = !!(year || ageGroup || format || from || to || query);
  const clear = () => {
    setQuery('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Typography component="h1" variant="h2" sx={{ mb: 0.5 }}>Histórico</Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Los torneos que ya se jugaron: tablas finales, llaves y campeones de cada edición.
      </Typography>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por torneo o edición"
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar torneo' },
              input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> },
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap sx={{ flexWrap: { sm: 'wrap' } }}>
            <FormControl size="small" sx={{ minWidth: { sm: 130 } }}>
              <InputLabel>Año</InputLabel>
              <Select label="Año" value={year} onChange={(e) => setParam('y', e.target.value as string)}>
                <MenuItem value="">Todos</MenuItem>
                {years.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { sm: 150 } }}>
              <InputLabel>Categoría</InputLabel>
              <Select label="Categoría" value={ageGroup} onChange={(e) => setParam('g', e.target.value as string)}>
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="ADULT">{AGE_GROUP_LABELS.ADULT}</MenuItem>
                <MenuItem value="YOUTH">{AGE_GROUP_LABELS.YOUTH}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { sm: 150 } }}>
              <InputLabel>Formato</InputLabel>
              <Select label="Formato" value={format} onChange={(e) => setParam('f', e.target.value as string)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="LEAGUE">Liga</MenuItem>
                <MenuItem value="GROUPS_KNOCKOUT">Copa</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Desde"
              value={from}
              onChange={(e) => setParam('desde', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              type="date"
              label="Hasta"
              value={to}
              onChange={(e) => setParam('hasta', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" sx={{ minWidth: { sm: 170 } }}>
              <InputLabel>Orden</InputLabel>
              <Select label="Orden" value={oldestFirst ? 'antiguos' : 'recientes'} onChange={(e) => setParam('orden', e.target.value === 'antiguos' ? 'antiguos' : '')}>
                <MenuItem value="recientes">Más recientes primero</MenuItem>
                <MenuItem value="antiguos">Más antiguos primero</MenuItem>
              </Select>
            </FormControl>
            {filtering && <Button onClick={clear}>Limpiar filtros</Button>}
          </Stack>
        </Stack>
      </Card>

      {loadingEditions || loadingCompetitions ? (
        <MatchLoader />
      ) : blocks.length === 0 ? (
        <EmptyState
          variant="search"
          title={filtering ? 'Ningún torneo coincide con esos filtros' : 'Todavía no hay torneos finalizados'}
          description={filtering ? 'Prueba con otro año o quita algún filtro.' : 'Cuando una edición termine, sus tablas y campeones quedarán guardados aquí.'}
          actionLabel={filtering ? 'Limpiar filtros' : undefined}
          onAction={filtering ? clear : undefined}
        />
      ) : (
        <Stack spacing={4}>
          <Typography variant="body2" color="text.secondary">
            {total} {total === 1 ? 'torneo finalizado' : 'torneos finalizados'}
          </Typography>
          {blocks.map((block) => (
            <Box key={block.year} component="section" aria-label={`Torneos de ${block.year}`}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                {block.year}
              </Typography>
              <Stack spacing={3}>
                {block.editions.map(({ edition, competitions }) => (
                  <Box key={edition.id}>
                    <Stack direction="row" alignItems="center" spacing={1.5} useFlexGap sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{edition.name}</Typography>
                      <Chip size="small" variant="outlined" label={`${formatDate(edition.startDate)} → ${formatDate(edition.endDate)}`} />
                    </Stack>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
                      {competitions.map((competition) => (
                        <CompetitionCard
                          key={competition.id}
                          competition={competition}
                          compact
                          onClick={() => setOpen({ competition, edition })}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {open && <HistoryCompetitionModal competition={open.competition} edition={open.edition} onClose={() => setOpen(null)} />}
      <AdSlot placement="STANDINGS" sx={{ mt: 4 }} />
    </Container>
  );
};

export default PublicHistory;
