import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, ShieldPlus, Lock, Unlock, RefreshCw, Users2,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Checkbox } from '../../components/ui/Form';
import type { RoleDefinition } from '../../types/system';
import { MENU_PERMISSIONS } from '../../types/system';
import { RoleService } from '../../services/system.service';

type PermMap = Record<string, boolean>;

function permsToMap(keys: string[]): PermMap {
  const m: PermMap = {};
  for (const k of keys) m[k] = true;
  return m;
}
function mapToPerms(m: PermMap): string[] {
  return Object.entries(m).filter(([, v]) => v).map(([k]) => k);
}

const permGroups: { group: string; perms: typeof MENU_PERMISSIONS }[] =
  MENU_PERMISSIONS.reduce<{ group: string; perms: typeof MENU_PERMISSIONS }[]>((acc, p) => {
    const last = acc[acc.length - 1];
    if (last && last.group === p.group) last.perms.push(p);
    else acc.push({ group: p.group, perms: [p] });
    return acc;
  }, []);

export default function PermissionListPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [activeCode, setActiveCode] = useState<string>('admin');
  const [loading, setLoading] = useState(false);
  const [relatedCount, setRelatedCount] = useState<Record<string, number>>({});

  const [activePerms, setActivePerms] = useState<PermMap>({});
  const [savingPerms, setSavingPerms] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDefinition | null>(null);
  const [formData, setFormData] = useState<{
    code: string; name: string; description: string; permissionKeys: string[];
  }>({ code: '', name: '', description: '', permissionKeys: [] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleDefinition | null>(null);
  const [deleteWarn, setDeleteWarn] = useState('');

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
      const res = await RoleService.list();
      if (res.code === 0) {
        setRoles(res.data);
        if (res.data.length > 0 && !res.data.find((r) => r.code === activeCode)) {
          setActiveCode(res.data[0].code);
        }
        const counts: Record<string, number> = {};
        for (const r of res.data) {
          const cr = await RoleService.relatedAdminCount(r.code);
          if (cr.code === 0) counts[r.code] = cr.data;
        }
        setRelatedCount(counts);
      }
    } finally {
      setLoading(false);
    }
  }, [activeCode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const active = roles.find((r) => r.code === activeCode);
    setActivePerms(permsToMap(active?.permissionKeys ?? []));
  }, [activeCode, roles]);

  const active = roles.find((r) => r.code === activeCode);

  const togglePerm = (key: string) => {
    if (active?.builtin) return;
    setActivePerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleGroup = (groupName: string, val: boolean) => {
    if (active?.builtin) return;
    const keys = MENU_PERMISSIONS.filter((p) => p.group === groupName).map((p) => p.key);
    setActivePerms((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = val;
      return next;
    });
  };
  const groupStats = (g: string): { total: number; checked: number } => {
    const list = MENU_PERMISSIONS.filter((p) => p.group === g);
    return {
      total: list.length,
      checked: list.filter((p) => activePerms[p.key]).length,
    };
  };

  const savePerms = async () => {
    if (!active || active.builtin) return;
    setSavingPerms(true);
    try {
      const res = await RoleService.updatePermissions(active.id, mapToPerms(activePerms));
      if (res.code === 0) {
        ok('权限配置已保存');
        void load();
      } else err(res.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormData({ code: '', name: '', description: '', permissionKeys: [] });
    setFormErrors({});
    setFormOpen(true);
  };
  const openEdit = (r: RoleDefinition) => {
    if (r.builtin) {
      err('内置角色仅可调整权限，不可修改名称/编码');
      return;
    }
    setEditing(r);
    setFormData({
      code: r.code,
      name: r.name,
      description: r.description ?? '',
      permissionKeys: [...r.permissionKeys],
    });
    setFormErrors({});
    setFormOpen(true);
  };
  const submitForm = async () => {
    const e: Record<string, string> = {};
    if (!formData.code.trim()) e.code = '请输入角色编码（英文）';
    else if (!/^[a-z_][a-z0-9_]{2,31}$/i.test(formData.code.trim())) {
      e.code = '3~32 位字母数字下划线，字母开头';
    }
    if (!formData.name.trim()) e.name = '请输入角色显示名称';
    if (Object.keys(e).length > 0) {
      setFormErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await RoleService.update(editing.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        if (res.code === 0) {
          ok(`已更新角色「${res.data.name}」`);
          setFormOpen(false);
          void load();
        } else err(res.message);
      } else {
        const res = await RoleService.create({
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          permissionKeys: [],
        });
        if (res.code === 0) {
          ok(`已新增角色「${res.data.name}」`);
          setFormOpen(false);
          setActiveCode(res.data.code);
          void load();
        } else err(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = async (r: RoleDefinition) => {
    setDeleteTarget(r);
    setDeleteWarn('');
    if (r.builtin) {
      setDeleteWarn('内置角色不可删除');
    } else {
      const cr = await RoleService.relatedAdminCount(r.code);
      if (cr.code === 0 && cr.data > 0) {
        setDeleteWarn(`该角色下仍有 ${cr.data} 个管理员账号，请先调整账号角色后再删除`);
      }
    }
    setDeleteOpen(true);
  };
  const submitDelete = async () => {
    if (!deleteTarget) return;
    const res = await RoleService.remove(deleteTarget.id);
    if (res.code === 0) {
      ok('角色已删除');
      setDeleteOpen(false);
      setDeleteTarget(null);
      void load();
    } else err(res.message);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
      <SpecCard
        title="权限角色 · 配置规范"
        items={[
          '4 个内置角色（超级管理员 / 管理员 / 内容编辑 / 只读用户）不可删除；编码唯一不可修改。',
          '权限矩阵按模块分组，勾选即代表可访问对应菜单；建议使用最小权限原则为账号分配角色。',
          '删除自定义角色前必须将其下的管理员账号调整到其他角色；角色变更后账号立即生效。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <ShieldPlus className="w-4 h-4 text-brand-600" />
          <span className="text-sm font-bold text-slate-800">
            角色列表 · {roles.length} 项
          </span>
          <ToolbarDivider />
          <span className="text-xs text-slate-500">
            已分配账号：
            <span className="font-bold text-brand-600 ml-1">
              {Object.values(relatedCount).reduce((a, b) => a + b, 0)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="icon" onClick={() => void load()} title="刷新">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
            新增角色
          </Button>
        </div>
      </ToolbarCard>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4 xl:col-span-3 space-y-2">
          {roles.map((r) => {
            const act = r.code === activeCode;
            const cnt = relatedCount[r.code] ?? 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveCode(r.code)}
                className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                  act
                    ? 'bg-brand-50 border-brand-200 shadow-sm ring-1 ring-brand-100'
                    : 'bg-white border-slate-100 hover:border-brand-100 hover:bg-brand-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${act ? 'text-brand-700' : 'text-slate-800'}`}>
                        {r.name}
                      </span>
                      {r.builtin && (
                        <Tag color="amber" size="sm">内置</Tag>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      {r.code}
                    </div>
                    {r.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {r.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Tag color="brand" size="sm" className="inline-flex items-center gap-1">
                      <Users2 className="w-3 h-3" />
                      {cnt}
                    </Tag>
                    <div className="text-[10px] text-slate-400">
                      权限 {r.permissionKeys.length}/{MENU_PERMISSIONS.length}
                    </div>
                  </div>
                </div>
                {!r.builtin && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(r);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void openDelete(r);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="col-span-12 md:col-span-8 xl:col-span-9">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    权限配置 · {active?.name ?? '—'}
                  </h3>
                  {active?.builtin && (
                    <Tag color="amber" size="sm">
                      <Lock className="w-3 h-3 mr-1" /> 内置
                    </Tag>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {active?.description ??
                    '从左侧选择一个角色后，配置其对应的菜单 / 操作权限（勾选即授权）'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500">
                  已勾选：
                  <span className="font-bold text-brand-600 ml-1">
                    {mapToPerms(activePerms).length} / {MENU_PERMISSIONS.length}
                  </span>
                </div>
                <Button
                  variant="primary"
                  loading={savingPerms}
                  disabled={active?.builtin}
                  leftIcon={<Unlock className="w-4 h-4" />}
                  onClick={savePerms}
                >
                  {active?.builtin ? '内置不可修改' : '保存权限配置'}
                </Button>
              </div>
            </div>
            <div className="p-5 space-y-6">
              {permGroups.map(({ group, perms }) => {
                const stats = groupStats(group);
                const allOn = stats.checked === stats.total;
                const noneOn = stats.checked === 0;
                const indeterminate = !allOn && !noneOn;
                return (
                  <div key={group}>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allOn}
                          indeterminate={indeterminate}
                          disabled={active?.builtin}
                          onChange={(v) => toggleGroup(group, v)}
                          label={
                            <span className="text-sm font-bold text-slate-800">
                              {group}
                            </span>
                          }
                        />
                        <Tag color={stats.checked > 0 ? 'brand' : 'slate'} size="sm">
                          {stats.checked}/{stats.total}
                        </Tag>
                      </div>
                      <div className="flex gap-1">
                        {!active?.builtin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleGroup(group, true)}
                            >
                              全选
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleGroup(group, false)}
                            >
                              清空
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                      {perms.map((p) => (
                        <label
                          key={p.key}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                            activePerms[p.key]
                              ? 'bg-brand-50 border-brand-200 text-brand-800'
                              : 'bg-white border-slate-100 text-slate-700 hover:border-brand-100 hover:bg-brand-50/30'
                          } ${active?.builtin ? 'opacity-90' : ''}`}
                        >
                          <Checkbox
                            checked={!!activePerms[p.key]}
                            disabled={active?.builtin}
                            onChange={() => togglePerm(p.key)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold">{p.label}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {p.key}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `编辑角色 · ${editing.name}` : '新增自定义角色'}
        description={
          editing
            ? '修改显示名称与描述（编码与内置角色不可调整）'
            : '创建后可在右侧为该角色配置具体的菜单 / 操作权限'
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setFormOpen(false)}>取消</Button>
            <Button variant="primary" loading={submitting} onClick={submitForm}>
              {editing ? '保存修改' : '创建角色'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="角色编码"
            placeholder="如：content_specialist，3~32 位字母数字下划线"
            value={formData.code}
            disabled={!!editing}
            error={formErrors.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <Input
            label="角色显示名称"
            placeholder="如：内容编辑（专题）"
            value={formData.name}
            error={formErrors.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Textarea
            label="角色描述"
            rows={3}
            placeholder="描述该角色的典型使用场景，例如：负责专题文章发布与推荐位运营"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        type={deleteWarn ? 'warning' : 'danger'}
        title="确认删除该角色？"
        description={
          deleteWarn ? (
            <div className="space-y-2">
              <div>{deleteWarn}</div>
              <div className="text-xs text-slate-500">
                当前仅为提示，不会执行删除，请先处理完毕后重试。
              </div>
            </div>
          ) : (
            deleteTarget ? (
              <>
                将删除自定义角色
                <span className="font-bold text-slate-700 mx-1">
                  「{deleteTarget.name}」
                </span>
                ，操作不可恢复；该角色下无账号，可安全删除。
              </>
            ) : (
              ''
            )
          )
        }
        confirmText={deleteWarn ? '我知道了' : '确认删除'}
        hideCancel={!!deleteWarn}
        danger={!deleteWarn}
        loading={submitting && !deleteWarn}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
          setDeleteWarn('');
        }}
        onConfirm={() => {
          if (deleteWarn) {
            setDeleteOpen(false);
            setDeleteTarget(null);
            setDeleteWarn('');
            return;
          }
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
