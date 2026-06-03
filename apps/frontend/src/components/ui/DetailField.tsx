import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
}

export function DetailField({ label, value }: Props) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{value ?? '—'}</Typography>
    </Box>
  );
}
