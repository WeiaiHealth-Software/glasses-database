import { ok, paginate, type ListQuery } from './request';
import type { Brand, TechTag } from '../types/dictionary';
import type { ApiResponse, PaginationResult } from '../types/common';
import { mockBrandList, mockTechTagList } from '../mocks/dictionary.mock';
import { mockLensList } from '../mocks/lens.mock';

const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));

function filterByKeyword<T extends { name: string; fullName?: string }>(list: T[], kw?: string): T[] {
  if (!kw) return list;
  const q = kw.toLowerCase();
  return list.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      (item.fullName ?? '').toLowerCase().includes(q)
  );
}

export const BrandService = {
  async page(query: ListQuery = { page: 1, pageSize: 10 }): Promise<ApiResponse<PaginationResult<Brand>>> {
    let list = [...mockBrandList];
    if (query.keyword) list = filterByKeyword(list, query.keyword);
    if (typeof query.enabled === 'boolean') {
      list = list.filter((b) => b.enabled === query.enabled);
    }
    list.sort((a, b) => b.sortWeight - a.sortWeight);
    return delay(ok(paginate(list, query)));
  },

  async all(): Promise<ApiResponse<Brand[]>> {
    return delay(ok([...mockBrandList].sort((a, b) => b.sortWeight - a.sortWeight)));
  },

  async create(payload: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'lensCount'>): Promise<ApiResponse<Brand>> {
    const brand: Brand = {
      ...payload,
      id: 'b_' + Date.now().toString(36),
      lensCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBrandList.unshift(brand);
    return delay(ok(brand));
  },

  async update(id: string, payload: Partial<Brand>): Promise<ApiResponse<Brand>> {
    const idx = mockBrandList.findIndex((b) => b.id === id);
    if (idx === -1) return delay({ code: 1, message: '品牌不存在', data: undefined as unknown as Brand });
    const next = { ...mockBrandList[idx], ...payload, updatedAt: new Date().toISOString() };
    mockBrandList[idx] = next;
    return delay(ok(next));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = mockBrandList.findIndex((b) => b.id === id);
    if (idx === -1) return delay({ code: 1, message: '品牌不存在', data: { affected: 0 } });
    const relatedCount = mockLensList.filter((l) => l.baseInfo.brandId === id).length;
    if (relatedCount > 0) {
      return delay({
        code: 2,
        message: `该品牌下仍关联 ${relatedCount} 款镜片，请先转移或删除关联镜片后再删除品牌`,
        data: { affected: 0 },
      });
    }
    mockBrandList.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },

  async toggleEnabled(id: string): Promise<ApiResponse<Brand>> {
    const brand = mockBrandList.find((b) => b.id === id);
    if (!brand) return delay({ code: 1, message: '品牌不存在', data: undefined as unknown as Brand });
    brand.enabled = !brand.enabled;
    brand.updatedAt = new Date().toISOString();
    return delay(ok(brand));
  },

  relatedCount(id: string): number {
    return mockLensList.filter((l) => l.baseInfo.brandId === id).length;
  },
};

export const TechTagService = {
  async page(
    query: ListQuery = { page: 1, pageSize: 10 }
  ): Promise<ApiResponse<PaginationResult<TechTag>>> {
    let list = [...mockTechTagList];
    if (typeof query.category === 'string') {
      list = list.filter((t) => t.category === query.category);
    }
    if (query.keyword) {
      const q = String(query.keyword).toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => b.sortWeight - a.sortWeight);
    return delay(ok(paginate(list, query)));
  },

  async allByCategory(category?: TechTag['category']): Promise<ApiResponse<TechTag[]>> {
    let list = [...mockTechTagList];
    if (category) list = list.filter((t) => t.category === category);
    return delay(ok(list.sort((a, b) => b.sortWeight - a.sortWeight)));
  },

  async create(
    payload: Omit<TechTag, 'id' | 'createdAt' | 'updatedAt' | 'lensCount'>
  ): Promise<ApiResponse<TechTag>> {
    const tag: TechTag = {
      ...payload,
      id: 't_' + Date.now().toString(36),
      lensCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTechTagList.unshift(tag);
    return delay(ok(tag));
  },

  async update(id: string, payload: Partial<TechTag>): Promise<ApiResponse<TechTag>> {
    const idx = mockTechTagList.findIndex((t) => t.id === id);
    if (idx === -1) return delay({ code: 1, message: '标签不存在', data: undefined as unknown as TechTag });
    const next = { ...mockTechTagList[idx], ...payload, updatedAt: new Date().toISOString() };
    mockTechTagList[idx] = next;
    return delay(ok(next));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = mockTechTagList.findIndex((t) => t.id === id);
    if (idx === -1) return delay({ code: 1, message: '标签不存在', data: { affected: 0 } });
    const tag = mockTechTagList[idx];
    const related = mockLensList.filter(
      (l) => l.baseInfo.techCategoryId === id
    ).length;
    if (related > 0) {
      return delay({
        code: 2,
        message: `「${tag.name}」下仍关联 ${related} 款镜片，请先解除关联后删除`,
        data: { affected: 0 },
      });
    }
    mockTechTagList.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },
};
