import { ItemsService } from '../src/services/items.service';
import { ItemsRepository } from '../src/repositories/items.repository';
import { TagsRepository } from '../src/repositories/tags.repository';
import { BadRequestError } from '../src/types';

jest.mock('../src/repositories/items.repository');
jest.mock('../src/repositories/tags.repository');

describe('ItemsService tag extensions', () => {
  let service: ItemsService;
  let mockItemsRepo: jest.Mocked<ItemsRepository>;
  let mockTagsRepo: jest.Mocked<TagsRepository>;

  beforeEach(() => {
    mockItemsRepo = new ItemsRepository(null as any) as jest.Mocked<ItemsRepository>;
    mockTagsRepo = new TagsRepository(null as any) as jest.Mocked<TagsRepository>;
    service = new ItemsService(mockItemsRepo, mockTagsRepo);
  });

  describe('constructor', () => {
    it('accepts (itemsRepo, tagsRepo) constructor signature', () => {
      expect(service).toBeInstanceOf(ItemsService);
    });
  });

  describe('listByUser with tag filters', () => {
    it('passes no tagIds to repository when no tag filter provided', async () => {
      mockItemsRepo.findByUser.mockResolvedValue({ items: [] as any, total: 0 });

      await service.listByUser('u1', 1, 20, undefined);

      expect(mockItemsRepo.findByUser).toHaveBeenCalledWith('u1', expect.objectContaining({
        tagIds: undefined,
        tagMode: undefined,
      }));
    });

    it('passes tagIds and tagMode=or to repository when filter provided', async () => {
      mockItemsRepo.findByUser.mockResolvedValue({ items: [] as any, total: 0 });

      await service.listByUser('u1', 1, 20, undefined, ['tag1', 'tag2'], 'or');

      expect(mockItemsRepo.findByUser).toHaveBeenCalledWith('u1', expect.objectContaining({
        tagIds: ['tag1', 'tag2'],
        tagMode: 'or',
      }));
    });

    it('passes tagIds and tagMode=and to repository when filter provided', async () => {
      mockItemsRepo.findByUser.mockResolvedValue({ items: [] as any, total: 0 });

      await service.listByUser('u1', 1, 20, undefined, ['tag1'], 'and');

      expect(mockItemsRepo.findByUser).toHaveBeenCalledWith('u1', expect.objectContaining({
        tagIds: ['tag1'],
        tagMode: 'and',
      }));
    });
  });

  describe('update with tagIds', () => {
    it('throws BadRequestError when tagIds.length > 5', async () => {
      mockItemsRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);

      await expect(
        service.update('1', 'u1', { tagIds: ['t1', 't2', 't3', 't4', 't5', 't6'] }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        service.update('1', 'u1', { tagIds: ['t1', 't2', 't3', 't4', 't5', 't6'] }),
      ).rejects.toThrow('Max 5 tags per item');
    });

    it('throws BadRequestError when tagIds contain foreign/non-existent IDs', async () => {
      mockItemsRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      // findManyByIds returns fewer tags than requested (one is foreign)
      mockTagsRepo.findManyByIds.mockResolvedValue([{ id: 'tag1' }] as any);

      await expect(
        service.update('1', 'u1', { tagIds: ['tag1', 'foreign-tag'] }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        service.update('1', 'u1', { tagIds: ['tag1', 'foreign-tag'] }),
      ).rejects.toThrow('Invalid tag ID(s)');
    });

    it('calls tagsRepo.findManyByIds then itemsRepo.update with tagIds when valid', async () => {
      mockItemsRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      mockTagsRepo.findManyByIds.mockResolvedValue([
        { id: 'tag1' },
        { id: 'tag2' },
      ] as any);
      mockItemsRepo.update.mockResolvedValue({ id: '1', completed: false } as any);

      await service.update('1', 'u1', { tagIds: ['tag1', 'tag2'] });

      expect(mockTagsRepo.findManyByIds).toHaveBeenCalledWith(['tag1', 'tag2'], 'u1');
      expect(mockItemsRepo.update).toHaveBeenCalledWith('1', expect.anything(), ['tag1', 'tag2']);
    });

    it('passes empty tagIds to itemsRepo.update to clear tags', async () => {
      mockItemsRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      mockItemsRepo.update.mockResolvedValue({ id: '1' } as any);

      await service.update('1', 'u1', { tagIds: [] });

      // tagsRepo.findManyByIds should NOT be called for empty array (no IDs to validate)
      expect(mockTagsRepo.findManyByIds).not.toHaveBeenCalled();
      expect(mockItemsRepo.update).toHaveBeenCalledWith('1', expect.anything(), []);
    });

    it('does NOT call tagsRepo.findManyByIds when tagIds is omitted', async () => {
      mockItemsRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      mockItemsRepo.update.mockResolvedValue({ id: '1', completed: true } as any);

      await service.update('1', 'u1', { completed: true });

      expect(mockTagsRepo.findManyByIds).not.toHaveBeenCalled();
    });

    it('calls itemsRepo.update without tagIds when tagIds is omitted', async () => {
      mockItemsRepo.findById.mockResolvedValue({ id: '1', userId: 'u1' } as any);
      mockItemsRepo.update.mockResolvedValue({ id: '1', completed: true } as any);

      await service.update('1', 'u1', { completed: true });

      // tagIds should be undefined (not passed as 3rd arg or passed as undefined)
      expect(mockItemsRepo.update).toHaveBeenCalledWith('1', expect.anything(), undefined);
    });
  });
});
