import { Box, Stack, Typography, Button, TextField } from '@mui/material';
import { SearchRounded } from '@mui/icons-material';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  compactMobile?: boolean;
}

export const PageHeader: React.FC<Props> = ({ title, subtitle, action, search, compactMobile = false }) => (
  <>
  <Stack
    direction={{ xs: compactMobile ? 'row' : 'column', md: 'row' }}
    alignItems={{ xs: compactMobile ? 'center' : 'flex-start', md: 'center' }}
    justifyContent="space-between"
    spacing={2}
    sx={{ mb: compactMobile ? { xs: 1, md: 3 } : 3, gap: compactMobile ? 1 : undefined }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h2" sx={{ mb: 0.5, overflowWrap: 'anywhere', fontSize: compactMobile ? { xs: 22, md: 24 } : undefined }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ display: compactMobile ? { xs: 'none', md: 'block' } : undefined }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: { xs: compactMobile ? 'auto' : '100%', md: 'auto' }, minWidth: 0, flexShrink: compactMobile ? 0 : undefined, '& > .MuiStack-root': { flexWrap: 'wrap', gap: 1, minWidth: 0 }, '& > .MuiButton-root': { width: { xs: compactMobile ? 'auto' : '100%', sm: 'auto' }, minHeight: 44, px: compactMobile ? { xs: 1.5, md: 2 } : undefined } }}>
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
  {compactMobile && subtitle && <Box component="details" sx={{ display: { xs: 'block', md: 'none' }, mb: 2, color: 'text.secondary' }}>
    <Box component="summary" sx={{ fontSize: 13, py: 1, cursor: 'pointer' }}>Información de esta sección</Box>
    <Typography variant="body2" sx={{ pb: 1 }}>{subtitle}</Typography>
  </Box>}
  </>
);
