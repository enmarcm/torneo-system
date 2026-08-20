export const lightTokens = {
  primary: '#034292',
  primaryHover: '#023575',
  primarySoft: '#E0E8F4',
  accent: '#FF8A4C',
  accentSoft: '#FFEDE1',
  sidebar: '#FFFFFF',
  sidebarHover: '#F4F6FB',
  sidebarText: '#6B7494',
  sidebarActiveBg: '#E0E8F4',
  sidebarBorder: '#E6E9F2',
  logo: '#1A2138',
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  surface2: '#F8FAFD',
  border: '#E6E9F2',
  text: '#1A2138',
  textMuted: '#6B7494',
  /*
    Sin este valor regía el default de MUI (rgba(0,0,0,0.38)): ~2.9:1 sobre
    blanco, por debajo de AA. Carga el "VS" y el separador del marcador, o sea
    lo único que distingue un partido futuro, en una pantalla que se lee al sol.
  */
  textDisabled: '#8A92AD',
  success: '#22C55E',
  successSoft: '#E7F8EE',
  warning: '#F59E0B',
  warningSoft: '#FEF3E2',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
  info: '#3B82F6',
  infoSoft: '#E8F1FE',
  live: '#FF3B53',
  /*
    Tinta de lo que va ENCIMA del relleno rojo del vivo. El blanco sobre
    #FF3B53 da 3.5:1: por debajo de AA para un rótulo de 11px, justo en el
    único estado que la pantalla existe para comunicar. Este rojo-negro da
    5.3:1 y deja la bengala a saturación completa, que es lo que la hace
    visible de reojo.
  */
  liveOn: '#2B0710',
  /* Tinta de lo que va encima del relleno primario. */
  primaryOn: '#FFFFFF',
  heroGradient: 'linear-gradient(135deg,#2A3352 0%,#1B2237 100%)',
  brandGradient: 'linear-gradient(135deg,#034292 0%,#2563EB 100%)',
  /* Sombras: en claro despegan del papel; en oscuro tienen que ser negro real. */
  shadowSurface: '0 4px 16px rgba(27,34,55,0.06)',
  shadowPrimary: '0 6px 16px rgba(3,66,146,0.25)',
  shadowPrimaryHover: '0 8px 22px rgba(3,66,146,0.35)',
  /* Superficies de navegación traslúcidas sobre el lienzo. */
  scrollThumb: '#CBD2E4',
  selectionBg: '#CFE0FA',
  selectionText: '#08183A',
};

/*
  "La Cancha de Noche", literal. El fondo es la tribuna apagada —un negro con
  azul adentro, no un gris— y cada superficie es una zona bajo los reflectores:
  se levanta del fondo por luz propia y queda recortada por un filo de 1px de
  blanco, que es como el sistema define profundidad también en claro.

  El contraste no es preferencia estética: el sitio se lee parado en la cancha,
  de noche, con reflectores pegándole a la pantalla. El texto va a 16:1 sobre
  la tarjeta y el secundario a 7:1.
*/
export const darkTokens = {
  primary: '#4D93FF',
  primaryHover: '#7DB0FF',
  primarySoft: 'rgba(77,147,255,0.18)',
  accent: '#FF9A63',
  accentSoft: 'rgba(255,154,99,0.16)',
  sidebar: '#0A0F1E',
  sidebarHover: 'rgba(255,255,255,0.05)',
  sidebarText: '#98A3BE',
  sidebarActiveBg: 'rgba(77,147,255,0.16)',
  sidebarBorder: 'rgba(255,255,255,0.09)',
  logo: '#FFFFFF',
  bg: '#070B16',
  surface: '#101828',
  /*
    Más oscuro que la tarjeta, no más claro: el campo de formulario y la
    cabecera de tabla se HUNDEN respecto de la superficie que los contiene,
    igual que en claro (#F8FAFD bajo #FFFFFF). Invertir eso los haría flotar.
  */
  surface2: '#0B1220',
  border: 'rgba(255,255,255,0.10)',
  text: '#F2F5FC',
  textMuted: '#98A3BE',
  textDisabled: '#7C87A3',
  success: '#3DDC97',
  successSoft: 'rgba(61,220,151,0.16)',
  warning: '#FFC44D',
  warningSoft: 'rgba(255,196,77,0.16)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255,107,107,0.16)',
  info: '#5FA8FF',
  infoSoft: 'rgba(95,168,255,0.16)',
  live: '#FF4D63',
  liveOn: '#160309',
  /*
    Sobre #4D93FF el blanco da 3.0:1 y el rótulo del botón primario es texto
    chico. La tinta del fondo da 5.9:1 y además hace que el botón se lea como
    una luz encendida y no como otra superficie más.
  */
  primaryOn: '#08122A',
  heroGradient: 'linear-gradient(135deg,#16294F 0%,#080D1B 100%)',
  brandGradient: 'linear-gradient(135deg,#1E4FA8 0%,#4D93FF 100%)',
  shadowSurface: '0 10px 28px rgba(0,0,0,0.55)',
  shadowPrimary: '0 6px 18px rgba(77,147,255,0.30)',
  shadowPrimaryHover: '0 10px 26px rgba(77,147,255,0.42)',
  scrollThumb: '#26314C',
  selectionBg: 'rgba(77,147,255,0.32)',
  selectionText: '#F2F5FC',
};

export type Tokens = typeof lightTokens;

export const statCardTints: Record<string, [string, string]> = {
  primary: ['var(--primarySoft)', 'var(--primary)'],
  success: ['var(--successSoft)', 'var(--success)'],
  warning: ['var(--warningSoft)', 'var(--warning)'],
  info: ['var(--infoSoft)', 'var(--info)'],
  danger: ['var(--dangerSoft)', 'var(--danger)'],
  accent: ['var(--accentSoft)', 'var(--accent)'],
};
