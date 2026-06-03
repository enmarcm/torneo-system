import { Box, Card, Typography, Stack, Chip } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { formatDateTime } from '@/utils/formatDate';
import { TextField, MenuItem } from '@mui/material';

const AdminAudit: React.FC = () => {
  const [entity, setEntity] = useState<string>('');
  const { data, isLoading } = useQuery({
    queryKey: ['audit', entity],
    queryFn: async () => (await api.get('/audit' + (entity ? `?entity=${entity}` : ''))).data.data,
  });

  return (
    <Box>
      <PageHeader title="Auditoría" subtitle="Registro de acciones sensibles del sistema." />
      <Card sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField select size="small" label="Entidad" value={entity} onChange={(e) => setEntity(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">Todas</MenuItem>
            {['User', 'Edition', 'Category', 'Competition', 'Team', 'Player', 'RosterEntry', 'Match', 'Transfer'].map((e) => (
              <MenuItem key={e} value={e}>{e}</MenuItem>
            ))}
          </TextField>
        </Stack>
        {isLoading ? (
          <Typography color="text.secondary">Cargando…</Typography>
        ) : (
          <Stack spacing={1}>
            {(!data || data.length === 0) && <Typography color="text.secondary">Sin registros de auditoría.</Typography>}
            {data?.map((row: any) => (
              <Stack key={row.id} direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'background.default' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 160 }}>{formatDateTime(row.createdAt)}</Typography>
                <Chip size="small" label={row.action} variant="outlined" />
                <Chip size="small" label={row.entity} variant="outlined" color="primary" />
                <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>{row.userId ?? 'sistema'}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
};

export default AdminAudit;
