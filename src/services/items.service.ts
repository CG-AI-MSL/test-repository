import { ItemsRepository } from '../repositories/items.repository';
import { TagsRepository } from '../repositories/tags.repository';
import { CreateItemDto, UpdateItemDto, PaginatedResult, BadRequestError } from '../types';
import { NotFoundError } from './users.service';

export class ItemsService {
  constructor(
    private readonly itemsRepo: ItemsRepository,
    private readonly tagsRepo: TagsRepository,
  ) {}

  async listByUser(
    userId: string,
    page = 1,
    limit = 20,
    completed?: boolean,
    tagIds?: string[],
    tagMode?: 'and' | 'or',
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const { items, total } = await this.itemsRepo.findByUser(userId, {
      skip,
      take: limit,
      completed,
      tagIds,
      tagMode,
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

    const { tagIds, ...itemData } = dto;

    if (tagIds !== undefined) {
      if (tagIds.length > 5) {
        throw new BadRequestError('Max 5 tags per item');
      }
      if (tagIds.length > 0) {
        const validTags = await this.tagsRepo.findManyByIds(tagIds, userId);
        if (validTags.length !== tagIds.length) {
          throw new BadRequestError('Invalid tag ID(s)');
        }
      }
    }

    return this.itemsRepo.update(id, itemData, tagIds);
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
