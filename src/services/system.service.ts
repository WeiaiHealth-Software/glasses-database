import { ok, err, paginate, type ListQuery } from './request';
import type { ApiResponse, PaginationResult } from '../types/common';
import type {
  AdminUser,
  AdminRole,
  AdminStatus,
  OperationLog,
  RoleDefinition,
} from '../types/system';
import { ADMIN_USERS_MOCK, ROLES_MOCK, OPERATION_LOGS_MOCK } from '../mocks/system.mock';

const delay = <T>(data: T, ms = 220): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));

const adminUsers: AdminUser[] = [...ADMIN_USERS_MOCK];
const roles: RoleDefinition[] = [...ROLES_MOCK];
const operationLogs: OperationLog[] = [...OPERATION_LOGS_MOCK];

export const AdminUserService = {
  async page(
    query: ListQuery & { role?: AdminRole; status?: AdminStatus } = { page: 1, pageSize: 10 },
  ): Promise<ApiResponse<PaginationResult<AdminUser>>> {
    let list = [...adminUsers];
    if (query.keyword) {
      const q = query.keyword.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q),
      );
    }
    if (query.role) list = list.filter((u) => u.role === query.role);
    if (query.status) list = list.filter((u) => u.status === query.status);
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return delay(ok(paginate(list, query)));
  },

  async create(
    payload: Pick<AdminUser, 'username' | 'displayName' | 'role'> & { password?: string },
  ): Promise<ApiResponse<AdminUser>> {
    if (adminUsers.some((u) => u.username === payload.username)) {
      return delay(err('用户名已存在，请更换后重试'));
    }
    const u: AdminUser = {
      id: 'u_' + Date.now().toString(36),
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    adminUsers.unshift(u);
    return delay(ok(u));
  },

  async update(id: string, payload: Partial<Pick<AdminUser, 'displayName' | 'role'>>): Promise<ApiResponse<AdminUser>> {
    const idx = adminUsers.findIndex((u) => u.id === id);
    if (idx === -1) return delay(err('管理员不存在'));
    const next = { ...adminUsers[idx], ...payload, updatedAt: new Date().toISOString() };
    adminUsers[idx] = next;
    return delay(ok(next));
  },

  async toggleStatus(id: string): Promise<ApiResponse<AdminUser>> {
    const idx = adminUsers.findIndex((u) => u.id === id);
    if (idx === -1) return delay(err('管理员不存在'));
    const next: AdminUser = {
      ...adminUsers[idx],
      status: adminUsers[idx].status === 'active' ? 'frozen' : 'active',
      updatedAt: new Date().toISOString(),
    };
    adminUsers[idx] = next;
    return delay(ok(next));
  },

  async resetPassword(id: string): Promise<ApiResponse<{ username: string; tempPassword: string }>> {
    const u = adminUsers.find((x) => x.id === id);
    if (!u) return delay(err('管理员不存在'));
    const tempPassword = 'Aa1!' + Math.random().toString(36).slice(2, 8);
    return delay(ok({ username: u.username, tempPassword }));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = adminUsers.findIndex((u) => u.id === id);
    if (idx === -1) return delay(err('管理员不存在'));
    const u = adminUsers[idx];
    if (u.role === 'super_admin') {
      return delay(err('超级管理员账号不可删除'));
    }
    adminUsers.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },
};

export const RoleService = {
  async list(): Promise<ApiResponse<RoleDefinition[]>> {
    return delay(ok([...roles]));
  },

  async create(
    payload: Pick<RoleDefinition, 'code' | 'name' | 'description' | 'permissionKeys'>,
  ): Promise<ApiResponse<RoleDefinition>> {
    if (roles.some((r) => r.code === payload.code)) {
      return delay(err('角色编码已存在'));
    }
    const item: RoleDefinition = {
      ...payload,
      id: 'r_' + Date.now().toString(36),
      builtin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    roles.push(item);
    return delay(ok(item));
  },

  async update(
    id: string,
    payload: Partial<Pick<RoleDefinition, 'name' | 'description' | 'permissionKeys'>>,
  ): Promise<ApiResponse<RoleDefinition>> {
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('角色不存在'));
    if (roles[idx].builtin) return delay(err('内置角色不可修改（权限除外）'));
    const next = { ...roles[idx], ...payload, updatedAt: new Date().toISOString() };
    roles[idx] = next;
    return delay(ok(next));
  },

  async updatePermissions(id: string, permissionKeys: string[]): Promise<ApiResponse<RoleDefinition>> {
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('角色不存在'));
    const next = { ...roles[idx], permissionKeys, updatedAt: new Date().toISOString() };
    roles[idx] = next;
    return delay(ok(next));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('角色不存在'));
    if (roles[idx].builtin) return delay(err('内置角色不可删除'));
    const usedBy = adminUsers.filter((u) => u.role === roles[idx].code).length;
    if (usedBy > 0) {
      return delay({
        code: 2,
        message: `该角色下仍有 ${usedBy} 个管理员账号，请先调整账号角色后再删除`,
        data: { affected: 0 },
      });
    }
    roles.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },

  async relatedAdminCount(code: string): Promise<ApiResponse<number>> {
    return delay(ok(adminUsers.filter((u) => u.role === code).length));
  },
};

export const OperationLogService = {
  async page(
    query: ListQuery & {
      module?: string;
      action?: OperationLog['action'];
      operatorId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = { page: 1, pageSize: 15 },
  ): Promise<ApiResponse<PaginationResult<OperationLog>>> {
    let list = [...operationLogs];
    if (query.module) list = list.filter((l) => l.module === query.module);
    if (query.action) list = list.filter((l) => l.action === query.action);
    if (query.operatorId) list = list.filter((l) => l.operatorId === query.operatorId);
    if (query.keyword) {
      const q = query.keyword.toLowerCase();
      list = list.filter(
        (l) =>
          l.operatorName.toLowerCase().includes(q) ||
          (l.targetName ?? '').toLowerCase().includes(q) ||
          (l.detail ?? '').toLowerCase().includes(q),
      );
    }
    if (query.dateFrom) {
      list = list.filter((l) => l.createdAt >= query.dateFrom);
    }
    if (query.dateTo) {
      list = list.filter((l) => l.createdAt <= query.dateTo + ' 23:59:59');
    }
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return delay(ok(paginate(list, query)));
  },
};
