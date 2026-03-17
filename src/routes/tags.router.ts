import { Router } from 'express';
import { TagsController } from '../controllers/tags.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export function createTagsRouter(controller: TagsController): Router {
  const router = Router();

  // GET /api/tags - List tags for the authenticated user
  router.get('/', authMiddleware, controller.list);

  // POST /api/tags - Create a new tag
  router.post('/', authMiddleware, controller.create);

  // PUT /api/tags/:id - Update a tag
  router.put('/:id', authMiddleware, controller.update);

  // DELETE /api/tags/:id - Delete a tag
  router.delete('/:id', authMiddleware, controller.delete);

  return router;
}
