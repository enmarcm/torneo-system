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
      borderRadius: 2,
      p: { xs: 2, md: 2.5 },
      color: 'var(--heroText)',
      background: 'var(--heroSurface)',
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { xs: 'stretch', sm: 'center' },
      gap: { xs: 1.5, md: 3 },
      flexWrap: 'wrap',
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
      <Typography
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600,
          fontSize: { xs: 20, md: 24 },
          lineHeight: 1.3,
          overflowWrap: 'anywhere',
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'var(--heroMuted)', mt: 0.75 }}>{subtitle}</Typography>
      )}
      {chips && <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>{chips}</Stack>}
    </Box>
    {right && <Box sx={{ minWidth: 0, maxWidth: '100%', alignSelf: { xs: 'flex-start', sm: 'auto' } }}>{right}</Box>}
  </Box>
);
