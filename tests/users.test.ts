import { UsersService, NotFoundError, ConflictError } from '../src/services/users.service';
import { UsersRepository } from '../src/repositories/users.repository';

// Mock the repository
jest.mock('../src/repositories/users.repository');

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    mockRepo = new UsersRepository(null as any) as jest.Mocked<UsersRepository>;
    service = new UsersService(mockRepo);
  });

  describe('list', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', email: 'alice@example.com', name: 'Alice', role: 'USER', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'bob@example.com', name: 'Bob', role: 'ADMIN', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockRepo.findAll.mockResolvedValue({ users: mockUsers as any, total: 2 });

      const result = await service.list(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockRepo.findAll).toHaveBeenCalledWith({ skip: 0, take: 20 });
    });

    it('should handle pagination correctly', async () => {
      mockRepo.findAll.mockResolvedValue({ users: [] as any, total: 50 });

      const result = await service.list(3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(mockRepo.findAll).toHaveBeenCalledWith({ skip: 20, take: 10 });
    });
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', email: 'alice@example.com', name: 'Alice' };
      mockRepo.findById.mockResolvedValue(mockUser as any);

      const result = await service.getById('1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = { email: 'new@example.com', name: 'New User' };
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ id: '3', ...dto, role: 'USER' } as any);

      const result = await service.create(dto);

      expect(result.email).toBe('new@example.com');
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New User',
        role: 'USER',
      });
    });

    it('should throw ConflictError when email already exists', async () => {
      const dto = { email: 'existing@example.com', name: 'Duplicate' };
      mockRepo.findByEmail.mockResolvedValue({ id: '1' } as any);

      await expect(service.create(dto)).rejects.toThrow(ConflictError);
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1' } as any);
      mockRepo.delete.mockResolvedValue({ id: '1' } as any);

      await service.delete('1');

      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError when deleting non-existent user', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('999')).rejects.toThrow(NotFoundError);
    });
  });
});
