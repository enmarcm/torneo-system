import { Card, Stack, Typography, Skeleton } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon?: ReactNode;
  trend?: string;
  tint?: string;
  loading?: boolean;
}

export const StatCard: React.FC<Props> = ({ label, value, trend, loading }) => (
  <Card sx={{ p: { xs: 2, md: 2.5 }, height: '100%' }}>
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {loading ? <Skeleton width="55%" height={36} /> : (
        <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: { xs: 26, md: 30 }, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
          {typeof value === 'number' ? value.toLocaleString('es-VE') : value}
        </Typography>
      )}
      {trend && <Typography variant="caption" color="text.secondary">{trend}</Typography>}
    </Stack>
  </Card>
);
