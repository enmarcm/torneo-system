import { Box, Button, Typography, Stack, CircularProgress } from '@mui/material';
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  return (
    <Stack spacing={1}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} hidden />
      {value ? (
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 200, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box component="img" src={value} alt="preview" sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
          <Button
            size="small"
            color="error"
            onClick={() => onChange('')}
            sx={{ position: 'absolute', top: 4, right: 4, minWidth: 28, minHeight: 28, p: 0.5, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, borderRadius: '50%' }}
          >
            <DeleteRounded sx={{ fontSize: 16, color: '#fff' }} />
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadRounded />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          sx={{ alignSelf: 'flex-start' }}
        >
          {uploading ? 'Subiendo…' : label}
        </Button>
      )}
      {value && (
        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {value.split('/').pop()}
        </Typography>
      )}
    </Stack>
  );
};
