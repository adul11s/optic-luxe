import { Router } from 'express';
import { getTryOnAssets } from './tryon.controller.js';

const router = Router();

router.get('/:id/tryon-assets', getTryOnAssets);

export default router;