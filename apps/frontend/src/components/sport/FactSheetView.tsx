import { Box, Card, Stack, Typography, Avatar, Chip, Divider, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { InsightsRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { FactSheet } from '@/api/news.api';

interface Props {
  sheet: FactSheet;
  /** En el panel la ficha va dentro de un cajón angosto y sin encabezado propio. */
  compact?: boolean;
}

/**
 * Dibuja una ficha técnica. La ficha es un objeto plano —titulares, tablas y una
 * serie— y no un tipo por entidad, así que este componente sirve igual para la
 * ficha de una edición, de un torneo o de un club, y también para las que
 * quedaron guardadas hace meses dentro de una publicación.
 */
export const FactSheetView: React.FC<Props> = ({ sheet, compact = false }) => {
  const theme = useTheme();
  const generated = new Date(sheet.generatedAt);

  return (
    <Stack spacing={compact ? 2 : 3}>
      {!compact && (
        <Stack direction="row" spacing={2} alignItems="center">
          {sheet.subject.imageUrl ? (
            <Avatar
              src={sheet.subject.imageUrl}
              alt=""
              variant="rounded"
              sx={{ width: 56, height: 56 }}
            />
          ) : (
            <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'primary.soft', color: 'primary.main' }}>
              <InsightsRounded />
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {sheet.subject.name}
            </Typography>
            {sheet.subject.subtitle && (
              <Typography variant="body2" color="text.secondary">
                {sheet.subject.subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      )}

      {/* Datos de cabecera: lo que define a la entidad, no sus números. */}
      {sheet.facts.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            {sheet.facts.map((f) => (
              <Box key={f.label} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
                  {f.label.toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {f.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Los números gruesos. */}
      {sheet.highlights.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: compact ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
            },
          }}
        >
          {sheet.highlights.map((h, i) => (
            <Card
              key={h.label}
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              sx={{ p: 1.75, textAlign: 'center' }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 26,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {h.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {h.label}
              </Typography>
              {h.hint && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: 10 }}>
                  {h.hint}
                </Typography>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* Las tablas se van al ancho que necesiten y scrollean solas en el teléfono. */}
      {sheet.tables
        .filter((t) => t.rows.length > 0)
        .map((table) => (
          <Card key={table.title} sx={{ p: { xs: 1.5, md: 2 } }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              {table.title}
            </Typography>
            <Box sx={{ overflowX: 'auto', mx: { xs: -0.5, md: 0 } }}>
              <Box
                component="table"
                sx={{
                  width: '100%',
                  minWidth: table.columns.length > 6 ? 560 : 360,
                  borderCollapse: 'collapse',
                  fontSize: 14,
                  '& th, & td': {
                    p: 1,
                    textAlign: 'left',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                  },
                  '& th': { fontWeight: 700, color: 'text.secondary', fontSize: 12 },
                  // Todo lo que no es el nombre son números: alineados a la derecha se leen mejor.
                  '& td:not(:nth-of-type(2)), & th:not(:nth-of-type(2))': { textAlign: 'right' },
                  '& td:nth-of-type(2), & th:nth-of-type(2)': {
                    textAlign: 'left',
                    whiteSpace: 'normal',
                    minWidth: 140,
                  },
                  '& tbody tr:last-of-type td': { borderBottom: 'none' },
                }}
              >
                <thead>
                  <tr>
                    {table.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
            {table.note && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {table.note}
              </Typography>
            )}
          </Card>
        ))}

      {sheet.chart && sheet.chart.values.some((v) => v > 0) && (
        <Card sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {sheet.chart.title}
          </Typography>
          <Box sx={{ height: Math.max(200, sheet.chart.labels.length * 34) }}>
            <BarChart
              // Horizontal: los nombres de equipo no entran debajo de una barra vertical.
              layout="horizontal"
              yAxis={[{ scaleType: 'band', data: sheet.chart.labels }]}
              series={[
                {
                  data: sheet.chart.values,
                  label: sheet.chart.unit ?? '',
                  color: theme.palette.primary.main,
                },
              ]}
              margin={{ left: 130, right: 16, top: 8, bottom: 28 }}
              slotProps={{ legend: { hidden: true } }}
            />
          </Box>
        </Card>
      )}

      <Divider />
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip
          size="small"
          variant="outlined"
          label={`Datos al ${generated.toLocaleDateString('es-VE')}`}
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          Los números quedan congelados al publicar la ficha.
        </Typography>
      </Stack>
    </Stack>
  );
};
