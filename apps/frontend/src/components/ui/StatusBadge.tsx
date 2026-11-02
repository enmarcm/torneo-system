import { Chip } from '@mui/material';
import { getStatusLabel, getStatusColor } from '@/utils/statusLabels';

export const StatusBadge: React.FC<{ status: string; size?: 'small' | 'medium' }> = ({ status, size = 'small' }) => {
  const color = getStatusColor(status);
  const semantic = color === 'error' ? 'danger' : color === 'secondary' ? 'accent' : color;
  return <Chip size={size} label={getStatusLabel(status)} sx={{
    fontWeight: 500,
    bgcolor: color === 'default' ? 'var(--surface2)' : `var(--${semantic}Soft)`,
    color: color === 'default' ? 'text.secondary' : `var(--${semantic})`,
  }} />;
};
