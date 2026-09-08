import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { SpecCard, ToolbarCard } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Form';
import type { Brand } from '../../types/dictionary';
import { BrandService } from '../../services/dictionary.service';
import type { ListQuery } from '../../services/request';

export default function BrandListPage() {
  const [rows, setRows] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    fullName: '',
    sortWeight: 50,
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleteMsg, setDeleteMsg] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: ListQuery = { page, pageSize, keyword };
      if (enabledOnly) query.enabled = true;
      const res = await BrandService.page(query);
      if (res.code === 0) {
        setRows(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, enabledOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const ok = (m: string) => setToast({ type: 'success', msg: m });
  const err = (m: string) => setToast({ type: 'error', msg: m });

  const openAdd = () => {
    setEditing(null);
    setFormData({ name: '', fullName: '', sortWeight: 50, enabled: true });
    setErrors({});
    setFormOpen(true);
  };
  const openEdit = (b: Brand) => {
    setEditing(b);
    setFormData({ ...b });
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = '请输入品牌名称';
    if (formData.sortWeight != null && (formData.sortWeight < 0 || formData.sortWeight > 999)) {
      e.sortWeight = '排序权重应在 0 ~ 999 之间';
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await BrandService.update(editing.id, formData);
        if (res.code === 0) ok(`已更新「${res.data.name}」`);
        else err(res.message);
      } else {
        const res = await BrandService.create({
          name: formData.name!,
          fullName: formData.fullName,
          sortWeight: formData.sortWeight ?? 50,
          enabled: formData.enabled ?? true,
        });
        if (res.code === 0) ok(`已新增品牌「${res.data.name}」`);
        else err(res.message);
      }
      setFormOpen(false);
      void load();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (b: Brand) => {
    const res = await BrandService.toggleEnabled(b.id);
    if (res.code === 0) ok(`已${res.data.enabled ? '启用' : '禁用'}「${b.name}」`);
    else err(res.message);
    void load();
  };

  const adjustWeight = async (b: Brand, delta: number) => {
    const res = await BrandService.update(b.id, { sortWeight: Math.max(0, b.sortWeight + delta) });
    if (res.code === 0) ok(`已调整「${b.name}」排序权重`);
    void load();
  };

  const confirmDelete = async (b: Brand) => {
    const count = BrandService.relatedCount(b.id);
    if (count > 0) {
      setDeleteMsg(`品牌「${b.name}」下仍关联 ${count} 款镜片，需先解除关联才能删除。是否查看已关联镜片？`);
    } else {
      setDeleteMsg(`将永久删除品牌「${b.name}」，删除后不可恢复。确认继续？`);
    }
    setDeleteTarget(b);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    if (BrandService.relatedCount(deleteTarget.id) > 0) {
      err('该品牌下仍有关联镜片，请先在镜片库中解除关联后再删除。');
      setDeleteOpen(false);
      return;
    }
    const res = await BrandService.remove(deleteTarget.id);
    if (res.code === 0) ok(`已删除「${deleteTarget.name}」`);
    else err(res.message);
    setDeleteOpen(false);
    setDeleteTarget(null);
    void load();
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full relative">
      <SpecCard
        title="品牌管理 · 开发规范"
        items={[
          '品牌名称用于首页筛选、列表页和详情页展示，新增后会实时同步到镜片库的品牌下拉选项中。',
          '删除品牌必须校验是否有关联镜片，有关联则禁止删除，防止数据不一致。',
          '排序权重越高，在小程序筛选面板中越靠前展示；默认为 50，可实时调整。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-72">
            <InputSearch placeholder="搜索品牌名称/全称..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <Switch label="仅看启用中" checked={enabledOnly} onChange={setEnabledOnly} />
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          新增品牌
        </Button>
      </ToolbarCard>

      <div className="space-y-0">
        <Table<Brand>
          loading={loading}
          columns={[
            {
              key: 'name',
              title: '品牌信息',
              width: 280,
              render: (_v, r) => (
                <div>
                  <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                    {r.name}
                    {!r.enabled && <Tag color="slate" size="xs">已禁用</Tag>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{r.fullName || '（无全称）'}</div>
                </div>
              ),
            },
            {
              key: 'lensCount',
              title: '关联镜片数',
              render: (_v, r) => (
                <span className="font-bold text-slate-700">
                  {r.lensCount ?? 0} <span className="text-slate-400 font-normal text-xs ml-0.5">款</span>
                </span>
              ),
            },
            {
              key: 'sortWeight',
              title: '排序权重',
              render: (_v, r) => (
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-sm font-bold min-w-[48px] text-center">
                    {r.sortWeight}
                  </span>
                  <button
                    onClick={() => adjustWeight(r, 5)}
                    title="权重 +5"
                    className="w-7 h-7 rounded-md bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 flex items-center justify-center transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => adjustWeight(r, -5)}
                    title="权重 -5"
                    className="w-7 h-7 rounded-md bg-slate-50 hover:bg-amber-50 hover:text-amber-600 text-slate-400 flex items-center justify-center transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
            {
              key: 'status',
              title: '状态',
              render: (_v, r) =>
                r.enabled ? <Tag color="emerald">启用中</Tag> : <Tag color="slate">已禁用</Tag>,
            },
            {
              key: 'updatedAt',
              title: '最近更新',
              className: 'text-slate-500 text-xs',
              render: (_v, r) => r.updatedAt,
            },
            {
              key: 'actions',
              title: '操作',
              align: 'right',
              width: 240,
              render: (_v, r) => (
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <button
                    onClick={() => toggleEnabled(r)}
                    title={r.enabled ? '禁用' : '启用'}
                    className={`cursor-pointer w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                      r.enabled
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-slate-100 hover:text-slate-500'
                        : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {r.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <ActionEditBtn onClick={() => openEdit(r)} />
                  <ActionDeleteBtn onClick={() => confirmDelete(r)} />
                </div>
              ),
            },
          ]}
          dataSource={rows}
          rowKey="id"
          className="rounded-none border-t-0"
        />
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={(p, s) => { setPage(p); setPageSize(s); }}
          className="rounded-b-2xl border border-slate-100 border-t-0 shadow-sm"
        />
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `编辑品牌：${editing.name}` : '新增品牌'}
        size="md"
        hideFooter
      >
        <div className="px-6 py-5 space-y-4 -mx-6 -my-5">
          <Input
            label="品牌名称"
            required
            placeholder="例如：蔡司 / 豪雅"
            value={formData.name ?? ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="品牌全称"
            placeholder="例如：卡尔蔡司光学 Carl Zeiss Vision（可选）"
            value={formData.fullName ?? ''}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="排序权重"
              type="number"
              min={0}
              max={999}
              placeholder="默认 50，越高越靠前"
              value={formData.sortWeight ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortWeight: e.target.value ? Number(e.target.value) : 0,
                })
              }
              error={errors.sortWeight}
            />
            <div>
              <div className="block text-xs font-bold text-slate-700 mb-1.5">启用状态</div>
              <Switch
                label="开启后可被镜片关联和筛选"
                checked={!!formData.enabled}
                onChange={(v) => setFormData({ ...formData, enabled: v })}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 -mx-6 -mb-5 mt-5 rounded-b-3xl">
          <Button variant="default" onClick={() => setFormOpen(false)}>取消</Button>
          <Button variant="primary" loading={submitting} onClick={submit}>
            {editing ? '保存修改' : '确认新增'}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={doDelete}
        danger={BrandService.relatedCount(deleteTarget?.id ?? '') === 0}
        type={BrandService.relatedCount(deleteTarget?.id ?? '') > 0 ? 'warning' : 'danger'}
        title="删除品牌"
        description={deleteMsg}
        confirmText={BrandService.relatedCount(deleteTarget?.id ?? '') > 0 ? '我知道了' : '确认删除'}
        hideCancel={BrandService.relatedCount(deleteTarget?.id ?? '') > 0}
      />

      {toast && (
        <div
          className={`fixed bottom-8 right-8 z-[1200] px-5 py-3 rounded-xl shadow-xl border text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
