import { PrismaClient, Tag } from '@prisma/client';
import { CreateTagDto, UpdateTagDto } from '../types';

export class TagsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllByUser(userId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  async findByNormalizedName(userId: string, lowerName: string): Promise<Tag | null> {
    // Tags are stored with original casing; uniqueness checked against lowercase
    // We fetch all user tags and compare lowercase to support case-insensitive check
    const tags = await this.prisma.tag.findMany({ where: { userId } });
    return tags.find(t => t.name.toLowerCase() === lowerName) ?? null;
  }

  async findManyByIds(ids: string[], userId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { id: { in: ids }, userId },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.tag.count({ where: { userId } });
  }

  async create(userId: string, data: CreateTagDto): Promise<Tag> {
    return this.prisma.tag.create({
      data: {
        name: data.name,
        color: data.color ?? null,
        user: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, data: UpdateTagDto): Promise<Tag> {
    return this.prisma.tag.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async delete(id: string): Promise<Tag> {
    return this.prisma.tag.delete({ where: { id } });
  }
}
