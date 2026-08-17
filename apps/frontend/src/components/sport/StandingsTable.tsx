import { Card, Box, Typography, Stack, Tooltip, Collapse, IconButton, Chip, useTheme, useMediaQuery } from '@mui/material';
import type { StandingRow } from '@/api/standings.api';
import { ShieldRounded, ExpandMoreRounded, ExpandLessRounded } from '@mui/icons-material';
import { useState } from 'react';
import { getStatusLabel, getStatusColor } from '@/utils/statusLabels';

interface Props {
  rows: StandingRow[];
}

/** Franja lateral que marca en qué zona de la tabla quedó el equipo. */
const zoneColor = (zone: StandingRow['zone']) => {
  if (zone === 'PROMOTION') return 'var(--info, #2563eb)';
  if (zone === 'QUALIFY') return 'var(--success)';
  if (zone === 'RELEGATION') return 'var(--danger)';
  return 'transparent';
};

export const StandingsTable: React.FC<Props> = ({ rows }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!rows || rows.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Aún no hay partidos finalizados en esta competición.</Typography>
      </Card>
    );
  }

  return (
    <Card>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4">Tabla de posiciones</Typography>
          <Tooltip
            title="Orden: puntos → enfrentamiento directo entre los equipos empatados → diferencia de gol → goles a favor. Azul: ascenso. Verde: clasificación. Rojo: descenso."
            arrow
          >
            <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: 'background.default', display: 'grid', placeItems: 'center', cursor: 'help', fontSize: 11, color: 'text.secondary' }}>
              ?
            </Box>
          </Tooltip>
        </Stack>

        {isMobile ? (
          <Stack spacing={1}>
            {rows.map((r) => (
              <MobileStandingRow key={r.registrationId} row={r} />
            ))}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: 'background.default' }}>
                  {['#', 'Equipo', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'Pts'].map((h, i) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{ p: 1.5, fontSize: 12, fontWeight: 600, color: 'text.secondary', textAlign: i <= 1 ? 'left' : 'right' }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {rows.map((r) => (
                  <Box
                    component="tr"
                    key={r.registrationId}
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      boxShadow: `inset 4px 0 0 ${zoneColor(r.zone)}`,
                      opacity: r.outcome === 'WITHDRAWN' ? 0.55 : 1,
                      '&:hover': { bgcolor: 'background.default' },
                    }}
                  >
                    <Box component="td" sx={{ p: 1.5, fontWeight: 700, width: 32 }}>{r.position}</Box>
                    <Box component="td" sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <ShieldRounded sx={{ color: 'text.secondary' }} />
                        <Typography sx={{ fontWeight: 600 }}>{r.teamName}</Typography>
                        {r.outcome !== 'NONE' && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color={getStatusColor(r.outcome)}
                            label={getStatusLabel(r.outcome)}
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>{r.pj}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>{r.g}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>{r.e}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>{r.p}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>{r.gf}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>{r.gc}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right', color: r.dg > 0 ? 'success.main' : r.dg < 0 ? 'error.main' : 'text.secondary' }}>
                      {r.dg > 0 ? `+${r.dg}` : r.dg}
                    </Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{r.pts}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
        >
          {rows.some((r) => r.zone === 'PROMOTION') && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'info.main' }} />
              <Typography variant="caption">Ascenso</Typography>
            </Stack>
          )}
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'success.main' }} />
            <Typography variant="caption">Zona de clasificación</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'error.main' }} />
            <Typography variant="caption">Descenso</Typography>
          </Stack>
          <Typography variant="caption" color="text.disabled">
            El ascenso y el descenso definitivos los decide el administrador.
          </Typography>
        </Stack>
      </Box>
    </Card>
  );
};

const MobileStandingRow: React.FC<{ row: StandingRow }> = ({ row }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: zoneColor(row.zone), cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <Typography sx={{ fontWeight: 700, width: 24, fontSize: 14 }}>{row.position}</Typography>
        <ShieldRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontWeight: 600, flex: 1, fontSize: 14 }} noWrap>{row.teamName}</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">{row.pj}PJ</Typography>
          <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right', fontSize: 16 }}>{row.pts}</Typography>
        </Stack>
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          {open ? <ExpandLessRounded fontSize="small" /> : <ExpandMoreRounded fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 1.5, pt: 0.5, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
          {[
            { label: 'G', value: row.g },
            { label: 'E', value: row.e },
            { label: 'P', value: row.p },
            { label: 'GF', value: row.gf },
            { label: 'GC', value: row.gc },
            { label: 'DG', value: row.dg > 0 ? `+${row.dg}` : row.dg },
          ].map((s) => (
            <Box key={s.label} sx={{ textAlign: 'center', p: 0.75, borderRadius: 1.5, bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums', color: s.label === 'DG' ? (row.dg > 0 ? 'success.main' : row.dg < 0 ? 'error.main' : 'text.primary') : 'text.primary' }}>
                {String(s.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
