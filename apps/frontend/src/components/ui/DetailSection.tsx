import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export function DetailSection({ title, children }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" sx={{ mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}
