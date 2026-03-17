export interface CreateUserDto {
  email: string;
  name: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
}

export interface CreateItemDto {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface UpdateItemDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tagIds?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

// ─── Tag DTOs ────────────────────────────────────────────────────────────────

export interface TagDto {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
}

export interface TagWithUserDto extends TagDto {
  userId: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

/** Minimal tag shape embedded in item responses */
export interface ItemTagRef {
  id: string;
  name: string;
  color: string | null;
}

export interface TagFilterOptions {
  tags?: string[];        // tag IDs to filter by
  tagMode?: 'and' | 'or'; // default: 'or'
}

// ─── Error Classes ───────────────────────────────────────────────────────────

/** 400 Bad Request — for business rule violations (limits, invalid IDs) */
export class BadRequestError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
