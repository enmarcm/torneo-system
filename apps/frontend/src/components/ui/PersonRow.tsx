import { Box, Avatar, Typography } from '@mui/material';
import { StatusBadge } from './StatusBadge';

interface Props {
  name: string;
  subtitle?: string;
  status?: string;
  right?: React.ReactNode;
  avatarUrl?: string | null;
}

export const PersonRow: React.FC<Props> = ({ name, subtitle, status, right, avatarUrl }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
    <Avatar src={avatarUrl ?? undefined} sx={{ width: 38, height: 38, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700 }}>
      {name[0]?.toUpperCase()}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
        {name}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {subtitle}
        </Typography>
      )}
    </Box>
    {right}
    {status && <StatusBadge status={status} />}
  </Box>
);
