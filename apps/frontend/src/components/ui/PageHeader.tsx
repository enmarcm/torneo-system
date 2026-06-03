import { Box, Stack, Typography, Button, TextField } from '@mui/material';
import { SearchRounded } from '@mui/icons-material';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
}

export const PageHeader: React.FC<Props> = ({ title, subtitle, action, search }) => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    alignItems={{ xs: 'flex-start', md: 'center' }}
    justifyContent="space-between"
    spacing={2}
    sx={{ mb: 3 }}
  >
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
      {search && (
        <TextField
          size="small"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder ?? 'Buscar…'}
          InputProps={{ startAdornment: <SearchRounded sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" /> }}
          sx={{ minWidth: 240 }}
        />
      )}
      {action}
    </Stack>
  </Stack>
);
