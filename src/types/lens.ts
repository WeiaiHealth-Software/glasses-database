import type { BaseEntity, StatusType } from './common';

export type LensSupplyType = 'stock' | 'custom';
export type TechCategory =
  | 'multifocal_defocus'
  | 'annular_cylinder'
  | 'honeycomb_lattice'
  | 'peripheral_defocus'
  | 'progressive'
  | 'bifocal_prism'
  | 'ok_lens'
  | 'defocus_soft';

export interface SourceDoc {
  name: string;
  type: 'whitepaper' | 'clinical' | 'link';
  url?: string;
}

export interface LensBaseInfo {
  fullName: string;
  brandId: string;
  series?: string;
  launchYear?: number;
  techCategoryId: string;
  techStructure?: string;
  material?: string;
  refractiveIndex?: string;
  standardCoating?: string;
  upgradeCoatings?: string[];
}

export interface LensCoreParams {
  myopiaControlRate?: string;
  myopiaControlSource?: string;
  defocusValue?: string;
  centerOpticDiameter?: number;
  defocusRingCount?: number;
  astigmatismMax?: number;
  recommendedAgeMin?: number;
  recommendedAgeMax?: number;
  myopiaRangeMin?: number;
  myopiaRangeMax?: number;
}

export interface LensSupplyProfile {
  type: LensSupplyType;
  standardLeadTime?: string;
  highAstigmatismSupport: boolean;
  highMyopiaSupport: boolean;
  fitCharacteristics?: string;
  absoluteContraindications?: string;
  cautionConditions?: string;
}

export interface LensClinicalRules {
  refractionPrinciple?: string;
  binocularVisionReq?: string;
  wearingDuration?: string;
  initialAdaptation?: string;
  processingTolerance?: string;
  reviewCycle?: string;
}

export interface LensManagement {
  suggestedRetailPrice?: number;
  priceNote?: string;
  sourceDocs: SourceDoc[];
  isHomepageRecommended: boolean;
  sortWeight: number;
  status: StatusType;
  softDeleted: boolean;
}

export interface Lens extends BaseEntity {
  baseInfo: LensBaseInfo;
  coreParams: LensCoreParams;
  supplyProfile: LensSupplyProfile;
  clinicalRules: LensClinicalRules;
  management: LensManagement;
}
