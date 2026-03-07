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
