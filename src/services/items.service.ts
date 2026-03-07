import { ItemsRepository } from '../repositories/items.repository';
import { CreateItemDto, UpdateItemDto, PaginatedResult } from '../types';
import { NotFoundError } from './users.service';

export class ItemsService {
  constructor(private readonly itemsRepo: ItemsRepository) {}

  async listByUser(
    userId: string,
    page = 1,
    limit = 20,
    completed?: boolean,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const { items, total } = await this.itemsRepo.findByUser(userId, {
      skip,
      take: limit,
      completed,
    });

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const item = await this.itemsRepo.findById(id);
    if (!item) {
      throw new NotFoundError(`Item with id ${id} not found`);
    }
    return item;
  }

  async create(userId: string, dto: CreateItemDto) {
    return this.itemsRepo.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? 'MEDIUM',
      user: { connect: { id: userId } },
    });
  }

  async update(id: string, userId: string, dto: UpdateItemDto) {
    const item = await this.getById(id);
    if (item.userId !== userId) {
      throw new NotFoundError(`Item with id ${id} not found`);
    }
    return this.itemsRepo.update(id, dto);
  }

  async delete(id: string, userId: string) {
    const item = await this.getById(id);
    if (item.userId !== userId) {
      throw new NotFoundError(`Item with id ${id} not found`);
    }
    return this.itemsRepo.delete(id);
  }

  async getStats(userId: string) {
    return this.itemsRepo.countByUser(userId);
  }
}
