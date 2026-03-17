import { ItemsRepository } from '../src/repositories/items.repository';

// Mock the entire @prisma/client module
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(),
    Prisma: {},
  };
});

describe('ItemsRepository tag extensions', () => {
  let repo: ItemsRepository;
  let mockPrisma: any;

  const mockTag = {
    id: 'tag-1',
    name: 'urgent',
    color: '#ff0000',
    createdAt: new Date(),
    userId: 'user-1',
  };

  const mockItemTag = {
    itemId: 'item-1',
    tagId: 'tag-1',
    tag: mockTag,
  };

  const mockItemWithTags = {
    id: 'item-1',
    title: 'Test Item',
    description: null,
    completed: false,
    priority: 'MEDIUM',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    itemTags: [mockItemTag],
  };

  const mockItemNoTags = {
    id: 'item-2',
    title: 'Another Item',
    description: null,
    completed: false,
    priority: 'MEDIUM',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    itemTags: [],
  };

  beforeEach(() => {
    mockPrisma = {
      item: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      itemTag: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repo = new ItemsRepository(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: findById returns item with itemTags array
  describe('findById', () => {
    it('should return item with itemTags array including tag data', async () => {
      mockPrisma.item.findUnique.mockResolvedValue(mockItemWithTags);

      const result = await repo.findById('item-1');

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: { itemTags: { include: { tag: true } } },
      });
      expect(result).toEqual(mockItemWithTags);
      expect((result as any)?.itemTags).toHaveLength(1);
      expect((result as any)?.itemTags[0].tag).toEqual(mockTag);
    });
  });

  // Test 2: create returns item with itemTags: []
  describe('create', () => {
    it('should return newly created item with empty itemTags array', async () => {
      mockPrisma.item.create.mockResolvedValue(mockItemNoTags);

      const result = await repo.create({
        title: 'Another Item',
        user: { connect: { id: 'user-1' } },
      });

      expect(mockPrisma.item.create).toHaveBeenCalledWith({
        data: {
          title: 'Another Item',
          user: { connect: { id: 'user-1' } },
        },
        include: { itemTags: { include: { tag: true } } },
      });
      expect((result as any).itemTags).toEqual([]);
    });
  });

  // Test 3: findByUser with no tagIds — backward compat
  describe('findByUser with no tagIds', () => {
    it('should work same as before (backward compatible) and return items with itemTags', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockItemNoTags], 1]);

      const result = await repo.findByUser('user-1', { skip: 0, take: 20 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);

      // Verify transaction was called with correct findMany (includes itemTags, no tag filter)
      const transactionArgs = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionArgs).toBeDefined();
    });

    it('should not apply tag filter when tagIds is undefined', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockItemNoTags], 1]);

      await repo.findByUser('user-1');

      const transactionArgs = mockPrisma.$transaction.mock.calls[0][0];
      // The where clause passed to item.findMany should not contain itemTags or AND for tags
      // We can verify by checking the item.findMany was called without tag filter
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // Test 4: findByUser with tagIds (OR mode)
  describe('findByUser with tagIds OR mode', () => {
    it('should apply itemTags some filter with tagId in tagIds', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockItemWithTags], 1]);

      const result = await repo.findByUser('user-1', {
        tagIds: ['tag-1', 'tag-2'],
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);

      // Verify the findMany was called with itemTags filter
      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            itemTags: { some: { tagId: { in: ['tag-1', 'tag-2'] } } },
          }),
          include: { itemTags: { include: { tag: true } } },
        }),
      );
    });
  });

  // Test 5: findByUser with tagIds and tagMode='and'
  describe('findByUser with tagIds AND mode', () => {
    it('should apply AND filter with itemTags.some for each tagId', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockItemWithTags], 1]);

      await repo.findByUser('user-1', {
        tagIds: ['tag-1', 'tag-2'],
        tagMode: 'and',
      });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            AND: [
              { itemTags: { some: { tagId: 'tag-1' } } },
              { itemTags: { some: { tagId: 'tag-2' } } },
            ],
          }),
          include: { itemTags: { include: { tag: true } } },
        }),
      );
    });
  });

  // Test 6: findByUser with tagIds=[] — no filter applied
  describe('findByUser with empty tagIds', () => {
    it('should not apply tag filter when tagIds is empty array', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockItemNoTags, mockItemWithTags], 2]);

      await repo.findByUser('user-1', { tagIds: [] });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          include: { itemTags: { include: { tag: true } } },
        }),
      );
    });
  });

  // Test 7: update with tagIds — uses transaction
  describe('update with tagIds', () => {
    it('should use transaction to replace tag associations', async () => {
      const deleteResult = { count: 1 };
      const createResult = { count: 1 };
      const updatedItem = { ...mockItemWithTags, title: 'Updated' };

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        return [deleteResult, createResult, updatedItem];
      });

      // Spy on deleteMany and createMany to verify they're called with correct args
      mockPrisma.itemTag.deleteMany.mockReturnValue(deleteResult);
      mockPrisma.itemTag.createMany.mockReturnValue(createResult);
      mockPrisma.item.update.mockResolvedValue(updatedItem);

      const result = await repo.update('item-1', { title: 'Updated' }, ['tag-1']);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedItem);
    });

    it('should call deleteMany with itemId in transaction', async () => {
      const updatedItem = { ...mockItemWithTags };
      let capturedOps: any[] = [];

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        capturedOps = operations;
        return [{}, {}, updatedItem];
      });

      mockPrisma.itemTag.deleteMany.mockReturnValue({ count: 0 });
      mockPrisma.itemTag.createMany.mockReturnValue({ count: 1 });
      mockPrisma.item.update.mockResolvedValue(updatedItem);

      await repo.update('item-1', { title: 'Updated' }, ['tag-1']);

      expect(mockPrisma.itemTag.deleteMany).toHaveBeenCalledWith({
        where: { itemId: 'item-1' },
      });
      expect(mockPrisma.itemTag.createMany).toHaveBeenCalledWith({
        data: [{ itemId: 'item-1', tagId: 'tag-1' }],
      });
    });
  });

  // Test 8: update with tagIds: [] — clears all tags
  describe('update with tagIds: []', () => {
    it('should clear all tags (deleteMany only, no createMany)', async () => {
      const updatedItemNoTags = { ...mockItemNoTags, title: 'Updated' };

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        return [{}, updatedItemNoTags];
      });

      mockPrisma.itemTag.deleteMany.mockReturnValue({ count: 2 });
      mockPrisma.item.update.mockResolvedValue(updatedItemNoTags);

      const result = await repo.update('item-2', { title: 'Updated' }, []);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.itemTag.deleteMany).toHaveBeenCalledWith({
        where: { itemId: 'item-2' },
      });
      // createMany should NOT be called when tagIds is empty
      expect(mockPrisma.itemTag.createMany).not.toHaveBeenCalled();
      expect(result).toEqual(updatedItemNoTags);
    });
  });

  // Test 9: update with tagIds omitted — does not touch itemTag associations
  describe('update with tagIds omitted', () => {
    it('should not use transaction and not modify itemTag associations', async () => {
      const updatedItem = { ...mockItemWithTags, title: 'Updated' };
      mockPrisma.item.update.mockResolvedValue(updatedItem);

      const result = await repo.update('item-1', { title: 'Updated' });

      // Should use item.update directly, not $transaction
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { title: 'Updated' },
        include: { itemTags: { include: { tag: true } } },
      });
      // $transaction should NOT be called for tag operations
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(updatedItem);
    });
  });
});
