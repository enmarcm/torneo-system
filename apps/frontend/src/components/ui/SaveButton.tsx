import { Box, Button, CircularProgress, type ButtonProps } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface Props extends Omit<ButtonProps, 'children'> {
  /** `mutation.isPending`. Con más de una mutación, el OR de todas. */
  loading: boolean;
  /** `mutation.isError`: si la última corrida falló, no se muestra el tilde. */
  error?: boolean;
  children: React.ReactNode;
  /** Rótulo mientras espera. */
  busyLabel?: string;
  /** Rótulo del instante de confirmación. */
  doneLabel?: string;
}

const OK_MS = 1200;

/**
 * Botón que guarda y confirma. Mantiene su ancho, cambia el icono por un
 * anillo mientras espera y, cuando la mutación termina bien, dibuja un tilde
 * en verde antes de volver a su estado normal. Nadie duda si el clic entró.
 *
 *   <SaveButton loading={create.isPending} error={create.isError}>Guardar</SaveButton>
 */
export const SaveButton: React.FC<Props> = ({
  loading,
  error,
  children,
  busyLabel = 'Guardando…',
  doneLabel = 'Guardado',
  startIcon,
  disabled,
  sx,
  color = 'primary',
  ...rest
}) => {
  const [ok, setOk] = useState(false);
  const wasLoading = useRef(loading);

  useEffect(() => {
    // Pasó de esperar a no esperar sin error: eso es un guardado exitoso.
    const succeeded = wasLoading.current && !loading && !error;
    wasLoading.current = loading;
    if (!succeeded) return;
    setOk(true);
    const t = window.setTimeout(() => setOk(false), OK_MS);
    return () => window.clearTimeout(t);
  }, [loading, error]);

  const icon = loading ? (
    <CircularProgress size={14} color="inherit" thickness={5} />
  ) : ok ? (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 16, height: 16, display: 'block' }} aria-hidden>
      <Box
        component="path"
        d="M3 8.5l3.2 3.2L13 4.5"
        sx={{
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: 20,
          strokeDashoffset: 20,
          animation: 'llfDraw 0.35s 0.05s ease-out forwards',
        }}
      />
    </Box>
  ) : (
    startIcon
  );

  return (
    <Button
      variant="contained"
      color={color}
      {...rest}
      disabled={disabled || loading || ok}
      startIcon={icon}
      sx={{
        minWidth: 132,
        transition: 'background-color 0.2s, color 0.2s',
        // El estado de espera y el de confirmación no son "deshabilitado": conservan tinta.
        '&.Mui-disabled': loading
          ? { color: `${color}.contrastText`, bgcolor: `${color}.dark` }
          : ok
            ? { color: '#fff', bgcolor: 'success.main' }
            : undefined,
        ...sx,
      }}
    >
      {loading ? busyLabel : ok ? doneLabel : children}
    </Button>
  );
};
