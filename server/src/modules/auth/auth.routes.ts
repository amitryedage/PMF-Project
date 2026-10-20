import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { loginSchema, changePasswordSchema } from './auth.schema';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP address. Please wait 15 minutes before trying again.',
  },
});

const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many token refresh requests. Please re-authenticate.',
  },
});

router.post('/login', authRateLimiter, validateRequest(loginSchema), (req, res) => authController.login(req, res));
router.post('/refresh', refreshRateLimiter, (req, res) => authController.refresh(req, res));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), (req, res) =>
  authController.changePassword(req, res)
);
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

export default router;
