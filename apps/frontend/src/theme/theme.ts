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
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: t.scrollThumb,
            borderRadius: 999,
            border: `2px solid ${t.bg}`,
          },
          '*::-webkit-scrollbar-thumb:hover': { background: t.textDisabled },
          '*': { scrollbarWidth: 'thin', scrollbarColor: `${t.scrollThumb} transparent` },
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
          root: { borderRadius: 10, padding: '9px 18px', fontWeight: 600 },
          containedPrimary: {
            boxShadow: t.shadowPrimary,
            '&:hover': { boxShadow: t.shadowPrimaryHover },
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
