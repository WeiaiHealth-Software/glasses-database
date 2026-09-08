import type { Lens } from '../types/lens';
import type { Brand, TechTag } from '../types/dictionary';
import type { AdminUser, OperationLog } from '../types/system';

export const mockLensList: Lens[] = [];

export const mockBrandList: Brand[] = [
  {
    id: 'b001',
    name: '蔡司',
    fullName: '卡尔蔡司光学 (Carl Zeiss)',
    sortWeight: 100,
    enabled: true,
    lensCount: 18,
    createdAt: '2026-01-01 00:00',
    updatedAt: '2026-09-01 10:00',
  },
  {
    id: 'b002',
    name: '豪雅',
    fullName: '豪雅光学 (HOYA)',
    sortWeight: 95,
    enabled: true,
    lensCount: 12,
    createdAt: '2026-01-01 00:00',
    updatedAt: '2026-09-01 10:00',
  },
  {
    id: 'b003',
    name: '依视路',
    fullName: '依视路陆逊梯卡 (EssilorLuxottica)',
    sortWeight: 90,
    enabled: true,
    lensCount: 15,
    createdAt: '2026-01-01 00:00',
    updatedAt: '2026-09-01 10:00',
  },
];

export const mockTechTagList: TechTag[] = [];

export const mockAdminUserList: AdminUser[] = [];

export const mockOperationLogList: OperationLog[] = [];
