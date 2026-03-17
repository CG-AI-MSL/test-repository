import { Response } from 'express';
import { z } from 'zod';
import { TagsService } from '../services/tags.service';
import { AuthRequest } from '../middleware/auth.middleware';

const CreateTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be 30 characters or less')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Name may only contain letters, numbers, spaces, and hyphens'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #FF5733)')
    .optional(),
});

const UpdateTagSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[a-zA-Z0-9\s-]+$/)
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .refine((d) => d.name !== undefined || d.color !== undefined, {
    message: 'At least one field (name or color) is required',
  });

export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const tags = await this.tagsService.list(req.userId!);
    res.json(tags);
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateTagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      const tag = await this.tagsService.create(req.userId!, parsed.data);
      res.status(201).json(tag);
    } catch (err: any) {
      if (err.status === 400) {
        res.status(400).json({ error: err.message });
      } else if (err.status === 409) {
        res.status(409).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = UpdateTagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      const tag = await this.tagsService.update(req.params.id, req.userId!, parsed.data);
      res.json(tag);
    } catch (err: any) {
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
      } else if (err.status === 409) {
        res.status(409).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.tagsService.delete(req.params.id, req.userId!);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };
}
