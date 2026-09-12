import { ok, err } from './request';
import type { ApiResponse } from '../types/common';
import type { ContentArticle, ContentCategory } from '../types/content';
import { CONTENT_MOCK } from '../mocks/content.mock';

const delay = <T>(data: T, ms = 220): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));

const items: ContentArticle[] = [...CONTENT_MOCK];

const sortByCategory = (category: ContentCategory, list: ContentArticle[]): ContentArticle[] => {
  const arr = [...list];
  if (category === 'expert_article') {
    arr.sort((a, b) =>
      Number(b.isPinned) - Number(a.isPinned)
      || a.sortWeight - b.sortWeight
      || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    );
  } else {
    arr.sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      || a.sortWeight - b.sortWeight,
    );
  }
  return arr;
};

export const ContentService = {
  async list(
    category: ContentCategory,
    opts?: { includeDisabled?: boolean; keyword?: string }
  ): Promise<ApiResponse<ContentArticle[]>> {
    let list = items.filter((r) => r.category === category);
    if (!opts?.includeDisabled) list = list.filter((r) => r.enabled);
    if (opts?.keyword) {
      const kw = opts.keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(kw) ||
          r.source.toLowerCase().includes(kw) ||
          r.summary.toLowerCase().includes(kw),
      );
    }
    return delay(ok(sortByCategory(category, list)));
  },

  async listForHomepage(): Promise<
    ApiResponse<{ expert: ContentArticle[]; paper: ContentArticle[] }>
  > {
    const allExp = items.filter((r) => r.category === 'expert_article' && r.enabled);
    const allPap = items.filter((r) => r.category === 'paper_reference' && r.enabled);
    const expert = sortByCategory('expert_article', allExp).slice(0, 2);
    const paper = sortByCategory('paper_reference', allPap).slice(0, 2);
    return delay(ok({ expert, paper }));
  },

  async get(id: string): Promise<ApiResponse<ContentArticle>> {
    const r = items.find((x) => x.id === id);
    if (!r) return delay(err('内容不存在'));
    return delay(ok(r));
  },

  async create(
    payload: Omit<ContentArticle, 'id' | 'createdAt' | 'updatedAt' | 'sortWeight' | 'viewCount'> & {
      sortWeight?: number;
    }
  ): Promise<ApiResponse<ContentArticle>> {
    const siblings = items.filter((r) => r.category === payload.category);
    const maxW = siblings.reduce((m, r) => Math.max(m, r.sortWeight), 0);
    const item: ContentArticle = {
      ...payload,
      id: 'art_' + Date.now().toString(36),
      sortWeight: payload.sortWeight ?? maxW + 1,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    return delay(ok(item));
  },

  async update(
    id: string,
    payload: Partial<Omit<ContentArticle, 'id' | 'category' | 'createdAt'>>
  ): Promise<ApiResponse<ContentArticle>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items[idx] = { ...items[idx], ...payload, updatedAt: new Date().toISOString() };
    return delay(ok(items[idx]));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },

  async toggleEnabled(id: string): Promise<ApiResponse<ContentArticle>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items[idx] = { ...items[idx], enabled: !items[idx].enabled, updatedAt: new Date().toISOString() };
    return delay(ok(items[idx]));
  },

  async togglePinned(id: string): Promise<ApiResponse<ContentArticle>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    const category = items[idx].category;
    const siblings = items.filter((r) => r.category === category);
    let minW = siblings.reduce((m, r) => Math.min(m, r.sortWeight), 0);
    const newPinned = !items[idx].isPinned;
    if (newPinned) minW = minW - 1000;
    items[idx] = {
      ...items[idx],
      isPinned: newPinned,
      sortWeight: newPinned ? minW : items[idx].sortWeight,
      updatedAt: new Date().toISOString(),
    };
    return delay(ok(items[idx]));
  },

  async move(
    id: string,
    direction: 'up' | 'down' | 'top'
  ): Promise<ApiResponse<{ affected: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    const category = items[idx].category;
    const siblings = items
      .map((r, i) => ({ r, i }))
      .filter((x) => x.r.category === category);
    const sorted = [...siblings].sort((a, b) => a.r.sortWeight - b.r.sortWeight);
    const pos = sorted.findIndex((x) => x.i === idx);
    if (pos === -1) return delay(err('内容不存在'));

    if (direction === 'top' && pos > 0) {
      const firstW = sorted[0].r.sortWeight;
      items[idx].sortWeight = firstW - 1;
    } else if (direction === 'up' && pos > 0) {
      const prev = sorted[pos - 1];
      const tmp = items[idx].sortWeight;
      items[idx].sortWeight = prev.r.sortWeight;
      items[prev.i].sortWeight = tmp;
    } else if (direction === 'down' && pos < sorted.length - 1) {
      const next = sorted[pos + 1];
      const tmp = items[idx].sortWeight;
      items[idx].sortWeight = next.r.sortWeight;
      items[next.i].sortWeight = tmp;
    } else {
      return delay(err('无法继续移动'));
    }
    items[idx].updatedAt = new Date().toISOString();
    return delay(ok({ affected: 1 }));
  },

  async incView(id: string): Promise<ApiResponse<{ viewCount: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items[idx] = { ...items[idx], viewCount: items[idx].viewCount + 1 };
    return delay(ok({ viewCount: items[idx].viewCount }));
  },
};
