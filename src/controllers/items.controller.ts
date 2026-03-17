import { Response } from 'express';
import { z } from 'zod';
import { ItemsService } from '../services/items.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { BadRequestError } from '../types';

const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const UpdateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  tagIds: z.array(z.string()).max(5, 'Max 5 tags per item').optional(),
});

export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const completed = req.query.completed !== undefined
      ? req.query.completed === 'true'
      : undefined;

    // Tag filter params
    const tagsParam = req.query.tags as string | undefined;
    const tagIds = tagsParam
      ? tagsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const tagModeParam = req.query.tagMode as string | undefined;
    if (tagModeParam !== undefined && tagModeParam !== 'and' && tagModeParam !== 'or') {
      res.status(400).json({ error: 'Validation failed', details: { tagMode: ['Must be "and" or "or"'] } });
      return;
    }
    const tagMode = (tagModeParam as 'and' | 'or') || 'or';

    const result = await this.itemsService.listByUser(
      req.userId!,
      page,
      limit,
      completed,
      tagIds?.length ? tagIds : undefined,
      tagMode,
    );
    res.json(result);
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const item = await this.itemsService.create(req.userId!, parsed.data);
    res.status(201).json(item);
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = UpdateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      const item = await this.itemsService.update(req.params.id, req.userId!, parsed.data);
      res.json(item);
    } catch (err: any) {
      if (err instanceof BadRequestError) {
        res.status(400).json({ error: err.message });
      } else if (err.status === 404) {
        res.status(404).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.itemsService.delete(req.params.id, req.userId!);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };

  stats = async (req: AuthRequest, res: Response): Promise<void> => {
    const stats = await this.itemsService.getStats(req.userId!);
    res.json(stats);
  };
}
