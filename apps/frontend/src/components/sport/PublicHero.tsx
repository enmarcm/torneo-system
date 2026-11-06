import { Box, Button, Container, Stack, Typography } from '@mui/material';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import TableChartRounded from '@mui/icons-material/TableChartRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { ROUTES } from '@/routes/routes';
import { TeamCrestStrip } from './TeamCrestStrip';
import { isComingSoon } from '@/routes/comingSoon';
import hero1600 from '@/assets/hero-cancha-1600.jpg';
import hero900 from '@/assets/hero-cancha-900.jpg';

interface Props {
  editionName: string;
  seasonNumber: number;
  liveCount: number;
  children?: React.ReactNode;
}

/** La portada completa la primera pantalla; la jornada comienza debajo. */
export const PublicHero: React.FC<Props> = ({ editionName, seasonNumber, liveCount, children }) => {
  const navigate = useNavigate();
  const setHeroActive = useGlobalStore((s) => s.setPublicHeroActive);
  useLayoutEffect(() => {
    setHeroActive(true);
    return () => setHeroActive(false);
  }, [setHeroActive]);
  return (
    <Box id="public-hero" component="section" aria-labelledby="edition-title" sx={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', display: 'flex', mt: 'calc(-1 * var(--public-topbar-height))', minHeight: '100svh', color: 'var(--photoText)', bgcolor: 'var(--brandSurface)' }}>
      <Box component="img" src={hero1600} srcSet={`${hero900} 900w, ${hero1600} 1600w`} sizes="100vw" alt="" aria-hidden loading="eager" fetchPriority="high" sx={{ position: 'absolute', inset: 0, zIndex: -2, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 45%' }} />
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, zIndex: -1, bgcolor: 'var(--photoScrim)' }} />
      <Container maxWidth="xl" sx={{ display: 'flex', flexDirection: 'column', pt: { xs: 'calc(var(--public-topbar-height) + 24px)', md: 'calc(var(--public-topbar-height) + 32px)' }, pb: { xs: 3, md: 4 }, gap: { xs: 3, md: 4 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2.5, md: 4 }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="center" sx={{ flex: 1 }}>
          <Box sx={{ flex: { xs: '0 1 auto', md: 1 }, minWidth: 0 }}>
            <Typography id="edition-title" component="h1" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: { xs: 32, sm: 48, md: 64 }, lineHeight: 1.2, textWrap: 'balance', overflowWrap: 'anywhere', maxWidth: '24ch' }}>{editionName}</Typography>
            <Typography sx={{ mt: 1, color: 'var(--photoText)', fontSize: { xs: 14, md: 15 } }}>Temporada {seasonNumber} · Liga Lago Futsal</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 2.5 }}>
              <Button variant="contained" startIcon={<CalendarMonthRounded />} onClick={() => navigate(ROUTES.public.schedule)} sx={{ bgcolor: 'var(--photoText)', color: 'var(--brandInk)', '&:hover': { bgcolor: 'var(--primarySoft)' } }}>Ver partidos</Button>
              <Button variant="outlined" startIcon={<TableChartRounded />} onClick={() => navigate(ROUTES.public.competitions)} sx={{ color: 'var(--photoText)', borderColor: 'var(--photoText)', '&:hover': { borderColor: 'var(--photoText)', bgcolor: 'var(--photoScrim)' } }}>Ver tablas</Button>
              {liveCount > 0 && !isComingSoon(ROUTES.public.live) && <Button endIcon={<ArrowForwardRounded />} onClick={() => navigate(ROUTES.public.live)} sx={{ color: 'var(--photoText)' }}><Box component="span" sx={{ width: 7, height: 7, mr: 1, borderRadius: '50%', bgcolor: 'var(--live)' }} />{liveCount} en vivo</Button>}
            </Stack>
          </Box>
          {children && <Box sx={{ width: { xs: '100%', md: 360 }, maxWidth: '100%', flexShrink: 0 }}>{children}</Box>}
        </Stack>
        <TeamCrestStrip onDark />
      </Container>
    </Box>
  );
};
