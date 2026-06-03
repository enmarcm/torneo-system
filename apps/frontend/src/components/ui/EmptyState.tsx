import { Box, Typography, Button } from '@mui/material';
import { InboxRounded } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export const EmptyState: React.FC<Props> = ({ title, description, actionLabel, onAction, icon }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 6,
      px: 3,
      border: '1px dashed',
      borderColor: 'divider',
      borderRadius: 4,
      bgcolor: 'background.default',
    }}
  >
    <Box
      sx={{
        width: 64,
        height: 64,
        mx: 'auto',
        mb: 2,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'primary.soft',
        color: 'primary.main',
      }}
    >
      {icon ?? <InboxRounded sx={{ fontSize: 32 }} />}
    </Box>
    <Typography variant="h4" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);
