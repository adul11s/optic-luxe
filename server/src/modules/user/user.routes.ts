import { Router } from 'express';
import { getUsers, createStaff, updateUser, deleteUser } from './user.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware('ADMIN'), getUsers);
router.post('/staff', authMiddleware, roleMiddleware('ADMIN'), createStaff);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateUser);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteUser);

export default router;
