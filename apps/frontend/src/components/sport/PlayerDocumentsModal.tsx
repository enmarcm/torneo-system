import { useEffect, useState } from 'react';
import { Box, Button, Grid2 as Grid, Skeleton, Stack, Typography } from '@mui/material';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import { AppModal } from '@/components/ui/AppModal';
import { DetailField } from '@/components/ui/DetailField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { uploadsApi } from '@/api/uploads.api';
import { extractErrorMessage } from '@/utils/apiErrors';
import { calcAge, formatDate } from '@/utils/formatDate';

export interface PlayerDocuments {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  position: string | null;
  status: string;
  createdAt: string;
  photoUrl: string | null;
  identityPhotoKey: string | null;
}

const Picture: React.FC<{ title: string; src?: string | null; loading?: boolean; error?: string | null; empty: string }> = ({ title, src, loading, error, empty }) => (
  <Stack spacing={1}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
    {loading ? <Skeleton variant="rounded" height={260} />
      : src ? (
        <>
          <Box component="img" src={src} alt={title} sx={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block', bgcolor: 'action.hover', borderRadius: 2, p: 1 }} />
          <Button size="small" startIcon={<OpenInNewRounded />} href={src} target="_blank" rel="noopener" sx={{ alignSelf: 'flex-start' }}>Abrir en grande</Button>
        </>
      ) : <Typography variant="body2" color={error ? 'error' : 'text.secondary'} sx={{ py: 3, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>{error ?? empty}</Typography>}
  </Stack>
);

/** Todo lo que se subió del jugador: datos, foto y foto del documento (la que vive en el almacenamiento privado). */
export const PlayerDocumentsModal: React.FC<{ open: boolean; onClose: () => void; player: PlayerDocuments }> = ({ open, onClose, player }) => {
  const key = player.identityPhotoKey;
  const [doc, setDoc] = useState<{ key: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = open && !!key && doc?.key !== key && !error;

  useEffect(() => {
    if (!open || !key) return;
    let active = true;
    setError(null);
    uploadsApi.identityUrl(key).then(
      (url) => { if (active) setDoc({ key, url }); else URL.revokeObjectURL(url); },
      (err) => { if (active) setError(extractErrorMessage(err, 'No pudimos cargar la foto del documento')); },
    );
    return () => { active = false; };
  }, [open, key]);

  // El blob vive en memoria: se libera al cerrar o al cambiar de documento.
  useEffect(() => () => { if (doc) URL.revokeObjectURL(doc.url); }, [doc]);

  const isCedula = player.documentType === 'CEDULA';
  return (
    <AppModal open={open} onClose={onClose} maxWidth={760} title="Documentos del jugador" subtitle={`${player.firstName} ${player.lastName}`}
      actions={<Button onClick={onClose}>Cerrar</Button>}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 4 }}><DetailField label={isCedula ? 'Cédula' : 'Partida de nacimiento'} value={`${isCedula ? 'C.I.' : 'P.N.'} ${player.documentNumber}`} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><DetailField label="Nacimiento" value={`${formatDate(player.birthDate)} · ${calcAge(player.birthDate)} años`} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><DetailField label="Registro" value={formatDate(player.createdAt)} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><DetailField label="Posición" value={player.position} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><DetailField label="Estado" value={<StatusBadge status={player.status} />} /></Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Picture title="Foto del jugador" src={player.photoUrl} empty="No subió foto" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Picture title={isCedula ? 'Foto de la cédula' : 'Foto del documento'} src={doc?.key === key ? doc?.url : null} loading={loading} error={error}
            empty="No subió foto del documento" />
        </Grid>
      </Grid>
    </AppModal>
  );
};
