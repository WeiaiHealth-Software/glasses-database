import type { BaseEntity } from './common';

export type ContentCategory = 'expert_article' | 'paper_reference';

export const CONTENT_CATEGORY_LABEL: Record<ContentCategory, string> = {
  expert_article: '专家解说',
  paper_reference: '论文参考',
};

export type ContentTagType =
  | 'clinical_experience'
  | 'fitting_reference'
  | 'academic_literature'
  | 'data_traceability';

export const CONTENT_TAG_LABEL: Record<ContentTagType, string> = {
  clinical_experience: '临床经验',
  fitting_reference: '验配参考',
  academic_literature: '学术文献',
  data_traceability: '数据溯源',
};

export const CONTENT_TAG_DEFAULTS: Record<ContentCategory, ContentTagType[]> = {
  expert_article: ['clinical_experience', 'fitting_reference'],
  paper_reference: ['academic_literature', 'data_traceability'],
};

export interface ContentArticle extends BaseEntity {
  category: ContentCategory;
  title: string;
  summary: string;
  content: string;
  tags: ContentTagType[];
  coverImage?: string;
  source: string;
  relatedLensIds?: string[];
  sortWeight: number;
  isPinned: boolean;
  isHomeRecommended: boolean;
  enabled: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
