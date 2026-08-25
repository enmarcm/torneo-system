import { Box, Button, Stack, Typography } from '@mui/material';
import { CalendarMonthRounded, TableChartRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import hero1600 from '@/assets/hero-cancha-1600.jpg';
import hero900 from '@/assets/hero-cancha-900.jpg';

/* ───────────────────────── Ajustes del fondo ─────────────────────────
   Los tres valores que hacen falta tocar para reencuadrar la franja.
   Están sueltos y arriba a propósito: cambiar el fondo no debería obligar
   a leer el resto del componente.
──────────────────────────────────────────────────────────────────────── */

/**
 * Qué parte de la imagen se ve.
 *
 * La foto es cuadrada y la franja es apaisada, así que siempre sobra imagen
 * arriba y abajo. El primer valor mueve el recorte en horizontal y el segundo
 * en vertical: `50% 50%` centra, bajar el segundo sube la imagen, subirlo la
 * baja.
 */
const ENCUADRE = '50% 45%';

/**
 * Cuánto se oscurece la foto, de 0 a 1.
 *
 * El backing es claro y está lleno de logos: sin velo, el texto blanco de
 * encima no se lee sobre los recuadros blancos de los patrocinantes. Por
 * debajo de 0.7 el contraste deja de ser suficiente.
 */
const VELO = 0.82;

/** Alto de la franja. Corta pero con aire: abajo van los partidos, que es a lo que se viene. */
const ALTO = { xs: 190, sm: 220, md: 260 };

interface Props {
  /** Nombre de la edición en curso, tal como está cargado en el sistema. */
  editionName: string;
  seasonNumber: number;
  liveCount: number;
}

/**
 * Franja de portada del sitio público.
 *
 * Sobre el backing de la liga van las tres cosas que trae el visitante: en qué
 * edición estamos, si hay algo en vivo, y los dos accesos que responden sus
 * preguntas —qué se juega y cómo va la tabla—. La imagen es decorado: no lleva
 * `alt` porque no dice nada que el texto de encima no diga mejor.
 */
export const PublicHero: React.FC<Props> = ({ editionName, seasonNumber, liveCount }) => {
  const navigate = useNavigate();
  const isLive = liveCount > 0;

  return (
    <Box
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        borderRadius: 3,
        height: ALTO,
        color: '#fff',
        // Se ve mientras la imagen carga, así el texto nunca queda sobre blanco.
        background: 'var(--heroGradient)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <Box
        component="img"
        src={hero1600}
        srcSet={`${hero900} 900w, ${hero1600} 1600w`}
        sizes="100vw"
        alt=""
        aria-hidden
        loading="eager"
        // Es lo primero que se ve: bajarlo tarde deja la franje en degradado plano.
        fetchPriority="high"
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: ENCUADRE,
        }}
      />

      {/*
        Velo en dos capas: uno parejo que baja el brillo general del backing y un
        degradado que carga la tinta abajo, que es donde se apoya el texto.
      */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: `linear-gradient(180deg,
            rgba(3, 24, 60, ${VELO * 0.7}) 0%,
            rgba(3, 24, 60, ${VELO * 0.85}) 45%,
            rgba(3, 24, 60, ${VELO}) 100%)`,
        }}
      />

      <Stack
        spacing={1.5}
        sx={{ p: { xs: 2, md: 3 }, width: '100%' }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          {/* El nombre de la edición: es el dato que ubica todo lo que viene abajo. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              px: 1.5,
              py: 0.6,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.22)',
              minWidth: 0,
            }}
          >
            <Typography
              component="h1"
              noWrap
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: { xs: 14, md: 16 },
                lineHeight: 1.2,
              }}
            >
              {editionName}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                opacity: 0.75,
                whiteSpace: 'nowrap',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              · Temporada {seasonNumber}
            </Typography>
          </Stack>

          {/* En rojo solo cuando hay algo que mirar: un "0 EN VIVO" en rojo miente. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              bgcolor: isLive ? 'var(--live)' : 'rgba(255,255,255,0.16)',
              color: isLive ? 'var(--liveOn)' : 'inherit',
              border: isLive ? 'none' : '1px solid rgba(255,255,255,0.22)',
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: 'currentColor',
                ...(isLive ? { animation: 'pulse 1.4s infinite' } : { opacity: 0.5 }),
              }}
            />
            <Box component="span">{liveCount} EN VIVO</Box>
          </Stack>
        </Stack>

        {/*
          Los dos accesos que responden por qué alguien entra al sitio. Sólidos
          sobre la foto: un botón de contorno sobre una imagen con logos se
          pierde en cuanto el recorte cae sobre una zona clara.
        */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<CalendarMonthRounded />}
            onClick={() => navigate(ROUTES.public.schedule)}
            sx={{
              bgcolor: '#fff',
              color: 'var(--primary)',
              fontWeight: 700,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
            }}
          >
            Ver partidos
          </Button>
          <Button
            variant="contained"
            startIcon={<TableChartRounded />}
            onClick={() => navigate(ROUTES.public.competitions)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.16)',
              color: '#fff',
              fontWeight: 700,
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.26)', boxShadow: 'none' },
            }}
          >
            Ver tablas
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
