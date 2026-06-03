import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import { CloudUploadRounded, DeleteRounded } from '@mui/icons-material';
import { useRef, useState } from 'react';
import { uploadsApi } from '@/api/uploads.api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}

export const ImageUpload: React.FC<Props> = ({ value, onChange, accept = 'image/jpeg,image/png,image/webp', label = 'Subir imagen' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadsApi.image(file);
      onChange(res.url);
    } catch {
      // error handled upstream
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Stack spacing={1}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        hidden
      />
      {value ? (
        <Box sx={{ position: 'relative', width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box
            component="img"
            src={value}
            alt="preview"
            sx={{ width: '100%', height: 160, objectFit: 'contain', display: 'block', bgcolor: 'action.hover', p: 1 }}
          />
          <Box
            onClick={() => { onChange(''); }}
            sx={{
              position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <DeleteRounded sx={{ fontSize: 16, color: '#fff' }} />
          </Box>
        </Box>
      ) : (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragging ? 'primary.soft' : 'action.hover',
            transition: 'all 0.15s',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.soft' },
          }}
        >
          {uploading ? (
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">Subiendo imagen…</Typography>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={1}>
              <CloudUploadRounded sx={{ fontSize: 36, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
              {label}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Haz clic o arrastra una imagen aquí
              </Typography>
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
};
