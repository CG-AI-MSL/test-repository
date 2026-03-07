import { PrismaClient, User, Prisma } from '@prisma/client';

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
        include: { items: { select: { id: true, title: true, completed: true } } },
      }),
      this.prisma.user.count(),
    ]);

    return { users, total };
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
