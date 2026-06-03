import { Card, Box, Typography, Skeleton } from '@mui/material';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
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

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return (
    <motion.span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {rounded}
    </motion.span>
  );
};

export const StatCard: React.FC<Props> = ({ label, value, icon, trend, tint = 'primary', loading }) => {
  const [bg, fg] = statCardTints[tint];
  const isNumeric = typeof value === 'number';
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      sx={{ p: { xs: 2, md: 3 }, height: '100%', borderRadius: 3 }}
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
          {isNumeric ? <AnimatedNumber value={value} /> : value}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Card>
  );
};
