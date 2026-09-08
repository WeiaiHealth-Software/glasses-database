import type { BaseEntity } from './common';

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';
export type AdminStatus = 'active' | 'frozen';
export type OperationAction = 'login' | 'create' | 'update' | 'delete' | 'export';

export interface AdminUser extends BaseEntity {
  username: string;
  displayName: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt?: string;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  editor: '内容编辑',
  viewer: '只读用户',
};

export interface RoleDefinition extends BaseEntity {
  code: AdminRole | string;
  name: string;
  description?: string;
  permissionKeys: string[];
  builtin?: boolean;
}

export const MENU_PERMISSIONS = [
  { key: 'menu:dashboard', group: '首页', label: '数据看板' },
  { key: 'menu:lens:view', group: '镜片库', label: '查看镜片' },
  { key: 'menu:lens:edit', group: '镜片库', label: '新增/编辑镜片' },
  { key: 'menu:lens:delete', group: '镜片库', label: '删除镜片' },
  { key: 'menu:dictionary:view', group: '字典管理', label: '查看字典' },
  { key: 'menu:dictionary:edit', group: '字典管理', label: '新增/编辑字典' },
  { key: 'menu:dictionary:delete', group: '字典管理', label: '删除字典' },
  { key: 'menu:recommend:view', group: '运营管理', label: '查看推荐位' },
  { key: 'menu:recommend:edit', group: '运营管理', label: '调整推荐位' },
  { key: 'menu:system:users', group: '系统设置', label: '用户管理' },
  { key: 'menu:system:permissions', group: '系统设置', label: '权限管理' },
  { key: 'menu:system:logs', group: '系统设置', label: '操作日志' },
] as const;

export interface OperationLog extends BaseEntity {
  operatorId: string;
  operatorName: string;
  action: OperationAction;
  module: string;
  targetId?: string;
  targetName?: string;
  detail?: string;
  ip?: string;
}

export const OPERATION_MODULES = [
  '镜片库',
  '品牌管理',
  '技术标签',
  '推荐位',
  '用户管理',
  '权限管理',
  '登录',
  '系统配置',
] as const;

export const ACTION_LABEL: Record<OperationAction, string> = {
  login: '登录',
  create: '新增',
  update: '修改',
  delete: '删除',
  export: '导出',
};

export type RecommendSlot = 'expert' | 'hot';

export const RECOMMEND_SLOT_LABEL: Record<RecommendSlot, string> = {
  expert: '专家解说',
  hot: '热门镜片',
};

export interface RecommendItem extends BaseEntity {
  slot: RecommendSlot;
  lensId: string;
  sortWeight: number;
  recommendText?: string;
  enabled: boolean;
  createdAt: string;
}
