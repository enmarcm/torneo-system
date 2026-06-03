import { createTheme } from '@mui/material/styles';
import { lightTokens, darkTokens, type Tokens } from './tokens';

export const buildTheme = (mode: 'light' | 'dark') => {
  const t: Tokens = mode === 'light' ? lightTokens : darkTokens;
  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, dark: t.primaryHover, contrastText: '#fff' },
      secondary: { main: t.accent, contrastText: '#fff' },
      success: { main: t.success, contrastText: '#fff' },
      warning: { main: t.warning, contrastText: '#fff' },
      error: { main: t.danger, contrastText: '#fff' },
      info: { main: t.info, contrastText: '#fff' },
      background: { default: t.bg, paper: t.surface },
      text: { primary: t.text, secondary: t.textMuted },
      divider: t.border,
    },
    shape: { borderRadius: 12 },
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
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', borderRadius: 18 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${t.border}`,
            boxShadow: '0 4px 16px rgba(27,34,55,0.06)',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, padding: '9px 18px', fontWeight: 600 },
          containedPrimary: {
            boxShadow: '0 6px 16px rgba(67,97,238,0.25)',
            '&:hover': { boxShadow: '0 8px 22px rgba(67,97,238,0.35)' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12, backgroundColor: t.surface2 },
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
          root: { backgroundImage: 'none' },
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
