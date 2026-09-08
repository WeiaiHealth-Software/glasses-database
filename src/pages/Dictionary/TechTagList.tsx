import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { SpecCard, ToolbarCard } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { RadioGroup, Switch } from '../../components/ui/Form';
import { Select } from '../../components/ui/Select';
import type { TechTag } from '../../types/dictionary';
import { TechTagService } from '../../services/dictionary.service';
import type { ListQuery } from '../../services/request';

type TagCategory = TechTag['category'] | 'all';

const categoryLabelMap: Record<Exclude<TagCategory, 'all'>, { label: string; color: Parameters<typeof Tag>[0]['color'] }> = {
  tech_category: { label: '技术大类', color: 'brand' },
  tech_structure: { label: '技术结构', color: 'violet' },
  coating: { label: '膜层配置', color: 'emerald' },
  other: { label: '其他标签', color: 'slate' },
};

const categoryOptions = [
  { label: '全部类别', value: 'all' },
  { label: '技术大类', value: 'tech_category' },
  { label: '技术结构', value: 'tech_structure' },
  { label: '膜层配置', value: 'coating' },
  { label: '其他标签', value: 'other' },
];

export default function TechTagListPage() {
  const [rows, setRows] = useState<TechTag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<TagCategory>('all');
  const [enabledOnly, setEnabledOnly] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TechTag | null>(null);
  const [formData, setFormData] = useState<Partial<TechTag>>({
    name: '',
    category: 'tech_category',
    sortWeight: 50,
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TechTag | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: ListQuery = { page, pageSize, keyword };
      if (category !== 'all') query.category = category;
      const res = await TechTagService.page(query);
      if (res.code === 0) {
        setRows(
          enabledOnly
            ? res.data.list.filter((t) => t.enabled)
            : res.data.list
        );
        setTotal(enabledOnly ? rows.length : res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, category, enabledOnly]);

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
    setFormData({ name: '', category: 'tech_category', sortWeight: 50, enabled: true });
    setErrors({});
    setFormOpen(true);
  };
  const openEdit = (t: TechTag) => {
    setEditing(t);
    setFormData({ ...t });
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = '请输入标签名称';
    if (!formData.category) e.category = '请选择标签分类';
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await TechTagService.update(editing.id, formData);
        if (res.code === 0) ok(`已更新标签「${res.data.name}」`);
        else err(res.message);
      } else {
        const res = await TechTagService.create({
          name: formData.name!,
          category: formData.category as TechTag['category'],
          sortWeight: formData.sortWeight ?? 50,
          enabled: formData.enabled ?? true,
        });
        if (res.code === 0) ok(`已新增标签「${res.data.name}」`);
        else err(res.message);
      }
      setFormOpen(false);
      void load();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (t: TechTag) => {
    const res = await TechTagService.update(t.id, { enabled: !t.enabled });
    if (res.code === 0) ok(`已${!t.enabled ? '启用' : '禁用'}「${t.name}」`);
    else err(res.message);
    void load();
  };

  const confirmDelete = (t: TechTag) => {
    setDeleteTarget(t);
    setDeleteOpen(true);
  };
  const doDelete = async () => {
    if (!deleteTarget) return;
    const res = await TechTagService.remove(deleteTarget.id);
    if (res.code === 0) ok(`已删除「${deleteTarget.name}」`);
    else err(res.message);
    setDeleteOpen(false);
    setDeleteTarget(null);
    void load();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-full relative">
      <SpecCard
        title="技术标签管理 · 开发规范"
        items={[
          '标签分三大类：技术大类（8种）、技术结构、膜层配置，直接决定小程序端 6 大筛选维度的展示顺序。',
          '删除标签必须校验镜片关联数量，有关联则禁止删除。',
          '同一个分类下不允许出现重名标签，保存时应做唯一性校验（后续接入后端时补齐）。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-72">
            <InputSearch placeholder="搜索标签名称..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div>
            <RadioGroup
              variant="button"
              value={category}
              onChange={(v) => { setCategory(v as TagCategory); setPage(1); }}
              options={categoryOptions}
            />
          </div>
          <Switch label="仅看启用中" checked={enabledOnly} onChange={setEnabledOnly} />
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          新增标签
        </Button>
      </ToolbarCard>

      <div className="space-y-0">
        <Table<TechTag>
          loading={loading}
          columns={[
            {
              key: 'name',
              title: '标签名称',
              width: 240,
              render: (_v, r) => (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{r.name}</span>
                  {!r.enabled && <Tag color="slate" size="xs">已禁用</Tag>}
                </div>
              ),
            },
            {
              key: 'category',
              title: '所属分类',
              dataIndex: 'category',
              render: (v) => {
                const c = categoryLabelMap[v as TechTag['category']];
                return c ? <Tag color={c.color}>{c.label}</Tag> : <span className="text-slate-400">-</span>;
              },
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
                <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-sm font-bold inline-block min-w-[48px] text-center">
                  {r.sortWeight}
                </span>
              ),
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
              width: 200,
              render: (_v, r) => (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => toggleEnabled(r)}
                    className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      r.enabled
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {r.enabled ? '禁用' : '启用'}
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
        title={editing ? `编辑标签：${editing.name}` : '新增技术标签'}
        size="md"
        hideFooter
      >
        <div className="px-6 py-5 space-y-4 -mx-6 -my-5">
          <div>
            <div className="block text-xs font-bold text-slate-700 mb-2">标签分类 <span className="text-red-500">*</span></div>
            <RadioGroup
              variant="button"
              value={formData.category ?? 'tech_category'}
              onChange={(v) => setFormData({ ...formData, category: v as TechTag['category'] })}
              options={categoryOptions.filter((c) => c.value !== 'all').map((c) => ({ label: c.label, value: c.value }))}
            />
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>
          <Input
            label="标签名称"
            required
            placeholder="例如：多点离焦 / 蜂窝点阵 / 钻立方膜"
            value={formData.name ?? ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="排序权重"
              type="number"
              min={0}
              placeholder="默认 50，越高越靠前"
              value={formData.sortWeight ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortWeight: e.target.value ? Number(e.target.value) : 0,
                })
              }
            />
            <div>
              <div className="block text-xs font-bold text-slate-700 mb-1.5">启用状态</div>
              <Switch
                label="启用后可以被镜片关联"
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
        danger
        title="确认删除该标签？"
        description={
          deleteTarget ? (
            <span>
              删除「<span className="font-bold text-slate-700">{deleteTarget.name}</span>
              」若有关联镜片将无法删除；删除后小程序筛选面板中不再出现。
            </span>
          ) : undefined
        }
        confirmText="确认删除"
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
