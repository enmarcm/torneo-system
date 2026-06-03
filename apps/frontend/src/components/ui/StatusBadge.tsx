import { Chip } from '@mui/material';
import { getStatusLabel, getStatusColor } from '@/utils/statusLabels';

export const StatusBadge: React.FC<{ status: string; size?: 'small' | 'medium' }> = ({ status, size = 'small' }) => (
  <Chip size={size} label={getStatusLabel(status)} color={getStatusColor(status)} variant="outlined" sx={{ fontWeight: 600 }} />
);
