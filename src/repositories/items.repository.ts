import { PrismaClient, Item, Prisma } from '@prisma/client';

type ItemWithTags = Item & {
  itemTags: Array<{
    itemId: string;
    tagId: string;
    tag: { id: string; name: string; color: string | null; createdAt: Date; userId: string };
  }>;
};

export class ItemsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      completed?: boolean;
      tagIds?: string[];
      tagMode?: 'and' | 'or';
      orderBy?: Prisma.ItemOrderByWithRelationInput;
    },
  ): Promise<{ items: ItemWithTags[]; total: number }> {
    const where: Prisma.ItemWhereInput = { userId };

    if (params?.completed !== undefined) {
      where.completed = params.completed;
    }

    if (params?.tagIds && params.tagIds.length > 0) {
      if (params.tagMode === 'and') {
        where.AND = params.tagIds.map((tagId) => ({
          itemTags: { some: { tagId } },
        }));
      } else {
        // OR mode (default)
        where.itemTags = { some: { tagId: { in: params.tagIds } } };
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
        include: { itemTags: { include: { tag: true } } },
      }),
      this.prisma.item.count({ where }),
    ]);

    return { items: items as ItemWithTags[], total };
  }

  async findById(id: string): Promise<ItemWithTags | null> {
    return this.prisma.item.findUnique({
      where: { id },
      include: { itemTags: { include: { tag: true } } },
    }) as Promise<ItemWithTags | null>;
  }

  async create(data: Prisma.ItemCreateInput): Promise<ItemWithTags> {
    return this.prisma.item.create({
      data,
      include: { itemTags: { include: { tag: true } } },
    }) as Promise<ItemWithTags>;
  }

  async update(id: string, data: Prisma.ItemUpdateInput, tagIds?: string[]): Promise<ItemWithTags> {
    if (tagIds !== undefined) {
      // Transactional tag replacement
      const ops: any[] = [
        this.prisma.itemTag.deleteMany({ where: { itemId: id } }),
        ...(tagIds.length > 0
          ? [
              this.prisma.itemTag.createMany({
                data: tagIds.map((tagId) => ({ itemId: id, tagId })),
              }),
            ]
          : []),
        this.prisma.item.update({
          where: { id },
          data,
          include: { itemTags: { include: { tag: true } } },
        }),
      ];

      const results = await this.prisma.$transaction(ops);
      const updatedItem = results[results.length - 1];
      return updatedItem as ItemWithTags;
    }

    return this.prisma.item.update({
      where: { id },
      data,
      include: { itemTags: { include: { tag: true } } },
    }) as Promise<ItemWithTags>;
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
