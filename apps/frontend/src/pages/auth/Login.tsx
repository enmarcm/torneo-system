import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  ThemeProvider,
} from '@mui/material';
import {
  VisibilityRounded,
  VisibilityOffRounded,
  ArrowBackRounded,
  ArrowForwardRounded,
} from '@mui/icons-material';
import logoBlanco from '@/assets/logo.PNG';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/hooks/mutations';
import { NightCourt } from '@/components/sport/NightCourt';
import { useAuthStore } from '@/store/useAuthStore';
import { extractErrorMessage } from '@/api/axios';
import { homeRouteFor } from '@/routes/RoleGuard';
import { buildTheme } from '@/theme/theme';

const schema = z.object({
  username: z.string().trim().min(1, 'Ingresá tu usuario'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
type FormData = z.infer<typeof schema>;

/*
  La puerta de entrada es siempre de noche, elija lo que elija el visitante
  para el resto del sitio: es la cancha con los reflectores encendidos, la
  misma escena que el loader. Por eso el tema de esta pantalla va fijo.
*/
const nightTheme = buildTheme('dark');

/** Cuánto se ve el saludo antes de entrar al panel. */
const WELCOME_MS = 900;

/**
 * El balón real de la liga (Joma Pentaforce), recortado a círculo con fondo
 * transparente en `public/balon-joma.png`. El SVG (`JomaBall`) queda para el
 * loader, donde gira a 44 px y la foto se vería borrosa.
 */
const BALL_SRC = '/balon-joma.png';
const Ball: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Box component="img" src={BALL_SRC} alt="" sx={{ width: size, height: size, display: 'block', ...style }} />
);

const ROLES = ['Admin', 'Planillero', 'Prensa', 'Capitán'];

const Login: React.FC = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  // Mientras se saluda, la sesión ya existe: sin esto la redirección de abajo
  // se dispararía antes de que se alcance a ver el balón entrar.
  const welcoming = useRef(false);
  const userRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user && !welcoming.current) {
    navigate(homeRouteFor(user.role), { replace: true });
  }

  const onSubmit = async (data: FormData) => {
    setError(null);
    welcoming.current = true;
    try {
      const res = await login.mutateAsync(data);
      // El saludo se ve un instante con el balón entrando; recién después navega.
      setWelcome(res.user.username);
      window.setTimeout(() => navigate(homeRouteFor(res.user.role), { replace: true }), WELCOME_MS);
    } catch (e) {
      welcoming.current = false;
      setError(extractErrorMessage(e, 'Usuario o contraseña incorrectos. Revisá mayúsculas y volvé a intentar.'));
      setShaking(true);
      userRef.current?.focus();
      userRef.current?.select();
    }
  };

  const { ref: userFieldRef, ...userField } = register('username');

  return (
    <ThemeProvider theme={nightTheme}>
      <Box
        sx={{
          position: 'relative',
          isolation: 'isolate',
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          px: 2,
          py: { xs: 9, md: 8 },
          color: '#fff',
          background: 'radial-gradient(120% 90% at 50% 0%, #10203F 0%, #070B16 60%)',
          overflow: 'hidden',
        }}
      >
        <NightCourt />

        {/* Marca, arriba a la izquierda */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ position: 'absolute', left: { xs: 16, md: 28 }, top: { xs: 16, md: 24 }, zIndex: 2 }}
        >
          <Box component="img" src={logoBlanco} alt="" sx={{ width: 44, height: 44, borderRadius: '50%', boxShadow: '0 0 0 1px rgba(255,255,255,0.12)' }} />
          <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>
            Liga Lago Futsal
          </Typography>
        </Stack>

        {/* Centro: monograma y tarjeta de vidrio */}
        <Stack alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <Box
            component="img"
            src="/llf-removebg-preview.png"
            alt="LLF"
            sx={{ width: { xs: 110, md: 150 }, height: 'auto', filter: 'drop-shadow(0 10px 30px rgba(77,147,255,0.35))' }}
          />

          {/* El ascenso de entrada va en el contenedor; la sacudida del error, en la tarjeta. */}
          <Box sx={{ width: '100%', maxWidth: 400, animation: 'llfRise 0.3s cubic-bezier(.2,.7,.2,1) both' }}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            onAnimationEnd={() => setShaking(false)}
            noValidate
            sx={{
              position: 'relative',
              width: '100%',
              p: { xs: 3, md: '30px 30px 26px' },
              borderRadius: 4,
              bgcolor: 'rgba(16,24,40,0.78)',
              backdropFilter: 'blur(18px) saturate(140%)',
              WebkitBackdropFilter: 'blur(18px) saturate(140%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 40px 80px -30px rgba(0,0,0,0.8)',
              display: 'grid',
              gap: 1.75,
              animation: shaking ? 'llfShake 0.45s cubic-bezier(.36,.07,.19,.97)' : 'none',
            }}
          >
            <Box>
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Entrá a tu panel
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Con el usuario y la contraseña que te dio la liga.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" variant="outlined" sx={{ py: 0.5, borderRadius: 2.5 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Usuario"
              fullWidth
              autoComplete="username"
              autoFocus
              inputRef={(el) => {
                userFieldRef(el);
                userRef.current = el;
              }}
              {...userField}
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={FIELD_SX}
            />
            <TextField
              label="Contraseña"
              type={showPwd ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={FIELD_SX}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPwd((s) => !s)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      sx={{ color: showPwd ? 'primary.main' : 'text.disabled' }}
                    >
                      {showPwd ? <VisibilityOffRounded /> : <VisibilityRounded />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/*
              El botón conserva su ancho: mientras espera, el balón gira en el
              lugar del icono y el rótulo pasa a "Entrando…".
            */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={login.isPending}
              startIcon={
                login.isPending ? (
                  <Ball size={22} style={{ animation: 'llfSpin 0.9s linear infinite' }} />
                ) : undefined
              }
              endIcon={login.isPending ? undefined : <ArrowForwardRounded />}
              sx={{
                height: 50,
                borderRadius: 3,
                fontSize: 15,
                mt: 0.5,
                '&.Mui-disabled': { color: 'primary.contrastText', bgcolor: 'primary.main', opacity: 0.9 },
              }}
            >
              {login.isPending ? 'Entrando…' : 'Iniciar sesión'}
            </Button>

            <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
              Acceso para staff de la liga y capitanes de equipo.
            </Typography>

            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate('/')}
              sx={{ color: 'text.secondary', justifySelf: 'center' }}
            >
              Volver al inicio
            </Button>

            {/* Saludo: tapa la tarjeta un instante, con el balón entrando rodando. */}
            {welcome && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 4,
                  bgcolor: '#101828',
                  display: 'grid',
                  placeContent: 'center',
                  justifyItems: 'center',
                  gap: 0.5,
                  animation: 'llfRise 0.3s cubic-bezier(.2,.7,.2,1) both',
                }}
              >
                <Box sx={{ mb: 1, animation: 'llfRollIn 0.9s cubic-bezier(.2,.7,.2,1) both', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.35))' }}>
                  <Ball size={64} />
                </Box>
                <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 24 }}>
                  Hola, {welcome}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Entrando al panel…
                </Typography>
              </Box>
            )}
          </Box>
          </Box>
        </Stack>

        {/* El balón descansa en la esquina, sobre la cancha. */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: { md: '6%', lg: '9%' },
            bottom: { md: '7%' },
            display: { xs: 'none', md: 'block' },
            zIndex: 1,
            filter: 'drop-shadow(0 14px 10px rgba(0,0,0,0.55))',
          }}
        >
          <Ball size={96} />
        </Box>

        <Typography
          variant="caption"
          sx={{ position: 'absolute', left: { xs: 16, md: 28 }, bottom: 18, color: 'rgba(255,255,255,0.5)', zIndex: 2 }}
        >
          © {new Date().getFullYear()} Liga Lago Futsal
        </Typography>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ position: 'absolute', right: 28, bottom: 18, zIndex: 2, display: { xs: 'none', md: 'flex' } }}
        >
          {ROLES.map((r) => (
            <Box
              key={r}
              component="span"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.18)',
                px: 1.125,
                py: 0.5,
                borderRadius: 999,
              }}
            >
              {r}
            </Box>
          ))}
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

/*
  Campos hundidos sobre el vidrio: fondo del lienzo, borde tenue, y al enfocar
  el borde primario más un subrayado naranja que crece desde el centro (el
  mismo gesto de los enlaces del pie).
*/
const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#0B1220',
    position: 'relative',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1 },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 0,
      height: 2,
      borderRadius: 2,
      bgcolor: 'var(--accent)',
      transform: 'scaleX(0)',
      transformOrigin: 'center',
      transition: 'transform 0.22s cubic-bezier(.2,.7,.2,1)',
      pointerEvents: 'none',
    },
    '&.Mui-focused::after': { transform: 'scaleX(1)' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: 'text.secondary' },
} as const;

export default Login;
