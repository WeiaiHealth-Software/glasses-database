import type { ApiResponse, PaginationParams, PaginationResult } from '../types/common';

const DEFAULT_DELAY = 300;

async function delay<T>(data: T, ms = DEFAULT_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function ok<T>(data: T, message = 'success'): ApiResponse<T> {
  return { code: 0, message, data };
}

export function err<T>(message: string, code = 1): ApiResponse<T> {
  return { code, message, data: undefined as unknown as T };
}

export interface ListQuery extends PaginationParams {
  keyword?: string;
  [key: string]: unknown;
}

export function paginate<T>(list: T[], query: ListQuery): PaginationResult<T> {
  const { page = 1, pageSize = 10 } = query;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    list: list.slice(start, end),
    total: list.length,
    page,
    pageSize,
  };
}

export const request = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    void url;
    void params;
    return delay(ok({} as T));
  },
  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    void url;
    void body;
    return delay(ok({} as T));
  },
  async put<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    void url;
    void body;
    return delay(ok({} as T));
  },
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    void url;
    return delay(ok({} as T));
  },
};
