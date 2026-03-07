import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();

  // GET /api/users - List all users (admin only)
  router.get('/', authMiddleware, requireRole('ADMIN'), controller.list);

  // GET /api/users/:id - Get user by ID
  router.get('/:id', authMiddleware, controller.getById);

  // POST /api/users - Create a new user (admin only)
  router.post('/', authMiddleware, requireRole('ADMIN'), controller.create);

  // DELETE /api/users/:id - Delete a user (admin only)
  router.delete('/:id', authMiddleware, requireRole('ADMIN'), controller.delete);

  return router;
}
