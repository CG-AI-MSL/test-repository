import { ItemsService } from '../src/services/items.service';
import { ItemsRepository } from '../src/repositories/items.repository';
import { TagsRepository } from '../src/repositories/tags.repository';
import { NotFoundError } from '../src/services/users.service';

jest.mock('../src/repositories/items.repository');
jest.mock('../src/repositories/tags.repository');

describe('ItemsService', () => {
  let service: ItemsService;
  let mockRepo: jest.Mocked<ItemsRepository>;
  let mockTagsRepo: jest.Mocked<TagsRepository>;

  beforeEach(() => {
    mockRepo = new ItemsRepository(null as any) as jest.Mocked<ItemsRepository>;
    mockTagsRepo = new TagsRepository(null as any) as jest.Mocked<TagsRepository>;
    service = new ItemsService(mockRepo, mockTagsRepo);
  });

  describe('listByUser', () => {
    it('should return paginated items for a user', async () => {
      const mockItems = [
        { id: '1', title: 'Task 1', completed: false, userId: 'u1' },
        { id: '2', title: 'Task 2', completed: true, userId: 'u1' },
      ];
      mockRepo.findByUser.mockResolvedValue({ items: mockItems as any, total: 2 });

      const result = await service.listByUser('u1', 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by completed status', async () => {
      mockRepo.findByUser.mockResolvedValue({ items: [] as any, total: 0 });

      await service.listByUser('u1', 1, 20, true);

      expect(mockRepo.findByUser).toHaveBeenCalledWith('u1', {
        skip: 0,
        take: 20,
        completed: true,
      });
    });
  });

  describe('create', () => {
    it('should create an item for the user', async () => {
      const dto = { title: 'New Task', description: 'A test task' };
      mockRepo.create.mockResolvedValue({
        id: '3',
        ...dto,
        completed: false,
        priority: 'MEDIUM',
        userId: 'u1',
      } as any);

      const result = await service.create('u1', dto);

      expect(result.title).toBe('New Task');
      expect(mockRepo.create).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'A test task',
        priority: 'MEDIUM',
        user: { connect: { id: 'u1' } },
      });
    });
  });

  describe('update', () => {
    it('should update an item belonging to the user', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      mockRepo.update.mockResolvedValue({ id: '1', completed: true } as any);

      const result = await service.update('1', 'u1', { completed: true });

      expect(result.completed).toBe(true);
    });

    it('should throw NotFoundError when item belongs to another user', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1', userId: 'other-user' } as any);

      await expect(service.update('1', 'u1', { completed: true }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete an item belonging to the user', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      mockRepo.delete.mockResolvedValue({ id: '1' } as any);

      await service.delete('1', 'u1');

      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('getStats', () => {
    it('should return completion stats', async () => {
      mockRepo.countByUser.mockResolvedValue({ total: 10, completed: 7 });

      const stats = await service.getStats('u1');

      expect(stats.total).toBe(10);
      expect(stats.completed).toBe(7);
    });
  });
});
