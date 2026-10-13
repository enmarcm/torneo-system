import { Alert, Box, ButtonBase, Typography, Stack, CircularProgress, IconButton } from '@mui/material';
import { CloudUploadRounded, DeleteRounded, InfoOutlined } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { uploadsApi } from '@/api/uploads.api';
import { extractErrorMessage } from '@/api/axios';

interface Props {
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  privateDocument?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

export const ImageUpload: React.FC<Props> = ({ value, onChange, accept = 'image/jpeg,image/png,image/webp', label = 'Subir imagen', hint, required = false, disabled = false, privateDocument = false, onUploadingChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState({ key: '', url: '' });
  const src = privateDocument ? (preview.key === value ? preview.url : '') : value;

  useEffect(() => {
    if (!privateDocument || !value || preview.key === value) return;
    let active = true;
    uploadsApi.identityUrl(value).then((url) => { if (active) setPreview({ key: value, url }); else URL.revokeObjectURL(url); }, (err) => { if (active) setError(extractErrorMessage(err, 'No pudimos cargar la foto del documento')); });
    return () => { active = false; };
  }, [privateDocument, value, preview.key]);

  useEffect(() => () => { if (privateDocument && preview.url) URL.revokeObjectURL(preview.url); }, [privateDocument, preview.url]);

  const handleFile = async (file: File) => {
    if (disabled || uploading) return;
    setUploading(true); onUploadingChange?.(true); setError(null);
    try {
      if (privateDocument) {
        const result = await uploadsApi.identity(file);
        const url = await uploadsApi.identityUrl(result.key);
        if (!mounted.current) { URL.revokeObjectURL(url); return; }
        setPreview({ key: result.key, url }); onChange(result.key);
      } else {
        const result = await uploadsApi.image(file); if (mounted.current) onChange(result.url);
      }
    } catch (err) { setError(extractErrorMessage(err, 'No se pudo subir la imagen. Vuelve a intentarlo')); }
    finally { setUploading(false); onUploadingChange?.(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  return (
    <Stack spacing={1}>
      {required && <Typography variant="body2" sx={{ fontWeight: 600 }}>{label} (obligatoria)</Typography>}
      <input ref={inputRef} type="file" accept={accept} disabled={disabled || uploading} aria-label={label}
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); }} hidden />
      {value ? (
        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          {src ? <Box component="img" src={src} alt={label} sx={{ width: '100%', height: 160, objectFit: 'contain', display: 'block', bgcolor: 'action.hover', p: 1 }} />
            : error ? <Typography sx={{ p: 3 }} color="text.secondary">No se pudo cargar la foto. Puedes quitarla y volver a subirla.</Typography> : <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /><Typography variant="caption">Cargando foto…</Typography></Stack>}
          <IconButton size="small" aria-label={`Quitar ${label.toLowerCase()}`} disabled={disabled || uploading} onClick={() => { onChange(''); setPreview({ key: '', url: '' }); setError(null); }}
            sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'background.paper' }} color="error"><DeleteRounded fontSize="small" /></IconButton>
        </Box>
      ) : (
        <ButtonBase disabled={disabled || uploading} onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void handleFile(file); }}
          sx={{ width: '100%', border: '2px dashed', borderColor: dragging ? 'primary.main' : 'divider', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: dragging ? 'primary.soft' : 'action.hover', '&:hover': { borderColor: 'primary.main' } }}>
          <Stack alignItems="center" spacing={1}>
            {uploading ? <CircularProgress size={28} /> : <CloudUploadRounded sx={{ fontSize: 36, color: 'text.secondary' }} />}
            <Typography variant="body2" color="text.secondary">{uploading ? 'Subiendo imagen…' : required ? 'Seleccionar imagen' : label}</Typography>
            <Typography variant="caption" color="text.secondary">Haz clic o arrastra una imagen aquí</Typography>
          </Stack>
        </ButtonBase>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {hint && <Stack direction="row" spacing={0.75} alignItems="flex-start"><InfoOutlined sx={{ fontSize: 15, color: 'text.secondary' }} /><Typography variant="caption" color="text.secondary">Medida sugerida: {hint}.</Typography></Stack>}
    </Stack>
  );
};
