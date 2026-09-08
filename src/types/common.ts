export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type StatusType = 'online' | 'offline';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
