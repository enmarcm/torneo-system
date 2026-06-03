import { AppBar, Toolbar, Box, Typography, Stack, IconButton, Menu, MenuItem, Avatar, Tooltip, Select, FormControl, MenuItem as MuiMenuItem } from '@mui/material';
import { LightModeRounded, DarkModeRounded, NotificationsNoneRounded, MenuRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useEditionsQuery } from '@/hooks/queries';
import { todayLong } from '@/utils/formatDate';

interface Props {
  onOpenSidebar?: () => void;
}

export const Topbar: React.FC<Props> = ({ onOpenSidebar }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { mode, toggleMode, selectedEditionId, setSelectedEditionId } = useGlobalStore();
  const { data: editions = [] } = useEditionsQuery();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: '0 !important',
      }}
    >
      <Toolbar sx={{ minHeight: 72, gap: 1.5, px: { xs: 2, md: 3 } }}>
        <IconButton onClick={onOpenSidebar} aria-label="Abrir menú">
          <MenuRounded />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ lineHeight: 1.1, fontSize: { xs: 16, md: 20 } }} noWrap>
            Hola, {user?.email?.split('@')[0]?.toUpperCase() ?? 'EQUIPO'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {todayLong()}
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: { xs: 120, md: 180 }, display: { xs: 'none', sm: 'inline-flex' } }}>
          <Select
            value={selectedEditionId ?? ''}
            onChange={(e) => setSelectedEditionId(e.target.value || null)}
            displayEmpty
            inputProps={{ 'aria-label': 'Edición' }}
          >
            <MuiMenuItem value="">
              <em>Todas las ediciones</em>
            </MuiMenuItem>
            {editions.map((ed) => (
              <MuiMenuItem key={ed.id} value={ed.id}>
                {ed.name}
              </MuiMenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton onClick={toggleMode} aria-label="Cambiar tema">
            {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notificaciones">
          <IconButton aria-label="Notificaciones">
            <NotificationsNoneRounded />
          </IconButton>
        </Tooltip>

        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Menú de usuario" sx={{ p: 0.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 700 }}>
            {user?.email?.[0]?.toUpperCase()}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <Stack>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.email}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Líder de equipo'}
              </Typography>
            </Stack>
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); logout(); }} sx={{ color: 'error.main' }}>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
