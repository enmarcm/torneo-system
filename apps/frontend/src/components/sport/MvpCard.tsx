import { useState } from 'react';
import { Card, Box, Stack, Typography, Button, Avatar, CircularProgress } from '@mui/material';
import MilitaryTechRounded from '@mui/icons-material/MilitaryTechRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import { motion } from 'framer-motion';
import type { Match } from '@/api/matches.api';
import { downloadFile } from '@/utils/downloadFile';

interface Props {
  match: Match;
  compact?: boolean;
}

/**
 * Figura del partido. La foto la sube el administrador y queda en el bucket
 * público, así que cualquiera puede descargarla desde el portal sin login.
 */
export const MvpCard: React.FC<Props> = ({ match, compact = false }) => {
  const [downloading, setDownloading] = useState(false);
  if (!match.mvpPlayer) return null;

  const fullName = `${match.mvpPlayer.firstName} ${match.mvpPlayer.lastName}`;
  const photo = match.mvpPhotoUrl ?? match.mvpPlayer.photoUrl;

  // La descarga se delega al helper: en escritorio baja el blob y en móvil abre
  // el diálogo del sistema (Web Share), que es la única vía que guarda en iOS.
  const download = async () => {
    if (!match.mvpPhotoUrl) return;
    setDownloading(true);
    try {
      await downloadFile(match.mvpPhotoUrl, `MVP-${fullName}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card
      component={motion.div}
      sx={{
        p: compact ? 2 : 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'warning.light',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
        <MilitaryTechRounded sx={{ fontSize: 18, color: 'warning.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Figura del partido
        </Typography>
      </Stack>

      <Stack direction={compact ? 'row' : { xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        {photo ? (
          <Box
            component="img"
            src={photo}
            alt={fullName}
            sx={{
              width: compact ? 64 : { xs: '100%', sm: 140 },
              height: compact ? 64 : { xs: 200, sm: 140 },
              objectFit: 'cover',
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
        ) : (
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'warning.light' }}>
            {match.mvpPlayer.firstName[0]}
          </Avatar>
        )}

        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>
            {fullName}
          </Typography>
          {match.mvpNote && (
            <Typography variant="body2" color="text.secondary">
              {match.mvpNote}
            </Typography>
          )}
          {match.mvpPhotoUrl && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={
                downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadRounded />
              }
              onClick={download}
              disabled={downloading}
              sx={{ alignSelf: 'flex-start', mt: 0.5 }}
            >
              {downloading ? 'Descargando…' : 'Descargar foto'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};
