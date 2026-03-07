import { PrismaClient, Item, Prisma } from '@prisma/client';

export class ItemsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      completed?: boolean;
      orderBy?: Prisma.ItemOrderByWithRelationInput;
    },
  ): Promise<{ items: Item[]; total: number }> {
    const where: Prisma.ItemWhereInput = { userId };
    if (params?.completed !== undefined) {
      where.completed = params.completed;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<Item | null> {
    return this.prisma.item.findUnique({ where: { id } });
  }

  async create(data: Prisma.ItemCreateInput): Promise<Item> {
    return this.prisma.item.create({ data });
  }

  async update(id: string, data: Prisma.ItemUpdateInput): Promise<Item> {
    return this.prisma.item.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Item> {
    return this.prisma.item.delete({ where: { id } });
  }

  async countByUser(userId: string): Promise<{ total: number; completed: number }> {
    const [total, completed] = await this.prisma.$transaction([
      this.prisma.item.count({ where: { userId } }),
      this.prisma.item.count({ where: { userId, completed: true } }),
    ]);
    return { total, completed };
  }
}
