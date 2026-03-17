import { ItemsController } from '../src/controllers/items.controller';
import { ItemsService } from '../src/services/items.service';
import { BadRequestError } from '../src/types';
import { AuthRequest } from '../src/middleware/auth.middleware';
import { Response } from 'express';

// Mock ItemsService
jest.mock('../src/services/items.service');

const MockedItemsService = ItemsService as jest.MockedClass<typeof ItemsService>;

function makeRes(): jest.Mocked<Response> {
  const res: any = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as jest.Mocked<Response>;
}

function makeReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    userId: 'user-123',
    query: {},
    params: {},
    body: {},
    headers: {},
    ...overrides,
  } as unknown as AuthRequest;
}

describe('ItemsController tag extensions', () => {
  let controller: ItemsController;
  let mockService: jest.Mocked<ItemsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockedItemsService.mockClear();

    // Instantiate mock
    mockService = new MockedItemsService(null as any, null as any) as jest.Mocked<ItemsService>;
    controller = new ItemsController(mockService);
  });

  describe('GET /api/items — tag filter parsing', () => {
    it('passes tag IDs array to service when ?tags=id1,id2 provided', async () => {
      mockService.listByUser.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const req = makeReq({ query: { tags: 'id1,id2' } });
      const res = makeRes();

      await controller.list(req, res);

      expect(mockService.listByUser).toHaveBeenCalledWith(
        'user-123',
        1,
        20,
        undefined,
        ['id1', 'id2'],
        'or',
      );
    });

    it('passes tagMode=and to service when ?tags=id1,id2&tagMode=and provided', async () => {
      mockService.listByUser.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const req = makeReq({ query: { tags: 'id1,id2', tagMode: 'and' } });
      const res = makeRes();

      await controller.list(req, res);

      expect(mockService.listByUser).toHaveBeenCalledWith(
        'user-123',
        1,
        20,
        undefined,
        ['id1', 'id2'],
        'and',
      );
    });

    it('passes no tagIds to service when ?tags= is empty string', async () => {
      mockService.listByUser.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const req = makeReq({ query: { tags: '' } });
      const res = makeRes();

      await controller.list(req, res);

      expect(mockService.listByUser).toHaveBeenCalledWith(
        'user-123',
        1,
        20,
        undefined,
        undefined,
        'or',
      );
    });

    it('passes no tagIds to service when no tags param provided', async () => {
      mockService.listByUser.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const req = makeReq({ query: {} });
      const res = makeRes();

      await controller.list(req, res);

      expect(mockService.listByUser).toHaveBeenCalledWith(
        'user-123',
        1,
        20,
        undefined,
        undefined,
        'or',
      );
    });

    it('returns 400 for invalid tagMode value', async () => {
      const req = makeReq({ query: { tagMode: 'invalid' } });
      const res = makeRes();

      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
      expect(mockService.listByUser).not.toHaveBeenCalled();
    });

    it('returns 200 with paginated data (regression)', async () => {
      const mockData = [{ id: '1', title: 'Test', tags: [] }];
      mockService.listByUser.mockResolvedValue({
        data: mockData as any,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const req = makeReq({ query: {} });
      const res = makeRes();

      await controller.list(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: mockData, total: 1 }),
      );
    });
  });

  describe('PUT /api/items/:id — tagIds handling', () => {
    it('passes tagIds to service when provided in request body', async () => {
      mockService.update.mockResolvedValue({
        id: 'item-1',
        title: 'Test',
        tags: [{ id: 'id1', name: 'Tag1', color: null }],
      } as any);

      const req = makeReq({
        params: { id: 'item-1' },
        body: { tagIds: ['id1'] },
      });
      const res = makeRes();

      await controller.update(req, res);

      expect(mockService.update).toHaveBeenCalledWith(
        'item-1',
        'user-123',
        expect.objectContaining({ tagIds: ['id1'] }),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 400 when tagIds exceeds max 5 items (Zod validation)', async () => {
      const req = makeReq({
        params: { id: 'item-1' },
        body: { tagIds: ['a', 'b', 'c', 'd', 'e', 'f'] }, // 6 items
      });
      const res = makeRes();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation failed' }),
      );
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it('returns 400 when service throws BadRequestError', async () => {
      mockService.update.mockRejectedValue(new BadRequestError('Invalid tag ID(s)'));

      const req = makeReq({
        params: { id: 'item-1' },
        body: { tagIds: ['invalid-id'] },
      });
      const res = makeRes();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid tag ID(s)' }),
      );
    });

    it('passes request without tagIds to service correctly (regression)', async () => {
      mockService.update.mockResolvedValue({
        id: 'item-1',
        title: 'Updated',
        tags: [],
      } as any);

      const req = makeReq({
        params: { id: 'item-1' },
        body: { title: 'Updated' },
      });
      const res = makeRes();

      await controller.update(req, res);

      expect(mockService.update).toHaveBeenCalledWith('item-1', 'user-123', { title: 'Updated' });
    });

    it('returns 201 on create (regression)', async () => {
      mockService.create.mockResolvedValue({
        id: 'item-new',
        title: 'New Item',
        tags: [],
      } as any);

      const req = makeReq({
        body: { title: 'New Item' },
      });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Item' }));
    });
  });
});
