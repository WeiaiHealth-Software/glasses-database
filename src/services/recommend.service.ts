import { ok, err, type ListQuery } from './request';
import type { ApiResponse } from '../types/common';
import type { RecommendItem, RecommendSlot } from '../types/system';
import { RECOMMEND_MOCK } from '../mocks/recommend.mock';
import { mockLensList } from '../mocks/lens.mock';

const delay = <T>(data: T, ms = 220): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));

const items: RecommendItem[] = [...RECOMMEND_MOCK];

export const RecommendService = {
  async listBySlot(slot?: RecommendSlot): Promise<ApiResponse<Record<RecommendSlot, RecommendItem[]>>> {
    const bySlot: Record<RecommendSlot, RecommendItem[]> = {
      expert: [],
      hot: [],
    };
    for (const r of items) {
      if (!slot || r.slot === slot) {
        bySlot[r.slot].push(r);
      }
    }
    bySlot.expert.sort((a, b) => a.sortWeight - b.sortWeight);
    bySlot.hot.sort((a, b) => a.sortWeight - b.sortWeight);
    return delay(ok(bySlot));
  },

  async add(
    payload: Omit<RecommendItem, 'id' | 'createdAt' | 'updatedAt' | 'sortWeight'> & {
      sortWeight?: number;
    },
  ): Promise<ApiResponse<RecommendItem>> {
    const duplicate = items.find(
      (r) => r.slot === payload.slot && r.lensId === payload.lensId,
    );
    if (duplicate) return delay(err('该镜片已存在于当前推荐位，请勿重复添加'));
    const slotList = items.filter((r) => r.slot === payload.slot);
    const maxW = slotList.reduce((m, r) => Math.max(m, r.sortWeight), 0);
    const item: RecommendItem = {
      ...payload,
      id: 'rec_' + Date.now().toString(36),
      sortWeight: payload.sortWeight ?? maxW + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    return delay(ok(item));
  },

  async updateText(id: string, recommendText: string): Promise<ApiResponse<RecommendItem>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('推荐项不存在'));
    items[idx] = { ...items[idx], recommendText, updatedAt: new Date().toISOString() };
    return delay(ok(items[idx]));
  },

  async toggleEnabled(id: string): Promise<ApiResponse<RecommendItem>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('推荐项不存在'));
    items[idx] = {
      ...items[idx],
      enabled: !items[idx].enabled,
      updatedAt: new Date().toISOString(),
    };
    return delay(ok(items[idx]));
  },

  async move(id: string, direction: 'up' | 'down' | 'top'): Promise<ApiResponse<{ affected: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('推荐项不存在'));
    const slot = items[idx].slot;
    const siblings = items
      .map((r, i) => ({ r, i }))
      .filter((x) => x.r.slot === slot)
      .sort((a, b) => a.r.sortWeight - b.r.sortWeight);
    const pos = siblings.findIndex((x) => x.i === idx);
    if (pos === -1) return delay(err('推荐项不存在'));

    if (direction === 'top' && pos > 0) {
      const firstW = siblings[0].r.sortWeight;
      items[idx].sortWeight = firstW - 1;
    } else if (direction === 'up' && pos > 0) {
      const prev = siblings[pos - 1];
      const tmp = items[idx].sortWeight;
      items[idx].sortWeight = prev.r.sortWeight;
      items[prev.i].sortWeight = tmp;
    } else if (direction === 'down' && pos < siblings.length - 1) {
      const next = siblings[pos + 1];
      const tmp = items[idx].sortWeight;
      items[idx].sortWeight = next.r.sortWeight;
      items[next.i].sortWeight = tmp;
    } else {
      return delay(err('无法继续移动'));
    }
    items[idx].updatedAt = new Date().toISOString();
    return delay(ok({ affected: 1 }));
  },

  async replace(oldId: string, newLensId: string): Promise<ApiResponse<RecommendItem>> {
    const idx = items.findIndex((r) => r.id === oldId);
    if (idx === -1) return delay(err('原推荐项不存在'));
    const dup = items.find(
      (r) => r.slot === items[idx].slot && r.lensId === newLensId && r.id !== oldId,
    );
    if (dup) return delay(err('替换的镜片已存在于当前推荐位'));
    items[idx] = {
      ...items[idx],
      lensId: newLensId,
      recommendText: undefined,
      updatedAt: new Date().toISOString(),
    };
    return delay(ok(items[idx]));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('推荐项不存在'));
    items.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },

  async candidates(
    query: ListQuery & { excludeSlot?: RecommendSlot } = { page: 1, pageSize: 10 },
  ) {
    let list = mockLensList.filter((l) => !l.management.softDeleted && l.management.status === 'online');
    if (query.excludeSlot) {
      const usedLensIds = new Set(items.filter((r) => r.slot === query.excludeSlot).map((r) => r.lensId));
      list = list.filter((l) => !usedLensIds.has(l.id));
    }
    if (query.keyword) {
      const q = query.keyword.toLowerCase();
      list = list.filter(
        (l) =>
          l.baseInfo.fullName.toLowerCase().includes(q) ||
          l.baseInfo.series?.toLowerCase().includes(q),
      );
    }
    const { page = 1, pageSize = 10 } = query;
    const start = (page - 1) * pageSize;
    return delay(
      ok({
        list: list.slice(start, start + pageSize),
        total: list.length,
        page,
        pageSize,
      }),
    );
  },
};
