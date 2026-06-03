import { Chip } from '@mui/material';

const MAP: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  ACTIVE: { label: 'Activo', color: 'success' },
  INACTIVE: { label: 'Inactivo', color: 'default' },
  DRAFT: { label: 'Borrador', color: 'warning' },
  FINISHED: { label: 'Finalizado', color: 'info' },
  LIVE: { label: 'En vivo', color: 'error' },
  SCHEDULED: { label: 'Programado', color: 'info' },
  POSTPONED: { label: 'Pospuesto', color: 'warning' },
  PENDING: { label: 'Pendiente', color: 'warning' },
  APPROVED: { label: 'Aprobado', color: 'success' },
  REJECTED: { label: 'Rechazado', color: 'error' },
  LEAGUE: { label: 'Liga', color: 'info' },
  GROUPS_KNOCKOUT: { label: 'Copa', color: 'secondary' as 'info' },
};

export const StatusBadge: React.FC<{ status: string; size?: 'small' | 'medium' }> = ({ status, size = 'small' }) => {
  const it = MAP[status] ?? { label: status, color: 'default' as const };
  return (
    <Chip
      size={size}
      label={it.label}
      color={it.color as 'success' | 'warning' | 'error' | 'info' | 'default'}
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};
