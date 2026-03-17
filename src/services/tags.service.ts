import { TagsRepository } from '../repositories/tags.repository';
import { CreateTagDto, UpdateTagDto, TagDto, TagWithUserDto, BadRequestError } from '../types';
import { NotFoundError, ConflictError } from './users.service';

export class TagsService {
  constructor(private readonly tagsRepo: TagsRepository) {}

  async list(userId: string): Promise<TagDto[]> {
    const tags = await this.tagsRepo.findAllByUser(userId);
    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
    }));
  }

  async create(userId: string, dto: CreateTagDto): Promise<TagWithUserDto> {
    const count = await this.tagsRepo.countByUser(userId);
    if (count >= 50) {
      throw new BadRequestError('Tag limit reached (max 50)');
    }

    const existing = await this.tagsRepo.findByNormalizedName(userId, dto.name.toLowerCase());
    if (existing) {
      throw new ConflictError('Tag name already exists');
    }

    const tag = await this.tagsRepo.create(userId, dto);
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      userId: tag.userId,
      createdAt: tag.createdAt,
    };
  }

  async update(id: string, userId: string, dto: UpdateTagDto): Promise<TagWithUserDto> {
    const tag = await this.tagsRepo.findById(id);
    if (!tag || tag.userId !== userId) {
      throw new NotFoundError('Tag not found');
    }

    if (dto.name !== undefined) {
      const normalizedNew = dto.name.toLowerCase();
      const normalizedExisting = tag.name.toLowerCase();
      if (normalizedNew !== normalizedExisting) {
        const conflict = await this.tagsRepo.findByNormalizedName(userId, normalizedNew);
        if (conflict) {
          throw new ConflictError('Tag name already exists');
        }
      }
    }

    const updated = await this.tagsRepo.update(id, dto);
    return {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      userId: updated.userId,
      createdAt: updated.createdAt,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const tag = await this.tagsRepo.findById(id);
    if (!tag || tag.userId !== userId) {
      throw new NotFoundError('Tag not found');
    }
    await this.tagsRepo.delete(id);
  }
}
