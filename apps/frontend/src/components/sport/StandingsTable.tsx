import { Card, Box, Typography, Stack, Tooltip, Collapse, IconButton, useTheme, useMediaQuery } from '@mui/material';
import type { StandingRow } from '@/api/standings.api';
import { ShieldRounded, ExpandMoreRounded, ExpandLessRounded } from '@mui/icons-material';
import { useState } from 'react';

interface Props {
  rows: StandingRow[];
}

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
            title="Orden: puntos → diferencia de gol → goles a favor. Verde: zona de clasificación. Rojo: descenso."
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
                      boxShadow: `inset 4px 0 0 ${r.zone === 'QUALIFY' ? 'var(--success)' : r.zone === 'RELEGATION' ? 'var(--danger)' : 'transparent'}`,
                      '&:hover': { bgcolor: 'background.default' },
                    }}
                  >
                    <Box component="td" sx={{ p: 1.5, fontWeight: 700, width: 32 }}>{r.position}</Box>
                    <Box component="td" sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <ShieldRounded sx={{ color: 'text.secondary' }} />
                        <Typography sx={{ fontWeight: 600 }}>{r.teamName}</Typography>
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

        <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'success.main' }} />
            <Typography variant="caption">Zona de clasificación</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'error.main' }} />
            <Typography variant="caption">Descenso</Typography>
          </Stack>
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
        sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: row.zone === 'QUALIFY' ? 'success.main' : row.zone === 'RELEGATION' ? 'error.main' : 'transparent', cursor: 'pointer' }}
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
