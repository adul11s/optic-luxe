import { Router } from 'express';
import { login, register, getMe, changePassword } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { loginRateLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// 5 login attempts / 5 menit per IP — ke-6 dalam jendela → 429
router.post('/login', loginRateLimiter, login);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, changePassword);

export default router;
