import { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  SearchRounded,
  BadgeRounded,
  SportsSoccerRounded,
  StyleRounded,
  EmojiEventsRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/api/public.api';
import { StatCard } from '@/components/ui/StatCard';
import { CompetitionTags } from '@/components/sport/CompetitionTags';
import { extractErrorMessage } from '@/api/axios';

/**
 * Buscador público de jugadores por documento.
 *
 * Se busca por cédula y no por nombre a propósito: en una liga hay homónimos,
 * y el documento es lo único que identifica a una persona sin ambigüedad. De
 * paso, exigir el número completo evita que la página sirva para listar a
 * todos los jugadores registrados sin conocer a ninguno.
 */
const PublicPlayerSearch: React.FC = () => {
  const [input, setInput] = useState('');
  /* La consulta se dispara al enviar, no al tipear: cada tecla no es una búsqueda. */
  const [query, setQuery] = useState('');

  const { data, isFetching, error } = useQuery({
    queryKey: ['public', 'player-by-document', query],
    queryFn: () => publicApi.playerByDocument(query),
    enabled: query.trim().length >= 4,
    retry: false,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(input.trim());
  };

  const career = data?.career ?? [];

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Ficha del jugador
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Escribí la cédula para ver en qué equipos y torneos jugó, y sus goles y tarjetas.
      </Typography>

      <Card sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack
          component="form"
          onSubmit={submit}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
        >
          <TextField
            fullWidth
            label="Cédula"
            placeholder="Ej: 12345678"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            InputProps={{ startAdornment: <BadgeRounded sx={{ mr: 1, color: 'text.disabled' }} /> }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchRounded />}
            disabled={input.trim().length < 4 || isFetching}
            sx={{ flexShrink: 0 }}
          >
            {isFetching ? 'Buscando…' : 'Buscar'}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: 'block' }}>
          Hace falta el número completo. La ficha no muestra la cédula entera.
        </Typography>
      </Card>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {extractErrorMessage(error, 'No encontramos un jugador con ese documento')}
        </Alert>
      )}

      {data && (
        <>
          <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={data.player.photoUrl ?? undefined}
                sx={{ width: 64, height: 64, fontSize: 24, fontWeight: 700 }}
              >
                {data.player.firstName[0]}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {data.player.firstName} {data.player.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  C.I. {data.player.documentMasked}
                </Typography>
                {data.teams.length > 0 && (
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                    {data.teams.map((t) => (
                      <Chip key={t.id} size="small" variant="outlined" label={t.name} />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Card>

          <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
            <Box sx={{ flex: '1 1 160px' }}>
              <StatCard
                label="Partidos"
                value={data.totals.matchesPlayed}
                icon={<SportsSoccerRounded />}
                tint="primary"
              />
            </Box>
            <Box sx={{ flex: '1 1 160px' }}>
              <StatCard
                label="Goles"
                value={data.totals.goals}
                icon={<EmojiEventsRounded />}
                tint="success"
              />
            </Box>
            <Box sx={{ flex: '1 1 160px' }}>
              <StatCard
                label="Amarillas"
                value={data.totals.yellowCards}
                icon={<StyleRounded />}
                tint="warning"
              />
            </Box>
            <Box sx={{ flex: '1 1 160px' }}>
              <StatCard
                label="Rojas"
                value={data.totals.redCards}
                icon={<StyleRounded />}
                tint="danger"
              />
            </Box>
          </Stack>

          <Typography variant="h4" sx={{ mb: 2 }}>
            Torneos jugados
          </Typography>
          {career.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Todavía no está inscrito en ninguna competición.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {career.map((c) => (
                <Card key={c.rosterEntryId} sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ sm: 'center' }}
                  >
                    <Avatar
                      src={c.team.logoUrl ?? undefined}
                      variant="rounded"
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: c.team.logoUrl ? 'transparent' : 'background.default',
                        color: 'text.secondary',
                        '& img': { objectFit: 'contain' },
                      }}
                    >
                      {c.team.name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{c.team.name}</Typography>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.5 }}
                      >
                        <CompetitionTags competition={c.competition} />
                        {c.edition && (
                          <Typography variant="caption" color="text.secondary">
                            {c.edition.name}
                          </Typography>
                        )}
                        {c.jerseyNumber != null && (
                          <Chip size="small" variant="outlined" label={`#${c.jerseyNumber}`} />
                        )}
                      </Stack>
                    </Box>
                    <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />
                    <Stack direction="row" spacing={2}>
                      {[
                        { label: 'PJ', value: c.stats.matchesPlayed },
                        { label: 'Goles', value: c.stats.goals },
                        { label: 'TA', value: c.stats.yellowCards },
                        { label: 'TR', value: c.stats.redCards },
                      ].map((s) => (
                        <Box key={s.label} sx={{ textAlign: 'center', minWidth: 40 }}>
                          <Typography
                            sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                          >
                            {s.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.label}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
};

export default PublicPlayerSearch;
