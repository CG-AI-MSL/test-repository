import { Router } from 'express';
import { ItemsController } from '../controllers/items.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export function createItemsRouter(controller: ItemsController): Router {
  const router = Router();

  // GET /api/items - List items for the authenticated user
  router.get('/', authMiddleware, controller.list);

  // POST /api/items - Create a new item
  router.post('/', authMiddleware, controller.create);

  // PUT /api/items/:id - Update an item
  router.put('/:id', authMiddleware, controller.update);

  // DELETE /api/items/:id - Delete an item
  router.delete('/:id', authMiddleware, controller.delete);

  // GET /api/items/stats - Get item stats for the authenticated user
  router.get('/stats', authMiddleware, controller.stats);

  return router;
}
