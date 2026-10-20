import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { loginSchema, changePasswordSchema } from './auth.schema';

const router = Router();

router.post('/login', validateRequest(loginSchema), (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), (req, res) =>
  authController.changePassword(req, res)
);
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

export default router;
