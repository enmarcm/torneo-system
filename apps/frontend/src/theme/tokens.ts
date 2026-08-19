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
  heroGradient: 'linear-gradient(135deg,#2A3352 0%,#1B2237 100%)',
  brandGradient: 'linear-gradient(135deg,#034292 0%,#2563EB 100%)',
};

export const darkTokens = {
  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  primarySoft: 'rgba(59,130,246,0.16)',
  accent: '#FF9A63',
  accentSoft: 'rgba(255,154,99,0.16)',
  sidebar: '#11172A',
  sidebarHover: '#1B2237',
  sidebarText: '#8B95B5',
  sidebarActiveBg: '#1B2237',
  sidebarBorder: 'rgba(255,255,255,0.08)',
  logo: '#FFFFFF',
  bg: '#0F1525',
  surface: '#1A2236',
  surface2: '#222B42',
  border: 'rgba(255,255,255,0.08)',
  text: '#EEF1F8',
  textMuted: '#9AA4BF',
  textDisabled: '#7D87A6',
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.16)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.16)',
  info: '#60A5FA',
  infoSoft: 'rgba(96,165,250,0.16)',
  live: '#FF5C72',
  heroGradient: 'linear-gradient(135deg,#222B42 0%,#141B2E 100%)',
  brandGradient: 'linear-gradient(135deg,#2563EB 0%,#60A5FA 100%)',
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
