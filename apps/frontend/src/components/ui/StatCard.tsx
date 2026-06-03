import { Card, Box, Typography, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { statCardTints } from '@/theme/tokens';

type Tint = keyof typeof statCardTints;

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
  tint?: Tint;
  loading?: boolean;
}

export const StatCard: React.FC<Props> = ({ label, value, icon, trend, tint = 'primary', loading }) => {
  const [bg, fg] = statCardTints[tint];
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      sx={{ p: 4, height: '100%', borderRadius: 3 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            bgcolor: bg,
            color: fg,
            '& svg': { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
        {trend && (
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
            {trend}
          </Typography>
        )}
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" height={48} />
      ) : (
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            fontSize: 30,
            fontVariantNumeric: 'tabular-nums',
            color: 'text.primary',
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Card>
  );
};
