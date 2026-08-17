import { Card, Box, Stack, IconButton, Typography, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import {
  EditRounded,
  DeleteRounded,
  ToggleOnRounded,
  VisibilityRounded,
  MoreHorizRounded,
} from '@mui/icons-material';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  hideInMobile?: boolean;
}

export type DataTableActionColor = 'primary' | 'error' | 'success' | 'warning' | 'inherit';

export interface DataTableAction<T> {
  label: string | ((row: T) => string);
  /** Igual que `label`, acepta función para depender de la fila. */
  icon?: ReactNode | ((row: T) => ReactNode);
  onClick: (row: T) => void;
  /**
   * Acepta función para que el color siga al estado de la fila: por ejemplo,
   * rojo en "Desactivar" y verde en "Activar", que son la misma acción invertida.
   */
  color?: DataTableActionColor | ((row: T) => DataTableActionColor);
  divider?: boolean;
}

interface Props<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: DataTableAction<T>[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  error,
  onRetry,
  emptyTitle = 'Aún no hay registros',
  emptyDescription = 'Crea el primero para empezar.',
  actions,
  getRowKey,
  onRowClick,
}: Props<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) return <LoadingState rows={4} />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (!rows || rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.map((row, i) => (
          <motion.div
            key={getRowKey(row)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.03 }}
          >
            <Card
              sx={{ p: 2, pt: 3, position: 'relative', cursor: onRowClick ? 'pointer' : undefined }}
              onClick={() => onRowClick?.(row)}
            >
              {actions && actions.length > 0 && (
                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                  <RowActionsIcons actions={actions} row={row} />
                </Box>
              )}
              {columns
                .filter((c) => !c.hideInMobile)
                .map((c) => (
                  <Box key={c.key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {c.label}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>{c.render(row)}</Box>
                  </Box>
                ))}
            </Card>
          </motion.div>
        ))}
      </Stack>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead" sx={{ bgcolor: 'background.default' }}>
            <Box component="tr">
              {columns.map((c) => (
                <Box
                  component="th"
                  key={c.key}
                  sx={{
                    textAlign: c.align ?? 'left',
                    p: 1.5,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'text.secondary',
                    width: c.width,
                  }}
                >
                  {c.label}
                </Box>
              ))}
              {actions && actions.length > 0 && (
                <Box component="th" sx={{ width: 48, p: 1.5 }} />
              )}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.map((row, i) => (
              <motion.tr
                key={getRowKey(row)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.02 }}
                style={{ display: 'table-row', cursor: onRowClick ? 'pointer' : undefined }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <Box
                    component="td"
                    key={c.key}
                    sx={{
                      p: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      textAlign: c.align ?? 'left',
                      fontSize: 14,
                    }}
                  >
                    {c.render(row)}
                  </Box>
                ))}
                {actions && actions.length > 0 && (
                  <Box
                    component="td"
                    sx={{ p: 0.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'right', whiteSpace: 'nowrap' }}
                  >
                    <RowActionsIcons actions={actions} row={row} />
                  </Box>
                )}
              </motion.tr>
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

function RowActionsIcons<T>({ actions, row }: { actions: DataTableAction<T>[]; row: T }) {
  /**
   * Lo correcto es que cada acción traiga su `icon`. Esto es solo una red de
   * seguridad por si alguna se define sin él: antes cualquier etiqueta
   * desconocida caía en el lápiz de "editar", así que acciones distintas
   * terminaban con el mismo icono y parecían la misma cosa.
   */
  const getIcon = (a: DataTableAction<T>) => {
    if (a.icon) return typeof a.icon === 'function' ? a.icon(row) : a.icon;
    const label = (typeof a.label === 'function' ? a.label(row) : a.label).toLowerCase();
    if (label.includes('editar') || label.includes('edit')) return <EditRounded fontSize="small" />;
    if (
      label.includes('eliminar') ||
      label.includes('delete') ||
      label.includes('remove') ||
      label.includes('desactivar')
    ) {
      return <DeleteRounded fontSize="small" />;
    }
    if (label.includes('activar')) return <ToggleOnRounded fontSize="small" />;
    if (label.includes('detalle') || label.includes('ver ')) return <VisibilityRounded fontSize="small" />;
    return <MoreHorizRounded fontSize="small" />;
  };
  const getColor = (a: DataTableAction<T>): DataTableActionColor =>
    (typeof a.color === 'function' ? a.color(row) : a.color) ?? 'inherit';
  return (
    <Stack direction="row" spacing={0.25}>
      {actions.map((a, i) => (
        <Tooltip key={i} title={typeof a.label === 'function' ? a.label(row) : a.label}>
          <IconButton size="small" color={getColor(a)} onClick={() => a.onClick(row)} sx={{ p: 0.5 }}>
            {getIcon(a)}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
}
