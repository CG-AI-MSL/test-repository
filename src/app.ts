import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { createUsersRouter } from './routes/users.router';
import { createItemsRouter } from './routes/items.router';
import { createTagsRouter } from './routes/tags.router';
import { UsersController } from './controllers/users.controller';
import { ItemsController } from './controllers/items.controller';
import { TagsController } from './controllers/tags.controller';
import { UsersService } from './services/users.service';
import { ItemsService } from './services/items.service';
import { TagsService } from './services/tags.service';
import { UsersRepository } from './repositories/users.repository';
import { ItemsRepository } from './repositories/items.repository';
import { TagsRepository } from './repositories/tags.repository';

export function createApp(prisma?: PrismaClient) {
  const app = express();
  const db = prisma ?? new PrismaClient();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Wire up dependencies
  const usersRepo = new UsersRepository(db);
  const itemsRepo = new ItemsRepository(db);
  const tagsRepo = new TagsRepository(db);
  const usersService = new UsersService(usersRepo);
  const itemsService = new ItemsService(itemsRepo, tagsRepo);
  const tagsService = new TagsService(tagsRepo);
  const usersController = new UsersController(usersService);
  const itemsController = new ItemsController(itemsService);
  const tagsController = new TagsController(tagsService);

  // Routes
  app.use('/api/users', createUsersRouter(usersController));
  app.use('/api/items', createItemsRouter(itemsController));
  app.use('/api/tags', createTagsRouter(tagsController));

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, prisma: db };
}
