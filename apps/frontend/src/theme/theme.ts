import { createTheme } from '@mui/material/styles';
import { lightTokens, darkTokens, type Tokens } from './tokens';

export const buildTheme = (mode: 'light' | 'dark') => {
  const t: Tokens = mode === 'light' ? lightTokens : darkTokens;
  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, dark: t.primaryHover, contrastText: t.primaryOn },
      secondary: { main: t.accent, contrastText: '#fff' },
      success: { main: t.success, contrastText: '#fff' },
      warning: { main: t.warning, contrastText: '#fff' },
      error: { main: t.danger, contrastText: '#fff' },
      info: { main: t.info, contrastText: '#fff' },
      background: { default: t.bg, paper: t.surface },
      text: { primary: t.text, secondary: t.textMuted, disabled: t.textDisabled },
      divider: t.border,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      h1: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.875rem' },
      h2: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.5rem' },
      h3: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '1.25rem' },
      h4: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '1.0625rem' },
      h5: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '1rem' },
      h6: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.9375rem' },
      button: { textTransform: 'none', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif' },
      body1: { fontSize: '0.9375rem' },
      body2: { fontSize: '0.875rem' },
      caption: { fontSize: '0.75rem' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          /*
            Sin esto, los controles nativos (barras de scroll, autocompletado,
            selectores de fecha) siguen pintándose en claro con el sitio en
            oscuro. Es una línea y arregla todo lo que el navegador dibuja solo.
          */
          ':root': { colorScheme: mode },
          '::selection': { backgroundColor: t.selectionBg, color: t.selectionText },
          // La caret y el foco también son parte del sistema, no del navegador.
          'input, textarea': { caretColor: t.primary },
          ':focus-visible': {
            outline: `2px solid ${t.primary}`,
            outlineOffset: 2,
            borderRadius: 6,
          },
          /*
            Carril transparente y pulgar blanco. El borde va transparente y
            recortado al relleno para afinar el pulgar sin pintar el color de
            página alrededor: pintado, dejaba un halo claro sobre la portada.
          */
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: '#FFFFFF',
            borderRadius: 999,
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '*::-webkit-scrollbar-thumb:hover': { background: '#FFFFFF' },
          '*': { scrollbarWidth: 'thin', scrollbarColor: '#FFFFFF transparent' },
          /*
            El carril del sitio público, en navy.

            Un carril `transparent` no deja ver lo que hay detrás: el navegador
            lo pinta con el esquema de color de la página, y con `color-scheme:
            light` eso es una franja blanca al costado de la portada. La única
            forma de que tome otro color es decírselo, y hay que decirlo en las
            dos sintaxis: Chrome ya entiende `scrollbar-color` y, cuando la
            entiende, ignora las reglas `::-webkit-scrollbar-*`.

            Va atado a una clase que solo pone el sitio público: en el panel de
            administración un riel oscuro al borde no tendría con qué combinar.
          */
          'html.llf-publico': { scrollbarColor: `#FFFFFF ${t.publicRail}` },
          'html.llf-publico::-webkit-scrollbar-track': { background: t.publicRail },
          'html.llf-publico ::-webkit-scrollbar-track': { background: t.publicRail },
          /*
            Regla del Número Tabular del sistema: los marcadores y puntajes se
            comparan entre filas, y un dígito que cambia de ancho al actualizarse
            hace bailar la columna entera.
          */
          '.tabular': { fontVariantNumeric: 'tabular-nums' },
          /*
            El punto de "en vivo" late con esta animación. Estaba usada en dos
            componentes pero el keyframe no existía en ningún lado, así que el
            punto quedaba quieto: la única señal de que hay algo pasando ahora
            no se movía.
          */
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.45, transform: 'scale(0.82)' },
          },
          /*
            Lenguaje de movimiento del sitio. Todos los keyframes viven acá, con
            prefijo `llf`, para que ningún componente vuelva a animar con un
            nombre que nadie definió (ver `pulse`, arriba).

            - Hover: 180–220 ms. Entradas: 260–320 ms. Bucles de carga: 1–1.6 s.
            - Curva única para lo que entra o se mueve: cubic-bezier(.2,.7,.2,1).
              `linear` solo para giros y barras de tiempo.
            - El naranja marca progreso y foco; el rojo sigue siendo del vivo.
          */
          '@keyframes llfSpin': { to: { transform: 'rotate(360deg)' } },
          '@keyframes llfRise': {
            from: { opacity: 0, transform: 'translateY(6px)' },
            to: { opacity: 1, transform: 'none' },
          },
          '@keyframes llfSweep': { to: { strokeDashoffset: 0 } },
          // El gol nuevo cae desde arriba en naranja y vuelve a su color.
          '@keyframes llfBump': {
            from: { opacity: 0, transform: 'translateY(-10px)', color: t.accent },
            '60%': { color: t.accent },
            to: { opacity: 1, transform: 'none' },
          },
          '@keyframes llfDot': {
            '0%, 80%, 100%': { opacity: 0.45, transform: 'translateY(0)' },
            '40%': { opacity: 1, transform: 'translateY(-5px)' },
          },
          '@keyframes llfDraw': { to: { strokeDashoffset: 0 } },
          /*
            Loader principal (PageLoader): el balón rueda 176 px y gira 460°
            —lo que rueda un balón de 44 px— y las letras L·L·F se encienden
            cuando el balón pasa debajo. El ciclo completo (ida y vuelta) dura
            3.4 s; los porcentajes de cada letra son el instante en que el
            balón cruza su posición (−60, 0 y +60 px) con esa curva.
          */
          '@keyframes llfRollX': {
            from: { transform: 'translateX(-88px)' },
            to: { transform: 'translateX(88px)' },
          },
          '@keyframes llfRollR': {
            from: { transform: 'rotate(-460deg)' },
            to: { transform: 'rotate(460deg)' },
          },
          '@keyframes llfLetter1': {
            '0%': { opacity: 0.5 },
            '9%': { opacity: 1, textShadow: `0 0 18px ${t.accent}99` },
            '22%': { opacity: 0.18, textShadow: '0 0 0 transparent' },
            '78%': { opacity: 0.18 },
            '91%': { opacity: 1, textShadow: `0 0 18px ${t.accent}99` },
            '100%': { opacity: 0.5, textShadow: '0 0 0 transparent' },
          },
          '@keyframes llfLetter2': {
            '0%, 13%': { opacity: 0.18 },
            '25%': { opacity: 1, textShadow: `0 0 18px ${t.accent}99` },
            '38%, 62%': { opacity: 0.18, textShadow: '0 0 0 transparent' },
            '75%': { opacity: 1, textShadow: `0 0 18px ${t.accent}99` },
            '88%, 100%': { opacity: 0.18, textShadow: '0 0 0 transparent' },
          },
          '@keyframes llfLetter3': {
            '0%, 29%': { opacity: 0.18 },
            '41%, 59%': { opacity: 1, textShadow: `0 0 18px ${t.accent}99` },
            '72%, 100%': { opacity: 0.18, textShadow: '0 0 0 transparent' },
          },
          // Pantalla de acceso: los reflectores respiran, la tarjeta se sacude
          // con un error y el balón entra rodando con el saludo.
          '@keyframes llfLampBreathe': {
            '0%, 100%': { opacity: 0.7 },
            '50%': { opacity: 1 },
          },
          '@keyframes llfShake': {
            '10%, 90%': { transform: 'translateX(-1px)' },
            '20%, 80%': { transform: 'translateX(2px)' },
            '30%, 50%, 70%': { transform: 'translateX(-4px)' },
            '40%, 60%': { transform: 'translateX(4px)' },
          },
          // Balón del login al pasar el cursor: va y vuelve 40 px girando lo
          // que rueda (un balón de 96 px gira 48° en ese recorrido).
          // Arranca y termina en reposo: al entrar el cursor no hay salto.
          '@keyframes llfRollHoverX': {
            '0%, 100%': { transform: 'translateX(0)' },
            '25%': { transform: 'translateX(-20px)' },
            '75%': { transform: 'translateX(20px)' },
          },
          '@keyframes llfRollHoverR': {
            '0%, 100%': { transform: 'rotate(0)' },
            '25%': { transform: 'rotate(-24deg)' },
            '75%': { transform: 'rotate(24deg)' },
          },
          '@keyframes llfRollIn': {
            from: { opacity: 0, transform: 'translateX(-80px) rotate(-360deg)' },
            to: { opacity: 1, transform: 'none' },
          },
          // Reflectores del loader de partidos y tablas (MatchLoader).
          '@keyframes llfLampOn': {
            '0%': { opacity: 0 },
            '10%, 60%': { opacity: 1 },
            '80%, 100%': { opacity: 0 },
          },
          '@keyframes llfBlurUp': {
            from: { opacity: 0, filter: 'blur(12px)', transform: 'scale(1.06)' },
            to: { opacity: 1, filter: 'blur(0)', transform: 'none' },
          },
          /*
            Entrada de página en cascada. Los layouts envuelven el <Outlet> con
            `.llf-page` y `key={pathname}`, así cada ruta monta de cero y sus
            bloques suben 6px con 50 ms de diferencia. Se anima al nivel de los
            nietos porque el hijo directo es casi siempre el Container de la
            página; animarlo a él sería un fundido único, no una cascada.
          */
          '.llf-page > * > *': {
            animation: 'llfRise 0.3s cubic-bezier(.2,.7,.2,1) both',
          },
          '.llf-page > * > :nth-child(2)': { animationDelay: '50ms' },
          '.llf-page > * > :nth-child(3)': { animationDelay: '100ms' },
          '.llf-page > * > :nth-child(4)': { animationDelay: '150ms' },
          '.llf-page > * > :nth-child(5)': { animationDelay: '200ms' },
          '.llf-page > * > :nth-child(n+6)': { animationDelay: '250ms' },
          /* Contenido de una pestaña recién elegida: mismo ascenso, más corto. */
          '.llf-rise': { animation: 'llfRise 0.26s cubic-bezier(.2,.7,.2,1) both' },
          /*
            Tarjeta que lleva a otro lado. No cambia de color: sube 2px, el
            borde toma el primario, el escudo crece apenas y, si tiene flecha,
            entra desde la izquierda. Se aplica con `className="llf-cardlink"`.
          */
          '.llf-cardlink': {
            transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
            '& .llf-crest': { transition: 'transform 0.25s cubic-bezier(.2,.7,.2,1)' },
            '& .llf-cardlink-arrow': {
              opacity: 0,
              transform: 'translateX(-8px)',
              transition: 'opacity 0.2s, transform 0.25s cubic-bezier(.2,.7,.2,1)',
            },
          },
          '.llf-cardlink:hover': {
            borderColor: t.primary,
            transform: 'translateY(-2px)',
            boxShadow: t.shadowPrimary,
            '& .llf-crest': { transform: 'scale(1.06)' },
            '& .llf-cardlink-arrow': { opacity: 1, transform: 'none' },
          },
          /*
            Fila que se puede abrir: se tiñe del primario suave, el nombre toma
            el primario y el chevrón se adelanta. `className="llf-row"` en el <tr>.
          */
          '.llf-row': {
            transition: 'background-color 0.18s',
            '& .llf-row-name': { transition: 'color 0.18s' },
            '& .llf-row-chevron': {
              opacity: 0.5,
              transition: 'transform 0.2s, opacity 0.2s, color 0.2s',
            },
          },
          '.llf-row:hover': {
            backgroundColor: t.primarySoft,
            '& .llf-row-name': { color: t.primary },
            '& .llf-row-chevron': { opacity: 1, transform: 'translateX(3px)', color: t.primary },
          },
          /*
            Enlace de navegación horizontal con subrayado que crece desde el
            centro. El activo queda subrayado en naranja y no se mueve.
          */
          '.llf-navlink': {
            position: 'relative',
            paddingBottom: 2,
            transition: 'color 0.2s',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              borderRadius: 2,
              backgroundColor: 'currentColor',
              transform: 'scaleX(0)',
              transformOrigin: 'center',
              transition: 'transform 0.22s cubic-bezier(.2,.7,.2,1)',
            },
            '&:hover::after': { transform: 'scaleX(1)' },
            '&.active::after': { transform: 'scaleX(1)', backgroundColor: t.accent },
          },
          // Se consume a la intemperie y en movimiento: quien pide menos
          // animación deja de ver latidos y transiciones.
          '@media (prefers-reduced-motion: reduce)': {
            '*': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', borderRadius: 12 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${t.border}`,
            boxShadow: t.shadowSurface,
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '9px 18px',
            fontWeight: 600,
            /*
              Las flechas se adelantan al pasar el cursor: la de "Volver" hacia
              atrás, la de "Ver más" hacia adelante. Se detectan por el icono y
              no por una clase, así ningún botón queda afuera por olvido.
            */
            '& .MuiButton-startIcon, & .MuiButton-endIcon': {
              transition: 'transform 0.22s cubic-bezier(.2,.7,.2,1)',
            },
            '&:hover .MuiButton-startIcon:has(svg[data-testid^="ArrowBack"])': {
              transform: 'translateX(-4px)',
            },
            '&:hover .MuiButton-endIcon:has(svg[data-testid^="ArrowForward"], svg[data-testid^="East"], svg[data-testid^="ChevronRight"])':
              { transform: 'translateX(4px)' },
            /* "Volver" pasa de tinta suave a tinta, sin relleno. */
            '&.MuiButton-text:has(.MuiButton-startIcon svg[data-testid^="ArrowBack"]):hover': {
              color: t.text,
              backgroundColor: 'transparent',
            },
          },
          containedPrimary: {
            boxShadow: t.shadowPrimary,
            '&:hover': { boxShadow: t.shadowPrimaryHover },
          },
        },
      },
      /*
        Esqueleto teñido del azul del sistema, no del gris de MUI: una carga en
        la cancha de noche tiene que verse como parte de la cancha.
      */
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#131E36' : '#E6EBF5',
            '&::after': {
              background: `linear-gradient(90deg, transparent, ${mode === 'dark' ? '#1C2B4D' : '#F5F7FC'}, transparent)`,
            },
          },
        },
      },
      /* El indicador viaja y se estira hasta la pestaña nueva, con la curva del sistema. */
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 2.5,
            borderRadius: 2,
            transition:
              'left 0.28s cubic-bezier(.2,.8,.2,1), width 0.28s cubic-bezier(.2,.8,.2,1)',
          },
        },
      },
      /* Enlace en párrafo: el subrayado naranja engorda y se acerca al texto. */
      MuiLink: {
        defaultProps: { underline: 'always' },
        styleOverrides: {
          root: {
            color: t.text,
            textDecorationColor: t.accent,
            textDecorationThickness: '1.5px',
            textUnderlineOffset: 3,
            transition:
              'text-decoration-thickness 0.18s, text-underline-offset 0.18s, color 0.18s',
            '&:hover': {
              color: t.primary,
              textDecorationColor: t.accent,
              textDecorationThickness: '2.5px',
              textUnderlineOffset: 2,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10, backgroundColor: t.surface2 },
          notchedOutline: { borderColor: t.border },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: { fontSize: '0.9375rem' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 600 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: 12, padding: '6px 10px' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none', borderRadius: 0 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: { backgroundColor: t.surface2 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 600, color: t.textMuted, fontSize: '0.8125rem' },
        },
      },
    },
  });
};
