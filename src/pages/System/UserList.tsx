import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, ShieldCheck, KeyRound, Ban, UserPlus, RefreshCw,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import type { AdminUser, AdminRole, AdminStatus } from '../../types/system';
import { ROLE_LABEL } from '../../types/system';
import { AdminUserService } from '../../services/system.service';
import type { ListQuery } from '../../services/request';

const ROLE_COLOR: Record<AdminRole, 'brand' | 'violet' | 'emerald' | 'slate'> = {
  super_admin: 'violet',
  admin: 'brand',
  editor: 'emerald',
  viewer: 'slate',
};

export default function UserListPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AdminStatus | 'all'>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<Partial<AdminUser> & { password?: string }>({
    username: '',
    displayName: '',
    role: 'editor',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<AdminUser | null>(null);
  const [pwdResult, setPwdResult] = useState<{ username: string; tempPassword: string } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [freezeOpen, setFreezeOpen] = useState(false);
  const [freezeTarget, setFreezeTarget] = useState<AdminUser | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  const ok = (m: string) => setToast({ type: 'success', msg: m });
  const err = (m: string) => setToast({ type: 'error', msg: m });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: ListQuery & { role?: AdminRole; status?: AdminStatus } = { page, pageSize, keyword };
      if (roleFilter !== 'all') query.role = roleFilter;
      if (statusFilter !== 'all') query.status = statusFilter;
      const res = await AdminUserService.page(query);
      if (res.code === 0) {
        setRows(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, roleFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const roleOptions = Object.entries(ROLE_LABEL).map(([v, label]) => ({ value: v, label }));

  const openAdd = () => {
    setEditing(null);
    setFormData({ username: '', displayName: '', role: 'editor' });
    setErrors({});
    setFormOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setFormData({ username: u.username, displayName: u.displayName, role: u.role });
    setErrors({});
    setFormOpen(true);
  };
  const submitForm = async () => {
    const e: Record<string, string> = {};
    if (!formData.username?.trim()) e.username = '请输入登录账号';
    else if (!/^[a-zA-Z0-9_]{3,32}$/.test(formData.username.trim())) {
      e.username = '账号需 3~32 位，字母数字下划线';
    }
    if (!formData.displayName?.trim()) e.displayName = '请输入显示名称';
    if (!formData.role) e.role = '请选择角色';
    if (!editing && !formData.password?.trim()) e.password = '新增账号时请填写初始密码';
    else if (!editing && formData.password && formData.password.length < 6) {
      e.password = '初始密码至少 6 位';
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await AdminUserService.update(editing.id, {
          displayName: formData.displayName!.trim(),
          role: formData.role as AdminRole,
        });
        if (res.code === 0) {
          ok(`已更新「${res.data.displayName}」`);
          setFormOpen(false);
          void load();
        } else err(res.message);
      } else {
        const res = await AdminUserService.create({
          username: formData.username!.trim(),
          displayName: formData.displayName!.trim(),
          role: formData.role as AdminRole,
          password: formData.password,
        });
        if (res.code === 0) {
          ok(`已新增管理员「${res.data.displayName}」`);
          setFormOpen(false);
          void load();
        } else err(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openResetPwd = (u: AdminUser) => {
    setPwdTarget(u);
    setPwdResult(null);
    setPwdOpen(true);
    void (async () => {
      const res = await AdminUserService.resetPassword(u.id);
      if (res.code === 0) setPwdResult(res.data);
      else err(res.message);
    })();
  };

  const openFreeze = (u: AdminUser) => {
    setFreezeTarget(u);
    setFreezeOpen(true);
  };
  const submitFreeze = async () => {
    if (!freezeTarget) return;
    const res = await AdminUserService.toggleStatus(freezeTarget.id);
    if (res.code === 0) {
      ok(res.data.status === 'frozen' ? `已冻结「${res.data.displayName}」` : `已解冻「${res.data.displayName}」`);
      setFreezeOpen(false);
      setFreezeTarget(null);
      void load();
    } else err(res.message);
  };

  const openDelete = (u: AdminUser) => {
    setDeleteTarget(u);
    setDeleteOpen(true);
  };
  const submitDelete = async () => {
    if (!deleteTarget) return;
    const res = await AdminUserService.remove(deleteTarget.id);
    if (res.code === 0) {
      ok('已删除管理员账号');
      setDeleteOpen(false);
      setDeleteTarget(null);
      void load();
    } else err(res.message);
  };

  return (
    <div className="space-y-4">
      <SpecCard
        title="后台账号 · 管理规范"
        items={[
          '新增账号需填写初始密码（≥6位），首次登录后建议强制修改；重置密码将生成临时密码并在此弹窗直接展示。',
          '超级管理员不可删除、不可冻结；冻结账号立即登出且无法再次登录；离职账号优先冻结再按需删除。',
          '角色对应菜单权限在「权限管理」配置；账号级别冻结不会自动解除，请谨慎操作。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="w-64">
            <InputSearch
              placeholder="搜索账号 / 显示名"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => setPage(1)}
            />
          </div>
          <Select
            size="md"
            searchable
            placeholder="角色"
            wrapperClassName="w-36"
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v as AdminRole | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: '全部角色' },
              ...roleOptions,
            ]}
          />
          <Select
            size="md"
            placeholder="状态"
            wrapperClassName="w-32"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as AdminStatus | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'active', label: '已激活' },
              { value: 'frozen', label: '已冻结' },
            ]}
          />
          <ToolbarDivider />
          <Button variant="icon" onClick={() => void load()} title="刷新">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div>
          <Button variant="primary" leftIcon={<UserPlus className="w-4 h-4" />} onClick={openAdd}>
            新增管理员
          </Button>
        </div>
      </ToolbarCard>

      <Table<AdminUser>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        hoverable
        columns={[
          {
            key: 'username',
            title: '账号信息',
            render: (_v, u) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {u.displayName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm">
                    {u.displayName}
                    {u.role === 'super_admin' && (
                      <Tag color="amber" size="sm" className="ml-2">
                        <ShieldCheck className="w-3 h-3 mr-1" /> 内置
                      </Tag>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    账号：<span className="text-slate-600 font-mono">{u.username}</span>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            title: '角色',
            width: 140,
            render: (_v, u) => (
              <Tag color={ROLE_COLOR[u.role]} size="md">
                {ROLE_LABEL[u.role]}
              </Tag>
            ),
          },
          {
            key: 'status',
            title: '状态',
            width: 140,
            align: 'center',
            render: (_v, u) => (
              u.status === 'active' ? (
                <Tag color="emerald" size="sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                  已激活
                </Tag>
              ) : (
                <Tag color="red" size="sm">
                  <Ban className="w-3 h-3 mr-1" />
                  已冻结
                </Tag>
              )
            ),
          },
          {
            key: 'lastLoginAt',
            title: '最近登录',
            width: 170,
            render: (_v, u) => u.lastLoginAt ?? <span className="text-slate-400 text-xs">—</span>,
          },
          {
            key: 'createdAt',
            title: '创建时间',
            width: 170,
            render: (_v, u) => u.createdAt?.slice(0, 16).replace('T', ' ') ?? '—',
          },
          {
            key: 'actions',
            title: '操作',
            width: 280,
            align: 'right',
            render: (_v, u) => (
              <div className="flex items-center justify-end gap-1">
                <ActionEditBtn onClick={() => openEdit(u)} label="编辑" />
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                  onClick={() => openResetPwd(u)}
                >
                  重置密码
                </Button>
                {u.role !== 'super_admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={u.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    onClick={() => openFreeze(u)}
                  >
                    {u.status === 'active' ? '冻结' : '解冻'}
                  </Button>
                )}
                {u.role !== 'super_admin' && (
                  <ActionDeleteBtn onClick={() => openDelete(u)} />
                )}
              </div>
            ),
          },
        ]}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={(p, sz) => {
          setPage(p);
          setPageSize(sz);
        }}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `编辑管理员 · ${editing.displayName}` : '新增管理员账号'}
        description={editing ? '修改显示名称与角色，账号不可变更' : '分配初始登录账号与角色，首次登录建议修改密码'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setFormOpen(false)}>取消</Button>
            <Button
              variant="primary"
              loading={submitting}
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={submitForm}
            >
              {editing ? '保存修改' : '创建账号'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="登录账号"
            placeholder="3~32 位字母数字下划线，创建后不可修改"
            value={formData.username ?? ''}
            disabled={!!editing}
            error={errors.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            label="显示名称"
            placeholder="例如：张一鸣（运营）"
            value={formData.displayName ?? ''}
            error={errors.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          />
          <Select
            label="分配角色"
            searchable
            placeholder="请选择角色"
            error={errors.role}
            value={formData.role as AdminRole}
            onChange={(v) => setFormData({ ...formData, role: v as AdminRole })}
            options={roleOptions}
          />
          {!editing && (
            <Input
              type="password"
              label="初始密码"
              placeholder="至少 6 位，建议字母数字组合"
              value={formData.password ?? ''}
              error={errors.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}
          {editing && editing.username === 'super' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              当前为内置超级管理员，角色修改仅展示，不会实际生效。
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={pwdOpen}
        onClose={() => {
          setPwdOpen(false);
          setPwdTarget(null);
          setPwdResult(null);
        }}
        title={`重置密码 · ${pwdTarget?.displayName ?? ''}`}
        description="重置后将生成新的临时密码，请通过内部通道告知账号持有人。"
        type="info"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setPwdOpen(false);
                setPwdTarget(null);
                setPwdResult(null);
              }}
            >
              我知道了
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>账号</span>
            <span className="font-mono font-bold text-slate-800">{pwdTarget?.username}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>临时密码</span>
            {pwdResult ? (
              <span className="font-mono font-bold text-brand-700 bg-white rounded-lg px-3 py-1 border border-brand-200 tracking-wider">
                {pwdResult.tempPassword}
              </span>
            ) : (
              <span className="text-slate-400">生成中...</span>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={freezeOpen}
        type="warning"
        title={freezeTarget?.status === 'frozen' ? '确认解冻账号？' : '确认冻结账号？'}
        description={freezeTarget ? (
          <>
            将对管理员
            <span className="font-bold text-slate-700 mx-1">
              「{freezeTarget.displayName}（{freezeTarget.username}）」
            </span>
            执行{freezeTarget.status === 'frozen' ? '解冻，可重新登录后台' : '冻结操作，将立即登出并禁止后续登录'}。
          </>
        ) : (
          ''
        )}
        confirmText={freezeTarget?.status === 'frozen' ? '确认解冻' : '确认冻结'}
        loading={submitting}
        onClose={() => setFreezeOpen(false)}
        onConfirm={() => {
          setSubmitting(true);
          void submitFreeze().finally(() => setSubmitting(false));
        }}
      />

      <ConfirmModal
        open={deleteOpen}
        type="danger"
        title="确认删除管理员账号？"
        description={deleteTarget ? (
          <>
            将从后台移除
            <span className="font-bold text-slate-700 mx-1">
              「{deleteTarget.displayName}（{deleteTarget.username}）」
            </span>
            ，操作不可恢复（若为离职，建议先冻结再观察 7 天）。
          </>
        ) : (
          ''
        )}
        confirmText="确认删除"
        loading={submitting}
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setSubmitting(true);
          void submitDelete().finally(() => setSubmitting(false));
        }}
      />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-[2000] min-w-[200px] px-4 py-3 rounded-xl shadow-lg border text-sm font-bold animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
