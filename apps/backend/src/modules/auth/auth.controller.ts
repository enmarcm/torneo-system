import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { authService } from './auth.service';

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  maxAge: 7 * 24 * 3600 * 1000,
  path: '/',
};

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const { user, accessToken, refreshToken } = await authService.login(email, password);
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
    res.clearCookie('refreshToken', { path: '/' });
    ok(res, null, 'Sesión cerrada');
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user!.id);
    ok(res, user);
  }),
};
