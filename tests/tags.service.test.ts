import { TagsService } from '../src/services/tags.service';
import { TagsRepository } from '../src/repositories/tags.repository';
import { NotFoundError, ConflictError } from '../src/services/users.service';
import { BadRequestError } from '../src/types';

jest.mock('../src/repositories/tags.repository');

describe('TagsService', () => {
  let service: TagsService;
  let mockRepo: jest.Mocked<TagsRepository>;

  const makeTag = (overrides: Partial<any> = {}) => ({
    id: 'tag-1',
    name: 'Work',
    color: '#ff0000',
    userId: 'user-1',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  });

  beforeEach(() => {
    mockRepo = {
      findAllByUser: jest.fn(),
      findById: jest.fn(),
      findByNormalizedName: jest.fn(),
      findManyByIds: jest.fn(),
      countByUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new TagsService(mockRepo);
  });

  describe('list', () => {
    it('should return all tags for a user as TagDto[]', async () => {
      const tags = [
        makeTag({ id: 'tag-1', name: 'Work' }),
        makeTag({ id: 'tag-2', name: 'Personal' }),
      ];
      mockRepo.findAllByUser.mockResolvedValue(tags as any);

      const result = await service.list('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tag-1',
        name: 'Work',
        color: '#ff0000',
        createdAt: tags[0].createdAt,
      });
      // TagDto should NOT include userId
      expect((result[0] as any).userId).toBeUndefined();
      expect(mockRepo.findAllByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    it('should throw BadRequestError when 50 tags already exist', async () => {
      mockRepo.countByUser.mockResolvedValue(50);

      await expect(service.create('user-1', { name: 'NewTag' }))
        .rejects.toThrow(BadRequestError);
      await expect(service.create('user-1', { name: 'NewTag' }))
        .rejects.toThrow('Tag limit reached (max 50)');
    });

    it('should throw ConflictError for duplicate name (case-insensitive)', async () => {
      mockRepo.countByUser.mockResolvedValue(5);
      mockRepo.findByNormalizedName.mockResolvedValue(makeTag() as any);

      await expect(service.create('user-1', { name: 'WORK' }))
        .rejects.toThrow(ConflictError);
      await expect(service.create('user-1', { name: 'WORK' }))
        .rejects.toThrow('Tag name already exists');
    });

    it('should normalize name to lowercase when checking uniqueness', async () => {
      mockRepo.countByUser.mockResolvedValue(5);
      mockRepo.findByNormalizedName.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(makeTag({ name: 'WORK' }) as any);

      await service.create('user-1', { name: 'WORK' });

      expect(mockRepo.findByNormalizedName).toHaveBeenCalledWith('user-1', 'work');
    });

    it('should create tag and return TagWithUserDto on success', async () => {
      const tag = makeTag();
      mockRepo.countByUser.mockResolvedValue(5);
      mockRepo.findByNormalizedName.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(tag as any);

      const result = await service.create('user-1', { name: 'Work', color: '#ff0000' });

      expect(result).toEqual({
        id: 'tag-1',
        name: 'Work',
        color: '#ff0000',
        userId: 'user-1',
        createdAt: tag.createdAt,
      });
      expect(mockRepo.create).toHaveBeenCalledWith('user-1', { name: 'Work', color: '#ff0000' });
    });
  });

  describe('update', () => {
    it('should throw NotFoundError when tag does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('tag-99', 'user-1', { name: 'Updated' }))
        .rejects.toThrow(NotFoundError);
      await expect(service.update('tag-99', 'user-1', { name: 'Updated' }))
        .rejects.toThrow('Tag not found');
    });

    it('should throw NotFoundError when tag belongs to a different user', async () => {
      mockRepo.findById.mockResolvedValue(makeTag({ userId: 'other-user' }) as any);

      await expect(service.update('tag-1', 'user-1', { name: 'Updated' }))
        .rejects.toThrow(NotFoundError);
      await expect(service.update('tag-1', 'user-1', { name: 'Updated' }))
        .rejects.toThrow('Tag not found');
    });

    it('should throw ConflictError when updating to a duplicate name', async () => {
      const existing = makeTag({ name: 'Work' });
      mockRepo.findById.mockResolvedValue(existing as any);
      mockRepo.findByNormalizedName.mockResolvedValue(makeTag({ id: 'tag-99', name: 'Personal' }) as any);

      await expect(service.update('tag-1', 'user-1', { name: 'Personal' }))
        .rejects.toThrow(ConflictError);
      await expect(service.update('tag-1', 'user-1', { name: 'Personal' }))
        .rejects.toThrow('Tag name already exists');
    });

    it('should NOT throw ConflictError when renaming to same name with different casing', async () => {
      const existing = makeTag({ name: 'Work' });
      mockRepo.findById.mockResolvedValue(existing as any);
      mockRepo.update.mockResolvedValue(makeTag({ name: 'WORK' }) as any);

      await expect(service.update('tag-1', 'user-1', { name: 'WORK' })).resolves.not.toThrow();
      expect(mockRepo.findByNormalizedName).not.toHaveBeenCalled();
    });

    it('should update and return TagWithUserDto on success', async () => {
      const existing = makeTag({ name: 'Work' });
      const updatedTag = makeTag({ name: 'Updated' });
      mockRepo.findById.mockResolvedValue(existing as any);
      mockRepo.findByNormalizedName.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue(updatedTag as any);

      const result = await service.update('tag-1', 'user-1', { name: 'Updated' });

      expect(result).toEqual({
        id: 'tag-1',
        name: 'Updated',
        color: '#ff0000',
        userId: 'user-1',
        createdAt: updatedTag.createdAt,
      });
      expect(mockRepo.update).toHaveBeenCalledWith('tag-1', { name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundError when tag does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('tag-99', 'user-1'))
        .rejects.toThrow(NotFoundError);
      await expect(service.delete('tag-99', 'user-1'))
        .rejects.toThrow('Tag not found');
    });

    it('should throw NotFoundError when tag belongs to a different user', async () => {
      mockRepo.findById.mockResolvedValue(makeTag({ userId: 'other-user' }) as any);

      await expect(service.delete('tag-1', 'user-1'))
        .rejects.toThrow(NotFoundError);
    });

    it('should delete successfully and return void', async () => {
      mockRepo.findById.mockResolvedValue(makeTag() as any);
      mockRepo.delete.mockResolvedValue(makeTag() as any);

      const result = await service.delete('tag-1', 'user-1');

      expect(result).toBeUndefined();
      expect(mockRepo.delete).toHaveBeenCalledWith('tag-1');
    });
  });
});
