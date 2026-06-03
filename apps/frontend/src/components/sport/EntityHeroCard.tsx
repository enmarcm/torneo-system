import { Box, Typography, Stack } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  right?: ReactNode;
}

export const EntityHeroCard: React.FC<Props> = ({ title, subtitle, chips, right }) => (
  <Box
    sx={{
      borderRadius: 6,
      p: { xs: 3, md: 5 },
      color: '#fff',
      background: 'var(--heroGradient)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 3,
      flexWrap: 'wrap',
      minHeight: 150,
    }}
  >
    <Box sx={{ flex: 1, minWidth: 200 }}>
      {chips && <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>{chips}</Stack>}
      <Typography
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 800,
          fontSize: { xs: 24, md: 34 },
          lineHeight: 1.1,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: 'rgba(255,255,255,0.65)', mt: 1 }}>{subtitle}</Typography>
      )}
    </Box>
    {right && <Box>{right}</Box>}
  </Box>
);
