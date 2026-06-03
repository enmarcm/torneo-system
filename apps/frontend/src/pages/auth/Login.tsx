import { Box, Card, Typography, TextField, Button, Alert, Stack, InputAdornment, IconButton } from '@mui/material';
import { VisibilityRounded, VisibilityOffRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/hooks/mutations';
import { useAuthStore } from '@/store/useAuthStore';
import { extractErrorMessage } from '@/api/axios';
import { ROUTES } from '@/routes/routes';

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type FormData = z.infer<typeof schema>;

const Login: React.FC = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) {
    navigate(user.role === 'ADMIN' ? ROUTES.admin.dashboard : ROUTES.team.home, { replace: true });
  }

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await login.mutateAsync(data);
      navigate(res.user.role === 'ADMIN' ? ROUTES.admin.dashboard : ROUTES.team.home, { replace: true });
    } catch (e) {
      setError(extractErrorMessage(e, 'No pudimos iniciar sesión. Intenta nuevamente.'));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      {/* Panel izquierdo (gradiente) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          background: 'var(--brandGradient)',
          color: '#fff',
          p: 6,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <EmojiEventsRounded sx={{ fontSize: 32 }} />
          <Typography variant="h3" sx={{ fontWeight: 800 }}>LigaApp</Typography>
        </Stack>
        <Box component={motion.div} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
            La liga, en vivo y sin fricción.
          </Typography>
          <Typography sx={{ opacity: 0.85, maxWidth: 460 }}>
            Programa partidos, gestiona plantillas, sigue a tus equipos favoritos y vive cada gol en tiempo real.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} LigaApp
        </Typography>
      </Box>

      {/* Panel derecho (formulario) */}
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, md: 6 } }}>
        <Card sx={{ width: '100%', maxWidth: 420, p: { xs: 3, md: 4 } }} component={motion.div}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3, display: { md: 'none' } }}>
            <EmojiEventsRounded color="primary" />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>LigaApp</Typography>
          </Stack>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Bienvenido</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tus credenciales para continuar.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Correo electrónico"
                type="email"
                fullWidth
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                label="Contraseña"
                type={showPwd ? 'text' : 'password'}
                fullWidth
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" aria-label="Mostrar u ocultar contraseña">
                        {showPwd ? <VisibilityOffRounded /> : <VisibilityRounded />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={login.isPending}
                sx={{ py: 1.25 }}
              >
                {login.isPending ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>
              <Typography variant="caption" color="text.secondary" align="center">
                Demo: admin@torneo.com / Admin1234
              </Typography>
            </Stack>
          </form>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
