import { ok, paginate, type ListQuery } from './request';
import type { Lens } from '../types/lens';
import type { ApiResponse, PaginationResult } from '../types/common';
import { mockLensList } from '../mocks/lens.mock';
import { mockBrandList, mockTechTagList } from '../mocks/dictionary.mock';

const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));

export function nameOfBrand(id: string): string {
  return mockBrandList.find((b) => b.id === id)?.name ?? '-';
}
export function nameOfTech(id: string): string {
  return mockTechTagList.find((t) => t.id === id)?.name ?? '-';
}

export const LensService = {
  async page(
    query: ListQuery = { page: 1, pageSize: 10 }
  ): Promise<ApiResponse<PaginationResult<Lens>>> {
    let list = mockLensList.filter((l) => !l.management.softDeleted);
    if (query.keyword) {
      const q = String(query.keyword).toLowerCase();
      list = list.filter((l) =>
        l.baseInfo.fullName.toLowerCase().includes(q) ||
        nameOfBrand(l.baseInfo.brandId).toLowerCase().includes(q) ||
        nameOfTech(l.baseInfo.techCategoryId).toLowerCase().includes(q) ||
        (l.baseInfo.series ?? '').toLowerCase().includes(q)
      );
    }
    if (typeof query.brandId === 'string' && query.brandId !== 'all') {
      list = list.filter((l) => l.baseInfo.brandId === query.brandId);
    }
    if (typeof query.techId === 'string' && query.techId !== 'all') {
      list = list.filter((l) => l.baseInfo.techCategoryId === query.techId);
    }
    if (typeof query.status === 'string' && query.status !== 'all') {
      list = list.filter((l) => l.management.status === query.status);
    }
    if (typeof query.recommended === 'boolean') {
      list = list.filter((l) => l.management.isHomepageRecommended === query.recommended);
    }
    list.sort((a, b) => b.management.sortWeight - a.management.sortWeight);
    return delay(ok(paginate(list, query)));
  },

  async get(id: string): Promise<ApiResponse<Lens>> {
    const item = mockLensList.find((l) => l.id === id);
    if (!item) return delay({ code: 1, message: '镜片不存在', data: undefined as unknown as Lens });
    return delay(ok(item));
  },

  async create(payload: Omit<Lens, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Lens>> {
    const lens: Lens = {
      ...payload,
      id: 'L' + Math.floor(100 + Math.random() * 900),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockLensList.unshift(lens);
    return delay(ok(lens));
  },

  async update(id: string, patch: Partial<Lens>): Promise<ApiResponse<Lens>> {
    const idx = mockLensList.findIndex((l) => l.id === id);
    if (idx === -1) return delay({ code: 1, message: '镜片不存在', data: undefined as unknown as Lens });
    const cur = mockLensList[idx];
    const next: Lens = {
      ...cur,
      ...patch,
      baseInfo: { ...cur.baseInfo, ...(patch.baseInfo ?? {}) },
      coreParams: { ...cur.coreParams, ...(patch.coreParams ?? {}) },
      supplyProfile: { ...cur.supplyProfile, ...(patch.supplyProfile ?? {}) },
      clinicalRules: { ...cur.clinicalRules, ...(patch.clinicalRules ?? {}) },
      management: { ...cur.management, ...(patch.management ?? {}), updatedAt: new Date().toISOString() },
    };
    mockLensList[idx] = next;
    return delay(ok(next));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = mockLensList.findIndex((l) => l.id === id);
    if (idx === -1) return delay({ code: 1, message: '镜片不存在', data: { affected: 0 } });
    mockLensList[idx].management.softDeleted = true;
    mockLensList[idx].management.status = 'offline';
    mockLensList[idx].management.updatedAt = new Date().toISOString();
    return delay(ok({ affected: 1 }));
  },

  async toggleStatus(id: string): Promise<ApiResponse<Lens>> {
    const item = mockLensList.find((l) => l.id === id);
    if (!item) return delay({ code: 1, message: '镜片不存在', data: undefined as unknown as Lens });
    item.management.status = item.management.status === 'online' ? 'offline' : 'online';
    item.management.updatedAt = new Date().toISOString();
    return delay(ok(item));
  },

  async toggleRecommended(id: string): Promise<ApiResponse<Lens>> {
    const item = mockLensList.find((l) => l.id === id);
    if (!item) return delay({ code: 1, message: '镜片不存在', data: undefined as unknown as Lens });
    item.management.isHomepageRecommended = !item.management.isHomepageRecommended;
    item.management.updatedAt = new Date().toISOString();
    return delay(ok(item));
  },
};
