import { Card, Box, Stack, IconButton, Typography, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, useTheme, useMediaQuery } from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import ToggleOnRounded from '@mui/icons-material/ToggleOnRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import { useId, useState, type ReactNode } from 'react';
import { TableSkeleton } from './LoadingState';
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
  mobileLayout?: 'cards' | 'list';
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
  mobileLayout = 'list',
}: Props<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) return <TableSkeleton rows={5} columns={Math.min(columns.length, 6)} />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (!rows || rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;

  if (isMobile) {
    if (mobileLayout === 'list') {
      const visibleColumns = columns.filter((column) => !column.hideInMobile);
      return <Card variant="outlined" sx={{ boxShadow: 'none', overflow: 'hidden' }}>
        {rows.map((row, index) => <Box key={getRowKey(row)} sx={{ p: 1.5, minWidth: 0, borderTop: index ? '1px solid' : undefined, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Box
              component={onRowClick ? 'button' : 'div'}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={{ flex: 1, minWidth: 0, p: 0, border: 0, bgcolor: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: onRowClick ? 'pointer' : undefined, borderRadius: 1 }}
            >{visibleColumns[0]?.render(row)}</Box>
            {actions && actions.length > 0 && <RowActionsIcons actions={actions} row={row} compact />}
          </Stack>
          {visibleColumns.slice(1).map((column) => <Stack key={column.key} direction="row" alignItems="flex-start" spacing={1.5} sx={{ mt: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 76 }}>{column.label}</Typography>
            <Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{column.render(row)}</Box>
          </Stack>)}
        </Box>)}
      </Card>;
    }
    return (
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Box
            key={getRowKey(row)}

          >
            <Card
              sx={{ p: 2, minWidth: 0, cursor: onRowClick ? 'pointer' : undefined }}
              onClick={() => onRowClick?.(row)}
            >
              {columns
                .filter((c) => !c.hideInMobile)
                .map((c) => (
                  <Box key={c.key} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 1.5, py: 0.75, alignItems: 'start' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                      {c.label}
                    </Typography>
                    <Box sx={{ textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere', '& .MuiStack-root': { minWidth: 0, flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }, '& .MuiAvatar-root': { flexShrink: 0 }, '& .MuiChip-root': { maxWidth: '100%' }, '& .MuiTypography-root': { whiteSpace: 'normal', overflowWrap: 'anywhere' } }}>{c.render(row)}</Box>
                  </Box>
                ))}
              {actions && actions.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <RowActionsIcons actions={actions} row={row} compact />
                </Box>
              )}
            </Card>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflow: 'auto', maxHeight: '70dvh' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead" sx={{ bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1 }}>
            <Box component="tr">
              {columns.map((c) => (
                <Box
                  component="th"
                  key={c.key}
                  scope="col"
                  sx={{
                    textAlign: c.align ?? 'left',
                    p: 1.5,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'text.secondary',
                    width: c.width,
                  }}
                >
                  {c.label}
                </Box>
              ))}
              {actions && actions.length > 0 && (
                <Box component="th" scope="col" sx={{ width: 80, p: 1.5, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>Acciones</Box>
              )}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.map((row) => (
              <Box component="tr"
                key={getRowKey(row)}

                className={onRowClick ? 'llf-row' : undefined}
                style={{ display: 'table-row', cursor: onRowClick ? 'pointer' : undefined }}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onRowClick?.(row);
                  }
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <Box
                    component="td"
                    key={c.key}
                    sx={{
                      p: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'var(--rowBorder)',
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: c.align ?? 'left',
                      fontSize: 14,
                      verticalAlign: 'middle',
                    }}
                  >
                    {c.render(row)}
                  </Box>
                ))}
                {actions && actions.length > 0 && (
                  <Box
                    component="td"
                    sx={{ px: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
                  >
                    <RowActionsIcons actions={actions} row={row} compact />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

function RowActionsIcons<T>({ actions, row, compact = false }: { actions: DataTableAction<T>[]; row: T; compact?: boolean }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const visibleActions = compact ? [] : actions.length > 3 ? actions.slice(0, 2) : actions;
  const overflowActions = compact ? actions : actions.length > 3 ? actions.slice(2) : [];
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
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ width: 'max-content', ml: 'auto', flexWrap: 'nowrap' }} justifyContent="flex-end" onClick={(event) => event.stopPropagation()}>
      {visibleActions.map((a, i) => (
        <Tooltip key={i} title={typeof a.label === 'function' ? a.label(row) : a.label}>
          <IconButton aria-label={typeof a.label === 'function' ? a.label(row) : a.label} size="small" color={getColor(a)} onClick={() => a.onClick(row)} sx={{ p: 0.75, flexShrink: 0, minWidth: { xs: 44, md: 32 }, minHeight: { xs: 44, md: 32 } }}>
            {getIcon(a)}
          </IconButton>
        </Tooltip>
      ))}
      {overflowActions.length > 0 && (
        <>
          <Tooltip title="Más acciones">
            <IconButton
              id={`${menuId}-trigger`}
              aria-label="Más acciones"
              aria-haspopup="menu"
              aria-controls={anchorEl ? menuId : undefined}
              aria-expanded={anchorEl ? true : undefined}
              onClick={(event) => setAnchorEl(event.currentTarget)}
              size="small"
              sx={{ p: 0.75, flexShrink: 0, minWidth: { xs: 44, md: 32 }, minHeight: { xs: 44, md: 32 } }}
            >
              <MoreHorizRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            id={menuId}
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            MenuListProps={{ 'aria-labelledby': `${menuId}-trigger` }}
          >
            {overflowActions.flatMap((action, index) => [
                ...(action.divider && index > 0 ? [<Divider key={`divider-${index}`} />] : []),
                <MenuItem key={index} onClick={() => { setAnchorEl(null); action.onClick(row); }} sx={{ minHeight: 44, color: getColor(action) === 'inherit' ? 'text.primary' : `${getColor(action)}.main` }}>
                  <ListItemIcon sx={{ color: 'inherit' }}>{getIcon(action)}</ListItemIcon>
                  <ListItemText>{typeof action.label === 'function' ? action.label(row) : action.label}</ListItemText>
                </MenuItem>,
            ])}
          </Menu>
        </>
      )}
    </Stack>
  );
}
