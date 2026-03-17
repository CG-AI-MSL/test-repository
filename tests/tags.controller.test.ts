import { TagsController } from '../src/controllers/tags.controller';
import { TagsService } from '../src/services/tags.service';
import { BadRequestError } from '../src/types';
import { NotFoundError, ConflictError } from '../src/services/users.service';

jest.mock('../src/services/tags.service');

function makeReq(overrides: any = {}): any {
  return {
    userId: 'user-123',
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

function makeRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('TagsController', () => {
  let mockService: jest.Mocked<TagsService>;
  let controller: TagsController;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = new TagsService(null as any) as jest.Mocked<TagsService>;
    controller = new TagsController(mockService);
  });

  // 1. GET /api/tags → list() called, returns 200 with array
  describe('list()', () => {
    it('calls tagsService.list with userId and returns 200 with array', async () => {
      const tags = [
        { id: 'tag-1', name: 'Work', color: '#FF5733', createdAt: new Date() },
      ];
      mockService.list.mockResolvedValue(tags as any);

      const req = makeReq();
      const res = makeRes();

      await controller.list(req, res);

      expect(mockService.list).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith(tags);
    });
  });

  // 2. POST /api/tags → create() called with valid body, returns 201
  describe('create()', () => {
    it('creates a tag with valid body and returns 201', async () => {
      const newTag = { id: 'tag-2', name: 'Personal', color: '#00FF00', userId: 'user-123', createdAt: new Date() };
      mockService.create.mockResolvedValue(newTag as any);

      const req = makeReq({ body: { name: 'Personal', color: '#00FF00' } });
      const res = makeRes();

      await controller.create(req, res);

      expect(mockService.create).toHaveBeenCalledWith('user-123', { name: 'Personal', color: '#00FF00' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newTag);
    });

    // 3. POST /api/tags with invalid name → Zod validation → returns 400
    it('returns 400 when name is empty (Zod validation failure)', async () => {
      const req = makeReq({ body: { name: '' } });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('returns 400 when name exceeds 30 characters', async () => {
      const req = makeReq({ body: { name: 'a'.repeat(31) } });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('returns 400 when color format is invalid', async () => {
      const req = makeReq({ body: { name: 'ValidName', color: 'not-a-color' } });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    // 4. POST /api/tags when BadRequestError → returns 400
    it('returns 400 when service throws BadRequestError', async () => {
      mockService.create.mockRejectedValue(new BadRequestError('Tag limit reached (max 50)'));

      const req = makeReq({ body: { name: 'ValidTag' } });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    // 5. POST /api/tags when ConflictError → returns 409
    it('returns 409 when service throws ConflictError', async () => {
      mockService.create.mockRejectedValue(new ConflictError('Tag name already exists'));

      const req = makeReq({ body: { name: 'DuplicateTag' } });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  // 6. PUT /api/tags/:id → update() called, returns 200
  describe('update()', () => {
    it('updates a tag and returns 200', async () => {
      const updated = { id: 'tag-1', name: 'Updated', color: '#123456', userId: 'user-123', createdAt: new Date() };
      mockService.update.mockResolvedValue(updated as any);

      const req = makeReq({ params: { id: 'tag-1' }, body: { name: 'Updated' } });
      const res = makeRes();

      await controller.update(req, res);

      expect(mockService.update).toHaveBeenCalledWith('tag-1', 'user-123', { name: 'Updated' });
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    // 7. PUT /api/tags/:id with NotFoundError → returns 404
    it('returns 404 when service throws NotFoundError', async () => {
      mockService.update.mockRejectedValue(new NotFoundError('Tag not found'));

      const req = makeReq({ params: { id: 'nonexistent' }, body: { name: 'Updated' } });
      const res = makeRes();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    // 8. PUT /api/tags/:id with ConflictError → returns 409
    it('returns 409 when service throws ConflictError', async () => {
      mockService.update.mockRejectedValue(new ConflictError('Tag name already exists'));

      const req = makeReq({ params: { id: 'tag-1' }, body: { name: 'ConflictingName' } });
      const res = makeRes();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('returns 400 when update body is empty (refine validation)', async () => {
      const req = makeReq({ params: { id: 'tag-1' }, body: {} });
      const res = makeRes();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockService.update).not.toHaveBeenCalled();
    });
  });

  // 9. DELETE /api/tags/:id → delete() called, returns 204
  describe('delete()', () => {
    it('deletes a tag and returns 204', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const req = makeReq({ params: { id: 'tag-1' } });
      const res = makeRes();

      await controller.delete(req, res);

      expect(mockService.delete).toHaveBeenCalledWith('tag-1', 'user-123');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    // 10. DELETE /api/tags/:id with NotFoundError → returns 404
    it('returns 404 when service throws NotFoundError', async () => {
      mockService.delete.mockRejectedValue(new NotFoundError('Tag not found'));

      const req = makeReq({ params: { id: 'nonexistent' } });
      const res = makeRes();

      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });
});
