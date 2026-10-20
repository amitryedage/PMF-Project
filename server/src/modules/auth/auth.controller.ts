import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { env } from '../../config/env';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_COOKIE_MAX_AGE,
      });

      return sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err: any) {
      return sendError(res, err.message, 401);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const oldRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
      if (!oldRefreshToken) {
        return sendError(res, 'Refresh token missing', 401);
      }

      const result = await authService.refreshToken(oldRefreshToken);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_COOKIE_MAX_AGE,
      });

      return sendSuccess(res, {
        accessToken: result.accessToken,
      });
    } catch (err: any) {
      res.clearCookie(REFRESH_COOKIE_NAME);
      return sendError(res, err.message, 401);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
      if (req.user) {
        await authService.logout(req.user.userId, refreshToken);
      }

      res.clearCookie(REFRESH_COOKIE_NAME);
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      await authService.changePassword(req.user.userId, req.body);
      res.clearCookie(REFRESH_COOKIE_NAME);

      return sendSuccess(res, { message: 'Password changed successfully. Please login again.' });
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const user = await authService.getCurrentUser(req.user.userId);
      return sendSuccess(res, user);
    } catch (err: any) {
      return sendError(res, err.message, 404);
    }
  }
}

export const authController = new AuthController();
