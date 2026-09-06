import { Router } from 'express';
import { getSiteConfig, updateSiteConfig } from './site-config.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/', getSiteConfig);
router.put('/', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), updateSiteConfig);

export default router;
