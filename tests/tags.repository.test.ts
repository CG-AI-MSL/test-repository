import { TagsRepository } from '../src/repositories/tags.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockTagFns = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      tag: mockTagFns,
    })),
  };
});

describe('TagsRepository', () => {
  let prisma: PrismaClient;
  let repo: TagsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repo = new TagsRepository(prisma);
  });

  describe('create', () => {
    it('should call prisma.tag.create with userId and data', async () => {
      const mockTag = { id: 't1', name: 'Work', color: '#ff0000', userId: 'u1', createdAt: new Date() };
      (prisma.tag.create as jest.Mock).mockResolvedValue(mockTag);

      const result = await repo.create('u1', { name: 'Work', color: '#ff0000' });

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Work',
          color: '#ff0000',
          user: { connect: { id: 'u1' } },
        },
      });
      expect(result).toEqual(mockTag);
    });

    it('should default color to null when not provided', async () => {
      const mockTag = { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() };
      (prisma.tag.create as jest.Mock).mockResolvedValue(mockTag);

      await repo.create('u1', { name: 'Work' });

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Work',
          color: null,
          user: { connect: { id: 'u1' } },
        },
      });
    });
  });

  describe('findAllByUser', () => {
    it('should call prisma.tag.findMany with userId filter and orderBy', async () => {
      const mockTags = [
        { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() },
        { id: 't2', name: 'Personal', color: '#blue', userId: 'u1', createdAt: new Date() },
      ];
      (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const result = await repo.findAllByUser('u1');

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockTags);
    });
  });

  describe('findById', () => {
    it('should call prisma.tag.findUnique with id', async () => {
      const mockTag = { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() };
      (prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag);

      const result = await repo.findById('t1');

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({ where: { id: 't1' } });
      expect(result).toEqual(mockTag);
    });

    it('should return null when tag not found', async () => {
      (prisma.tag.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByNormalizedName', () => {
    it('should find tag matching lowercase name for user', async () => {
      const mockTags = [
        { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() },
        { id: 't2', name: 'Personal', color: null, userId: 'u1', createdAt: new Date() },
      ];
      (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const result = await repo.findByNormalizedName('u1', 'work');

      expect(prisma.tag.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(result).toEqual(mockTags[0]);
    });

    it('should return null when no tag matches the normalized name', async () => {
      const mockTags = [
        { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() },
      ];
      (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const result = await repo.findByNormalizedName('u1', 'personal');

      expect(result).toBeNull();
    });

    it('should be case-insensitive when matching names', async () => {
      const mockTags = [
        { id: 't1', name: 'WORK', color: null, userId: 'u1', createdAt: new Date() },
      ];
      (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const result = await repo.findByNormalizedName('u1', 'work');

      expect(result).toEqual(mockTags[0]);
    });
  });

  describe('findManyByIds', () => {
    it('should call prisma.tag.findMany with id in list and userId filter', async () => {
      const mockTags = [
        { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() },
        { id: 't2', name: 'Personal', color: null, userId: 'u1', createdAt: new Date() },
      ];
      (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const result = await repo.findManyByIds(['t1', 't2'], 'u1');

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['t1', 't2'] }, userId: 'u1' },
      });
      expect(result).toEqual(mockTags);
    });
  });

  describe('update', () => {
    it('should call prisma.tag.update with id and data (sparse update)', async () => {
      const mockTag = { id: 't1', name: 'Updated', color: null, userId: 'u1', createdAt: new Date() };
      (prisma.tag.update as jest.Mock).mockResolvedValue(mockTag);

      const result = await repo.update('t1', { name: 'Updated' });

      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { name: 'Updated' },
      });
      expect(result).toEqual(mockTag);
    });

    it('should only include defined fields in sparse update', async () => {
      const mockTag = { id: 't1', name: 'Work', color: '#red', userId: 'u1', createdAt: new Date() };
      (prisma.tag.update as jest.Mock).mockResolvedValue(mockTag);

      await repo.update('t1', { color: '#red' });

      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { color: '#red' },
      });
    });
  });

  describe('delete', () => {
    it('should call prisma.tag.delete with id', async () => {
      const mockTag = { id: 't1', name: 'Work', color: null, userId: 'u1', createdAt: new Date() };
      (prisma.tag.delete as jest.Mock).mockResolvedValue(mockTag);

      const result = await repo.delete('t1');

      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
      expect(result).toEqual(mockTag);
    });
  });

  describe('countByUser', () => {
    it('should call prisma.tag.count with userId filter', async () => {
      (prisma.tag.count as jest.Mock).mockResolvedValue(5);

      const result = await repo.countByUser('u1');

      expect(prisma.tag.count).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(result).toBe(5);
    });
  });
});
