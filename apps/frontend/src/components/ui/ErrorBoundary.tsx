import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ErrorOutlineRounded, RefreshRounded, HomeRounded } from '@mui/icons-material';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/*
  Una excepción durante el render desmonta el árbol entero de React: sin nadie
  que la atrape, la aplicación se queda en una página en blanco y el único
  camino de vuelta es recargar a mano. Esto la contiene y deja al usuario en una
  pantalla desde la que puede seguir trabajando.

  `key` sobre el contenido: al reintentar hay que forzar un árbol nuevo, porque
  volver a montar el mismo suele repetir el error con el estado que lo causó.
*/
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  private attempt = 0;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Queda en consola para poder reconstruir qué pantalla se cayó.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private retry = () => {
    this.attempt += 1;
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return <React.Fragment key={this.attempt}>{this.props.children}</React.Fragment>;
    }

    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 460 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'error.light',
              color: 'error.main',
            }}
          >
            <ErrorOutlineRounded sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Esta pantalla se cayó
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            La acción no se pudo completar. Nada de lo que ya estaba guardado se perdió: podés
            reintentar o volver al inicio.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" startIcon={<RefreshRounded />} onClick={this.retry}>
              Reintentar
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeRounded />}
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Ir al inicio
            </Button>
          </Stack>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 3, wordBreak: 'break-word' }}
          >
            {error.message}
          </Typography>
        </Box>
      </Box>
    );
  }
}
