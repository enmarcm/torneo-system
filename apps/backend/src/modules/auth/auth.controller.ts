import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { authService } from './auth.service';
import { env } from '@/config/env';

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 3600 * 1000,
  path: '/',
};

export const authController = {
  login: asyncHandler(async (req, res) => {
    // `email` sigue leyéndose por si entra una petición del panel anterior.
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password: string;
    };
    const { user, accessToken, refreshToken } = await authService.login(
      (username ?? email)!,
      password,
    );
    res.cookie('refreshToken', refreshToken, cookieOpts);
    ok(res, { user, accessToken }, 'Sesión iniciada');
  }),

  refresh: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies?.refreshToken,
    );
    res.cookie('refreshToken', refreshToken, cookieOpts);
    ok(res, { user, accessToken });
  }),

  logout: asyncHandler(async (_req, res) => {
    res.clearCookie('refreshToken', { path: '/', httpOnly: true, sameSite: 'lax', secure: cookieOpts.secure });
    ok(res, null, 'Sesión cerrada');
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user!.id);
    ok(res, user);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    ok(res, null, 'Contraseña actualizada');
  }),

  updateMe: asyncHandler(async (req, res) => {
    const { email } = req.body as { email?: string | null };
    const user = await authService.updateMe(req.user!.id, email ? email : null);
    ok(res, user, 'Datos actualizados');
  }),
};
