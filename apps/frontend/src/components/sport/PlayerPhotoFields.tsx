import { useRef } from 'react';
import { Stack } from '@mui/material';
import { ImageUpload } from '@/components/ui/ImageUpload';

export const PlayerPhotoFields: React.FC<{
  photoUrl: string;
  identityPhotoKey: string;
  onPhotoChange: (value: string) => void;
  onIdentityChange: (value: string) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  documentType?: 'CEDULA' | 'PARTIDA';
}> = ({ photoUrl, identityPhotoKey, onPhotoChange, onIdentityChange, onBusyChange, disabled, documentType = 'CEDULA' }) => {
  const busy = useRef({ photo: false, identity: false });
  const report = (kind: 'photo' | 'identity', loading: boolean) => {
    busy.current[kind] = loading; onBusyChange?.(busy.current.photo || busy.current.identity);
  };
  return <Stack spacing={2}>
    <ImageUpload required label="Foto del jugador" value={photoUrl} onChange={onPhotoChange} disabled={disabled} onUploadingChange={(loading) => report('photo', loading)} />
    <ImageUpload required privateDocument label={documentType === 'CEDULA' ? 'Foto de la cédula' : 'Foto del documento'} value={identityPhotoKey} onChange={onIdentityChange} disabled={disabled} onUploadingChange={(loading) => report('identity', loading)} />
  </Stack>;
};
