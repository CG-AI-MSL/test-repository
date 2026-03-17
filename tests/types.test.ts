import {
  CreateUserDto,
  UpdateUserDto,
  CreateItemDto,
  UpdateItemDto,
  PaginationParams,
  PaginatedResult,
  ApiError,
  TagDto,
  TagWithUserDto,
  CreateTagDto,
  UpdateTagDto,
  TagFilterOptions,
  ItemTagRef,
  BadRequestError,
} from '../src/types/index';

describe('Tag DTOs — shape verification', () => {
  it('TagDto has required fields: id, name, color (string | null), createdAt', () => {
    const tag: TagDto = {
      id: 'tag-1',
      name: 'Work',
      color: '#ff0000',
      createdAt: new Date(),
    };
    expect(tag.id).toBe('tag-1');
    expect(tag.name).toBe('Work');
    expect(tag.color).toBe('#ff0000');
    expect(tag.createdAt).toBeInstanceOf(Date);
  });

  it('TagDto allows color to be null', () => {
    const tag: TagDto = {
      id: 'tag-2',
      name: 'Personal',
      color: null,
      createdAt: new Date(),
    };
    expect(tag.color).toBeNull();
  });

  it('TagWithUserDto extends TagDto with userId', () => {
    const tag: TagWithUserDto = {
      id: 'tag-3',
      name: 'Urgent',
      color: '#0000ff',
      createdAt: new Date(),
      userId: 'user-1',
    };
    expect(tag.userId).toBe('user-1');
    expect(tag.id).toBe('tag-3');
  });

  it('CreateTagDto has required name and optional color', () => {
    const dto1: CreateTagDto = { name: 'NewTag' };
    expect(dto1.name).toBe('NewTag');
    expect(dto1.color).toBeUndefined();

    const dto2: CreateTagDto = { name: 'ColoredTag', color: '#aabbcc' };
    expect(dto2.color).toBe('#aabbcc');
  });

  it('UpdateTagDto has all optional fields', () => {
    const dto: UpdateTagDto = {};
    expect(dto.name).toBeUndefined();
    expect(dto.color).toBeUndefined();

    const dto2: UpdateTagDto = { name: 'Renamed', color: '#123456' };
    expect(dto2.name).toBe('Renamed');
  });

  it('TagFilterOptions has optional tags array and tagMode', () => {
    const opts1: TagFilterOptions = {};
    expect(opts1.tags).toBeUndefined();
    expect(opts1.tagMode).toBeUndefined();

    const opts2: TagFilterOptions = { tags: ['t1', 't2'], tagMode: 'and' };
    expect(opts2.tags).toEqual(['t1', 't2']);
    expect(opts2.tagMode).toBe('and');

    const opts3: TagFilterOptions = { tagMode: 'or' };
    expect(opts3.tagMode).toBe('or');
  });

  it('ItemTagRef has id, name, color (string | null)', () => {
    const ref1: ItemTagRef = { id: 'tag-1', name: 'Work', color: '#ff0000' };
    expect(ref1.id).toBe('tag-1');

    const ref2: ItemTagRef = { id: 'tag-2', name: 'Personal', color: null };
    expect(ref2.color).toBeNull();
  });
});

describe('BadRequestError', () => {
  it('extends Error', () => {
    const err = new BadRequestError('invalid input');
    expect(err).toBeInstanceOf(Error);
  });

  it('has status === 400', () => {
    const err = new BadRequestError('bad request');
    expect(err.status).toBe(400);
  });

  it('status is readonly (value is 400)', () => {
    const err = new BadRequestError('test');
    // Verify the status is 400 and cannot be reassigned (readonly enforced at compile time)
    expect(err.status).toBe(400);
  });

  it('preserves the message', () => {
    const err = new BadRequestError('invalid tag count');
    expect(err.message).toBe('invalid tag count');
  });

  it('can be thrown and caught', () => {
    expect(() => {
      throw new BadRequestError('thrown error');
    }).toThrow('thrown error');
  });

  it('can be caught as BadRequestError instance', () => {
    try {
      throw new BadRequestError('caught error');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestError);
      expect((e as BadRequestError).status).toBe(400);
      expect((e as BadRequestError).message).toBe('caught error');
    }
  });

  it('has name set to BadRequestError', () => {
    const err = new BadRequestError('test');
    expect(err.name).toBe('BadRequestError');
  });
});

describe('Existing exports still work', () => {
  it('CreateUserDto is still exported', () => {
    const dto: CreateUserDto = { email: 'test@example.com', name: 'Test User' };
    expect(dto.email).toBe('test@example.com');
  });

  it('UpdateUserDto is still exported', () => {
    const dto: UpdateUserDto = { name: 'Updated' };
    expect(dto.name).toBe('Updated');
  });

  it('CreateItemDto is still exported', () => {
    const dto: CreateItemDto = { title: 'My Task' };
    expect(dto.title).toBe('My Task');
  });

  it('UpdateItemDto is still exported with optional tagIds', () => {
    const dto: UpdateItemDto = { completed: true, tagIds: ['tag-1', 'tag-2'] };
    expect(dto.completed).toBe(true);
    expect(dto.tagIds).toEqual(['tag-1', 'tag-2']);
  });

  it('PaginationParams is still exported', () => {
    const params: PaginationParams = { page: 1, limit: 20 };
    expect(params.page).toBe(1);
  });

  it('PaginatedResult is still exported', () => {
    const result: PaginatedResult<string> = {
      data: ['a', 'b'],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    expect(result.data).toHaveLength(2);
  });

  it('ApiError is still exported', () => {
    const err: ApiError = { status: 404, message: 'Not Found' };
    expect(err.status).toBe(404);
  });
});
