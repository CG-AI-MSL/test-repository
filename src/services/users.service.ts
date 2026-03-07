import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto, UpdateUserDto, PaginatedResult } from '../types';

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async list(page = 1, limit = 20): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const { users, total } = await this.usersRepo.findAll({ skip, take: limit });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError(`User with email ${dto.email} already exists`);
    }
    return this.usersRepo.create({
      email: dto.email,
      name: dto.name,
      role: dto.role ?? 'USER',
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.getById(id); // throws if not found
    if (dto.email) {
      const existing = await this.usersRepo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Email ${dto.email} is already in use`);
      }
    }
    return this.usersRepo.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id); // throws if not found
    return this.usersRepo.delete(id);
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  readonly status = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
