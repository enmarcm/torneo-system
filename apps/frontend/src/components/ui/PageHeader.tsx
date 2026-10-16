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
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h2" sx={{ mb: 0.5, overflowWrap: 'anywhere' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: { xs: '100%', md: 'auto' }, minWidth: 0, '& > .MuiStack-root': { flexWrap: 'wrap', gap: 1, minWidth: 0 }, '& > .MuiButton-root': { width: { xs: '100%', sm: 'auto' } } }}>
      {search && (
        <TextField
          size="small"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder ?? 'Buscar…'}
          inputProps={{ 'aria-label': search.placeholder ?? 'Buscar' }}
          InputProps={{ startAdornment: <SearchRounded sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" /> }}
          sx={{ minWidth: { xs: 0, sm: 240 }, width: { xs: '100%', sm: 'auto' }, flex: { sm: '1 1 240px', md: 'initial' } }}
        />
      )}
      {action}
    </Stack>
  </Stack>
);
