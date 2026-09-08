import type { AdminUser, RoleDefinition, OperationLog } from '../types/system';

export const ADMIN_USERS_MOCK: AdminUser[] = [
  {
    id: 'u-001',
    username: 'super',
    displayName: '系统超级管理员',
    role: 'super_admin',
    status: 'active',
    lastLoginAt: '2026-09-05 21:14:08',
    createdAt: '2025-06-01 10:00:00',
    updatedAt: '2026-09-05 21:14:08',
  },
  {
    id: 'u-002',
    username: 'admin_yi',
    displayName: '张一鸣（运营）',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-09-06 09:31:52',
    createdAt: '2025-11-02 14:21:00',
    updatedAt: '2026-09-06 09:31:52',
  },
  {
    id: 'u-003',
    username: 'editor_wang',
    displayName: '王晓（内容编辑）',
    role: 'editor',
    status: 'active',
    lastLoginAt: '2026-09-04 17:02:11',
    createdAt: '2026-02-18 09:12:00',
    updatedAt: '2026-09-04 17:02:11',
  },
  {
    id: 'u-004',
    username: 'viewer_liu',
    displayName: '刘倩（审计只读）',
    role: 'viewer',
    status: 'active',
    lastLoginAt: '2026-08-30 11:22:00',
    createdAt: '2026-05-20 16:40:00',
    updatedAt: '2026-08-30 11:22:00',
  },
  {
    id: 'u-005',
    username: 'editor_chen',
    displayName: '陈思（已离职）',
    role: 'editor',
    status: 'frozen',
    lastLoginAt: '2026-07-10 18:00:21',
    createdAt: '2026-01-08 10:00:00',
    updatedAt: '2026-07-11 09:00:00',
  },
  {
    id: 'u-006',
    username: 'admin_zhao',
    displayName: '赵敏（数据）',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-09-06 08:44:09',
    createdAt: '2026-03-15 13:10:00',
    updatedAt: '2026-09-06 08:44:09',
  },
];

export const ROLES_MOCK: RoleDefinition[] = [
  {
    id: 'r-001',
    code: 'super_admin',
    name: '超级管理员',
    description: '系统内置，拥有所有权限，不可删除或修改',
    permissionKeys: [
      'menu:dashboard',
      'menu:lens:view', 'menu:lens:edit', 'menu:lens:delete',
      'menu:dictionary:view', 'menu:dictionary:edit', 'menu:dictionary:delete',
      'menu:recommend:view', 'menu:recommend:edit',
      'menu:system:users', 'menu:system:permissions', 'menu:system:logs',
    ],
    builtin: true,
    createdAt: '2025-06-01 10:00:00',
    updatedAt: '2025-06-01 10:00:00',
  },
  {
    id: 'r-002',
    code: 'admin',
    name: '管理员',
    description: '运营管理角色，可管理镜片/字典/推荐位',
    permissionKeys: [
      'menu:dashboard',
      'menu:lens:view', 'menu:lens:edit',
      'menu:dictionary:view', 'menu:dictionary:edit',
      'menu:recommend:view', 'menu:recommend:edit',
      'menu:system:logs',
    ],
    builtin: true,
    createdAt: '2025-06-01 10:00:00',
    updatedAt: '2026-08-10 14:20:00',
  },
  {
    id: 'r-003',
    code: 'editor',
    name: '内容编辑',
    description: '维护镜片数据与字典，不可删除、不可管理用户权限',
    permissionKeys: [
      'menu:dashboard',
      'menu:lens:view', 'menu:lens:edit',
      'menu:dictionary:view', 'menu:dictionary:edit',
      'menu:recommend:view',
    ],
    builtin: true,
    createdAt: '2025-06-01 10:00:00',
    updatedAt: '2026-07-18 11:00:00',
  },
  {
    id: 'r-004',
    code: 'viewer',
    name: '只读用户',
    description: '仅用于审计或查阅，所有数据只读不可修改',
    permissionKeys: [
      'menu:dashboard',
      'menu:lens:view',
      'menu:dictionary:view',
      'menu:recommend:view',
      'menu:system:logs',
    ],
    builtin: true,
    createdAt: '2025-06-01 10:00:00',
    updatedAt: '2025-06-01 10:00:00',
  },
];

const operatorSamples = [
  { operatorId: 'u-002', operatorName: '张一鸣（运营）' },
  { operatorId: 'u-001', operatorName: '系统超级管理员' },
  { operatorId: 'u-003', operatorName: '王晓（内容编辑）' },
  { operatorId: 'u-006', operatorName: '赵敏（数据）' },
];
const lensSamples = [
  { name: '依视路 星趣控® Air', id: 'L-ESSIL-ST' },
  { name: '蔡司 小乐圆® S', id: 'L-ZEISS-XLY' },
  { name: '豪雅 新乐学®', id: 'L-HOYA-NEW' },
  { name: '万新 轻松控Pro', id: 'L-WX-QSK' },
];
const brandSamples = [
  { name: '蔡司 Zeiss', id: 'B-ZEISS' },
  { name: '依视路 Essilor', id: 'B-ESSIL' },
];

type LogTemplate = {
  module: OperationLog['module'];
  action: OperationLog['action'];
  target?: { id: string; name: string };
  detail: string;
};

function buildLogs(): OperationLog[] {
  const templates: LogTemplate[] = [
    { module: '登录', action: 'login', detail: '后台登录成功' },
    { module: '镜片库', action: 'create', target: lensSamples[0], detail: '新增镜片：基础信息 + 核心参数 28 项字段' },
    { module: '镜片库', action: 'update', target: lensSamples[1], detail: '修改「近视控制有效率」从 58% 更新为 61%' },
    { module: '镜片库', action: 'update', target: lensSamples[1], detail: '切换状态：上架 → 下架' },
    { module: '品牌管理', action: 'create', target: brandSamples[0], detail: '新增品牌，排序权重=80' },
    { module: '品牌管理', action: 'update', target: brandSamples[1], detail: '修改品牌全称：EssilorLuxottica' },
    { module: '技术标签', action: 'create', target: { id: 'T-018', name: '钻立方® 铂金膜' }, detail: '新增膜层标签' },
    { module: '推荐位', action: 'update', target: lensSamples[2], detail: '加入「专家解说」推荐位，排序权重=5' },
    { module: '推荐位', action: 'update', target: lensSamples[3], detail: '上移 1 位（热门镜片板块）' },
    { module: '用户管理', action: 'create', target: { id: 'u-006', name: 'admin_zhao' }, detail: '创建管理员账号，角色=管理员' },
    { module: '用户管理', action: 'update', target: { id: 'u-005', name: 'editor_chen' }, detail: '冻结账号（离职）' },
    { module: '权限管理', action: 'update', target: { id: 'r-003', name: '内容编辑' }, detail: '移除「删除镜片」权限' },
    { module: '镜片库', action: 'delete', target: { id: 'L-TEST-001', name: '测试镜片（已废弃）' }, detail: '软删除错误录入' },
    { module: '系统配置', action: 'update', target: { id: 'cfg-disclaimer', name: '全局免责声明' }, detail: '更新免责声明 v1.2' },
    { module: '登录', action: 'login', detail: '后台登录成功，IP=10.12.8.21' },
  ];
  const days = [
    '2026-09-06', '2026-09-05', '2026-09-04', '2026-09-03', '2026-09-02',
    '2026-09-01', '2026-08-31', '2026-08-30', '2026-08-29',
  ];
  const times = ['08:31:02', '09:12:44', '10:05:11', '11:40:33', '13:22:08', '14:59:51', '16:18:40', '17:42:26', '19:10:09', '21:05:33'];
  const logs: OperationLog[] = [];
  let idx = 0;
  for (const day of days) {
    const countDay = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < countDay; i++) {
      const tpl = templates[idx % templates.length];
      const op = operatorSamples[idx % operatorSamples.length];
      const ip = `10.12.${(idx % 16) + 1}.${(idx % 200) + 2}`;
      logs.push({
        id: `log-${String(idx + 1).padStart(4, '0')}`,
        module: tpl.module,
        action: tpl.action,
        operatorId: op.operatorId,
        operatorName: op.operatorName,
        targetId: tpl.target?.id,
        targetName: tpl.target?.name,
        detail: tpl.detail,
        ip,
        createdAt: `${day} ${times[idx % times.length]}`,
        updatedAt: `${day} ${times[idx % times.length]}`,
      });
      idx += 1;
    }
  }
  return logs;
}

export const OPERATION_LOGS_MOCK: OperationLog[] = buildLogs();
