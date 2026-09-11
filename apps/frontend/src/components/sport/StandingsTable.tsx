import { Card, Box, Typography, Stack, Tooltip, Collapse, IconButton, Chip, useTheme, useMediaQuery } from '@mui/material';
import { Crest } from '@/components/ui/Crest';
import type { StandingRow } from '@/api/standings.api';
import { ShieldRounded, ExpandMoreRounded, ExpandLessRounded } from '@mui/icons-material';
import { useState } from 'react';
import { getStatusLabel, getStatusColor } from '@/utils/statusLabels';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  rows: StandingRow[];
  /**
   * Equipos inscritos, para cuando todavía no hay resultados: en vez de una
   * pantalla en blanco se muestran en orden alfabético con guiones, y la tabla
   * se ordena sola con el primer partido finalizado.
   */
  ghostTeams?: Array<{ id: string; name: string; logoUrl: string | null }>;
}

/** Franja lateral que marca en qué zona de la tabla quedó el equipo. */
const zoneColor = (zone: StandingRow['zone']) => {
  if (zone === 'QUALIFY') return 'var(--success)';
  if (zone === 'RELEGATION') return 'var(--danger)';
  return 'transparent';
};

/**
 * Escudo del equipo. La tabla dibujaba siempre el mismo icono genérico y el
 * escudo cargado nunca llegaba a verse, aunque venía en la fila. Cuando el
 * equipo no tiene escudo se cae a la inicial del nombre, que al menos
 * distingue una fila de otra.
 */
const TeamCrest: React.FC<{ row: StandingRow; size: number }> = ({ row, size }) => (
  <Crest
    src={row.logoUrl ?? undefined}
    alt={row.teamName}
    variant="rounded"
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      // Sin escudo hace de placa para la inicial; con escudo no se le pone
      // fondo, que taparía la transparencia del logo con un cuadro gris.
      bgcolor: row.logoUrl ? 'transparent' : 'background.default',
      color: 'text.secondary',
      fontSize: size * 0.42,
      fontWeight: 700,
      // El escudo es más alto que ancho: se muestra entero, sin recortarlo.
      '& img': { objectFit: 'contain' },
    }}
  >
    {row.teamName.trim().charAt(0).toUpperCase() || <ShieldRounded sx={{ fontSize: size * 0.6 }} />}
  </Crest>
);

export const StandingsTable: React.FC<Props> = ({ rows, ghostTeams }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const hasQualify = (rows ?? []).some((r) => r.zone === 'QUALIFY');
  const hasRelegation = (rows ?? []).some((r) => r.zone === 'RELEGATION');

  if (!rows || rows.length === 0) {
    const ghosts = [...(ghostTeams ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (ghosts.length === 0) {
      return (
        <EmptyState
          variant="table"
          title="La tabla se arma con el primer resultado"
          description="Todavía no hay equipos inscritos en esta competición."
        />
      );
    }
    return (
      <Card sx={{ overflow: 'hidden' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead" sx={{ bgcolor: 'background.default' }}>
            <Box component="tr">
              {['#', '', 'Equipo', 'PJ', 'PTS'].map((h, i) => (
                <Box
                  component="th"
                  key={i}
                  sx={{ p: 1.5, fontSize: 12, fontWeight: 600, color: 'text.secondary', textAlign: i >= 3 ? 'right' : 'left', width: i === 0 ? 32 : i === 1 ? 40 : i >= 3 ? 56 : undefined }}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {ghosts.map((t, i) => (
              <Box
                component="tr"
                key={t.id}
                sx={{ borderTop: '1px solid', borderColor: 'divider', animation: 'llfRise 0.3s cubic-bezier(.2,.7,.2,1) both', animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <Box component="td" className="tabular" sx={{ p: 1.5, color: 'text.disabled' }}>–</Box>
                <Box component="td" sx={{ p: 1.5, pr: 0 }}>
                  <TeamCrest row={{ teamName: t.name, logoUrl: t.logoUrl } as StandingRow} size={28} />
                </Box>
                <Box component="td" sx={{ p: 1.5, fontWeight: 600 }}>{t.name}</Box>
                <Box component="td" className="tabular" sx={{ p: 1.5, textAlign: 'right', color: 'text.disabled' }}>0</Box>
                <Box component="td" className="tabular" sx={{ p: 1.5, textAlign: 'right', color: 'text.disabled' }}>–</Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
          La tabla se ordena con el primer resultado. Hasta entonces, los equipos van en orden alfabético.
        </Typography>
      </Card>
    );
  }

  return (
    <Card>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4">Tabla de posiciones</Typography>
          <Tooltip
            title="Orden: puntos → enfrentamiento directo entre los equipos empatados → diferencia de gol → goles a favor. Verde: clasificación. Rojo: descenso."
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
                    className="llf-row"
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      boxShadow: `inset 4px 0 0 ${zoneColor(r.zone)}`,
                      opacity: r.outcome === 'WITHDRAWN' ? 0.55 : 1,
                    }}
                  >
                    <Box component="td" sx={{ p: 1.5, fontWeight: 700, width: 32 }}>{r.position}</Box>
                    <Box component="td" sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <TeamCrest row={r} size={28} />
                        <Typography className="llf-row-name" sx={{ fontWeight: 600 }}>{r.teamName}</Typography>
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

        {/*
          Solo se explica el color que la tabla realmente está usando: una
          referencia de una zona que no aparece en ninguna fila hace buscar algo
          que no está.
        */}
        {(hasQualify || hasRelegation) && (
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
          >
            {hasQualify && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'success.main' }} />
                <Typography variant="caption">Zona de clasificación</Typography>
              </Stack>
            )}
            {hasRelegation && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'error.main' }} />
                <Typography variant="caption">Descenso</Typography>
              </Stack>
            )}
            <Typography variant="caption" color="text.disabled">
              El descenso definitivo lo decide el administrador.
            </Typography>
          </Stack>
        )}
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
        <TeamCrest row={row} size={24} />
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
