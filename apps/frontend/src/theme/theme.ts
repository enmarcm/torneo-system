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
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem' },
    },
    components: {
      /*
        `noWrap` solo recorta con "…" si el elemento es de bloque. Un `caption`
        o un `span` es en línea, y su texto largo se desbordaba por encima de
        lo que tenía a la derecha (el nombre del equipo pisaba la columna de
        goles). Cualquier texto que pida no partirse pasa a ser de bloque; el
        que defina su propio `display` en `sx` sigue mandando.
      */
      MuiTypography: {
        styleOverrides: {
          noWrap: { display: 'block' },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          /*
            Sin esto, los controles nativos (barras de scroll, autocompletado,
            selectores de fecha) siguen pintándose en claro con el sitio en
            oscuro. Es una línea y arregla todo lo que el navegador dibuja solo.
          */
          ':root': { colorScheme: mode },
          body: { fontVariantNumeric: 'tabular-nums' },
          'h1, h2, h3, h4, h5, h6': { textWrap: 'balance' },
          'main': { minWidth: 0 },
          '.llf-skip-link': {
            position: 'fixed', top: 8, left: 16, zIndex: 1600,
            padding: '10px 16px', backgroundColor: t.surface, color: t.text,
            borderRadius: 8, transform: 'translateY(-160%)',
            '&:focus': { transform: 'none' },
          },
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
            background: t.scrollThumb,
            borderRadius: 999,
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '*::-webkit-scrollbar-thumb:hover': { background: t.textMuted },
          '*': { scrollbarWidth: 'thin', scrollbarColor: `${t.scrollThumb} transparent` },
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
          'html.llf-publico': { scrollbarColor: `${t.scrollThumb} ${t.bg}` },
          'html.llf-publico::-webkit-scrollbar-track': { background: t.bg },
          'html.llf-publico ::-webkit-scrollbar-track': { background: t.bg },
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
            '9%': { opacity: 1 },
            '22%': { opacity: 0.18 },
            '78%': { opacity: 0.18 },
            '91%': { opacity: 1 },
            '100%': { opacity: 0.5 },
          },
          '@keyframes llfLetter2': {
            '0%, 13%': { opacity: 0.18 },
            '25%': { opacity: 1 },
            '38%, 62%': { opacity: 0.18 },
            '75%': { opacity: 1 },
            '88%, 100%': { opacity: 0.18 },
          },
          '@keyframes llfLetter3': {
            '0%, 29%': { opacity: 0.18 },
            '41%, 59%': { opacity: 1 },
            '72%, 100%': { opacity: 0.18 },
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
            Escena "próximamente" (ComingSoon): futbolistas con casco armando
            el marcador. Cada pieza tiene su propio ciclo para que la escena no
            se lea como un solo bucle repetido.
          */
          // Martillazo: se arma, golpea y rebota.
          '@keyframes llfHammer': {
            '0%, 100%': { transform: 'rotate(-38deg)' },
            '42%': { transform: 'rotate(26deg)' },
            '60%': { transform: 'rotate(10deg)' },
          },
          '@keyframes llfSpark': {
            '0%, 38%': { opacity: 0, transform: 'scale(0.4)' },
            '44%': { opacity: 1, transform: 'scale(1.15)' },
            '75%, 100%': { opacity: 0, transform: 'scale(1.5)' },
          },
          // Paso: las dos piernas usan la misma curva, una en dirección inversa.
          '@keyframes llfStep': {
            '0%, 100%': { transform: 'rotate(18deg)' },
            '50%': { transform: 'rotate(-18deg)' },
          },
          // Va y viene por la cancha cargando un ladrillo; se da vuelta en cada extremo.
          '@keyframes llfPace': {
            '0%': { transform: 'translateX(-34px) scaleX(1)' },
            '49.9%': { transform: 'translateX(34px) scaleX(1)' },
            '50%': { transform: 'translateX(34px) scaleX(-1)' },
            '99.9%': { transform: 'translateX(-34px) scaleX(-1)' },
            '100%': { transform: 'translateX(-34px) scaleX(1)' },
          },
          '@keyframes llfBob': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-3px)' },
          },
          // Cada ladrillo del marcador cae en su lugar y, al final del ciclo, se retira.
          '@keyframes llfBrickIn': {
            '0%': { opacity: 0, transform: 'translateY(-16px)' },
            '5%, 88%': { opacity: 1, transform: 'translateY(0)' },
            '96%, 100%': { opacity: 0, transform: 'translateY(0)' },
          },
          // Ladrillo que sube con la grúa hasta el marcador.
          '@keyframes llfHoist': {
            '0%, 5%': { transform: 'translateY(0)', opacity: 1 },
            '75%': { transform: 'translateY(-118px)', opacity: 1 },
            '85%, 100%': { transform: 'translateY(-118px)', opacity: 0 },
          },
          // Pelota al aire: sube frenándose y cae acelerando.
          '@keyframes llfJuggle': {
            '0%, 100%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(.2,.7,.4,1)' },
            '50%': { transform: 'translateY(-64px)', animationTimingFunction: 'cubic-bezier(.6,0,.8,.3)' },
          },
          '@keyframes llfKick': {
            '0%, 100%': { transform: 'rotate(-40deg)' },
            '10%, 80%': { transform: 'rotate(0deg)' },
          },
          // Cinta de obra: las franjas avanzan por la tira.
          '@keyframes llfHazard': {
            // 28.28 px = un período de franja (20 px) medido en horizontal a 45°: el bucle no se corta.
            to: { backgroundPosition: '28.28px 0' },
          },
          '.llf-rise': { animation: 'none' },
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

            boxShadow: 'none',
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
      MuiDialog: { styleOverrides: { paper: { boxShadow: t.floatingShadow } } },
      MuiPopover: { styleOverrides: { paper: { boxShadow: t.floatingShadow, border: `1px solid ${t.border}` } } },
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
            padding: '8px 16px',
            minHeight: 40,
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
            boxShadow: 'none',
            '&:hover': { boxShadow: t.shadowPrimaryHover },
          },
        },
      },
      /*
        Esqueleto teñido del azul del sistema, no del gris de MUI: una carga en
        la cancha de noche tiene que verse como parte de la cancha.
      */
      MuiSkeleton: {
        defaultProps: { animation: false },
        styleOverrides: {
          root: { backgroundColor: t.border, '&::after': { display: 'none' } },
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
          root: { borderRadius: 8, backgroundColor: t.surface },
          notchedOutline: { borderColor: t.controlBorder },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: { fontSize: '0.9375rem', '&::placeholder': { color: t.textMuted, opacity: 1 } },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 500, flexShrink: 0, maxWidth: '100%' },
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
          root: { backgroundColor: 'transparent' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 500, color: t.textMuted, fontSize: '0.8125rem', backgroundColor: t.surface },
          root: { borderColor: t.rowBorder, fontVariantNumeric: 'tabular-nums' },
        },
      },
    },
  });
};
