import { Request, Response } from 'express';
import { z } from 'zod';
import { UsersService } from '../services/users.service';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await this.usersService.list(page, limit);
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.usersService.getById(req.params.id);
      res.json(user);
    } catch (err: any) {
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      const user = await this.usersService.create(parsed.data);
      res.status(201).json(user);
    } catch (err: any) {
      if (err.status === 409) {
        res.status(409).json({ error: err.message });
      } else {
        throw err;
      }
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.usersService.delete(req.params.id);
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
