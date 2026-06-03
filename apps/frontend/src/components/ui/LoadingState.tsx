import { Box, Skeleton, Stack } from '@mui/material';

export const LoadingState: React.FC<{ rows?: number; height?: number }> = ({ rows = 4, height = 56 }) => (
  <Stack spacing={1.25}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={height} animation="wave" />
    ))}
  </Stack>
);

export const SkeletonCard: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="40%" height={32} />
    <Skeleton variant="rounded" height={120} sx={{ mt: 2 }} />
  </Box>
);
