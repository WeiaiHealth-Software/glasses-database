import type { BaseEntity } from './common';

export interface Brand extends BaseEntity {
  name: string;
  fullName?: string;
  sortWeight: number;
  enabled: boolean;
  lensCount?: number;
}

export interface TechTag extends BaseEntity {
  name: string;
  category: 'tech_category' | 'tech_structure' | 'coating' | 'other';
  sortWeight: number;
  enabled: boolean;
  lensCount?: number;
}
