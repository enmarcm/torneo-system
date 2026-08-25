import { Box, Button, Stack, Typography } from '@mui/material';
import {
  CalendarMonthRounded,
  TableChartRounded,
  KeyboardArrowDownRounded,
} from '@mui/icons-material';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { PUBLIC_TOPBAR_H } from '@/components/layout/PublicTopbar';
import hero1600 from '@/assets/hero-cancha-1600.jpg';
import hero900 from '@/assets/hero-cancha-900.jpg';

/* ───────────────────────── Ajustes del fondo ─────────────────────────
   Los valores que hacen falta tocar para reencuadrar la portada. Están
   sueltos y arriba a propósito: cambiar el fondo no debería obligar a leer
   el resto del componente.
──────────────────────────────────────────────────────────────────────── */

/**
 * Qué parte de la imagen se ve.
 *
 * La foto es cuadrada y la portada es apaisada, así que siempre sobra imagen
 * a los costados o arriba. El primer valor mueve el recorte en horizontal y el
 * segundo en vertical: `50% 50%` centra, bajar el segundo sube la imagen.
 */
const ENCUADRE = '50% 45%';

/**
 * Cuánto se oscurece la foto, de 0 a 1.
 *
 * El backing es claro y está lleno de recuadros blancos: sin velo, el texto de
 * encima no se lee. Por debajo de 0.7 el contraste deja de ser suficiente.
 */
const VELO = 0.82;

/** Aire que el contenedor de la portada deja arriba (el `pt` del Container). */
const AIRE_SUPERIOR = { xs: 16, md: 20 };

/**
 * Alto de la portada: la primera pantalla completa, descontando la barra
 * superior y ese aire para que no aparezca una tira de scroll de más.
 *
 * `svh` y no `vh`: en el teléfono, `100vh` se mide con la barra del navegador
 * escondida, así que la portada quedaba más alta que la pantalla y el botón de
 * abajo nacía cortado.
 */
const ALTO = {
  xs: `calc(100svh - ${PUBLIC_TOPBAR_H.xs + AIRE_SUPERIOR.xs}px)`,
  md: `calc(100svh - ${PUBLIC_TOPBAR_H.md + AIRE_SUPERIOR.md}px)`,
};

interface Props {
  /** Nombre de la edición en curso, tal como está cargado en el sistema. */
  editionName: string;
  seasonNumber: number;
  liveCount: number;
}

/**
 * Portada del sitio público.
 *
 * Ocupa la primera pantalla entera: el monograma, en qué edición estamos, si
 * hay algo en vivo y los dos accesos que responden a qué vino el visitante
 * —qué se juega y cómo va la tabla—.
 *
 * Como se lleva la pantalla completa, abajo del todo va una flecha que avisa
 * que hay más: sin ella, una portada a pantalla llena parece el sitio entero y
 * los partidos, que son el contenido, no existen para quien no baja.
 */
export const PublicHero: React.FC<Props> = ({ editionName, seasonNumber, liveCount }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const isLive = liveCount > 0;

  const bajar = () =>
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: reduceMotion ? 'auto' : 'smooth' });

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
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
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
        // Es lo primero que se ve: bajarlo tarde deja la portada en degradado plano.
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
        degradado que carga la tinta arriba y abajo, donde se apoyan el contenido
        y la flecha.
      */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: `linear-gradient(180deg,
            rgba(3, 24, 60, ${VELO}) 0%,
            rgba(3, 24, 60, ${VELO * 0.82}) 40%,
            rgba(3, 24, 60, ${VELO * 0.82}) 60%,
            rgba(3, 24, 60, ${VELO}) 100%)`,
        }}
      />

      <Stack alignItems="center" spacing={{ xs: 2, md: 2.5 }} sx={{ px: 3, maxWidth: 640 }}>
        {/*
          El monograma respira: crece y flota despacio, el mismo pulso que tiene
          en el pie. Con `prefers-reduced-motion` se queda quieto — el bucle
          infinito es justo el tipo de movimiento que esa preferencia apaga.
        */}
        <Box
          component={motion.img}
          src="/llf-removebg-preview.png"
          alt="Liga Lago Futsal"
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
          animate={
            reduceMotion
              ? undefined
              : { opacity: 1, scale: [1, 1.06, 1], y: [0, -8, 0] }
          }
          transition={{
            opacity: { duration: 0.5 },
            scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          }}
          sx={{
            height: { xs: 120, sm: 150, md: 190 },
            width: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.45))',
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent="center"
        >
          {/* El nombre de la edición: es el dato que ubica todo lo que viene abajo. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              px: 1.75,
              py: 0.7,
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
                fontSize: { xs: 15, md: 17 },
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
        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap justifyContent="center">
          <Button
            size="large"
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
            size="large"
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

      {/*
        La portada se lleva la pantalla entera, así que hay que decir que abajo
        hay partidos. Es un botón de verdad, no un adorno: quien no puede usar
        el mouse también tiene que poder bajar desde acá.
      */}
      <Box
        component={motion.button}
        type="button"
        onClick={bajar}
        aria-label="Ver los partidos"
        animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          translate: '-50% 0',
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.28)',
          bgcolor: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          cursor: 'pointer',
          p: 0,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
        }}
      >
        <KeyboardArrowDownRounded />
      </Box>
    </Box>
  );
};
