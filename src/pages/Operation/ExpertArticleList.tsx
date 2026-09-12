import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, ArrowUp, ArrowDown, Pin, X, RefreshCw,
  MessageSquareText, Save,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Form';
import { Select } from '../../components/ui/Select';
import type { ContentTagType } from '../../types/content';
import {
  CONTENT_TAG_LABEL,
  CONTENT_TAG_DEFAULTS,
  CONTENT_CATEGORY_LABEL,
} from '../../types/content';
import { ContentService } from '../../services/content.service';
import { mockLensList } from '../../mocks/lens.mock';
import { nameOfBrand } from '../../services/lens.service';

const CATEGORY: 'expert_article' = 'expert_article';
const CATEGORY_LABEL = CONTENT_CATEGORY_LABEL[CATEGORY];
const TAG_OPTIONS = Object.entries(CONTENT_TAG_LABEL) as [ContentTagType, string][];

interface FormState {
  title: string;
  summary: string;
  content: string;
  tags: ContentTagType[];
  coverImage: string;
  source: string;
  relatedLensIds: string[];
  isPinned: boolean;
  enabled: boolean;
}

const emptyForm = (): FormState => ({
  title: '',
  summary: '',
  content: '',
  tags: [...CONTENT_TAG_DEFAULTS[CATEGORY]],
  coverImage: '',
  source: '',
  relatedLensIds: [],
  isPinned: false,
  enabled: true,
});

export default function ExpertArticleListPage() {
  const [list, setList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [kw, setKw] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const [pickOpen, setPickOpen] = useState(false);
  const [pickKw, setPickKw] = useState('');
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<any | null>(null);

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
      const res = await ContentService.list(CATEGORY, { includeDisabled: true });
      if (res.code === 0) setList(res.data as any[]);
      else err(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredList = list.filter((r: any) => {
    if (statusFilter === 'enabled' && !r.enabled) return false;
    if (statusFilter === 'disabled' && r.enabled) return false;
    if (kw.trim()) {
      const q = kw.trim().toLowerCase();
      if (
        !r.title.toLowerCase().includes(q) &&
        !r.summary.toLowerCase().includes(q) &&
        !r.source.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      tags: [...item.tags],
      coverImage: item.coverImage ?? '',
      source: item.source,
      relatedLensIds: [...(item.relatedLensIds ?? [])],
      isPinned: item.isPinned,
      enabled: item.enabled,
    });
    setModalOpen(true);
  };

  const validate = (): string | null => {
    if (form.title.trim().length === 0) return '请填写标题';
    if (form.title.trim().length > 60) return '标题不得超过 60 字';
    if (form.summary.trim().length === 0) return '请填写摘要';
    if (form.summary.trim().length > 100) return '摘要不得超过 100 字';
    if (form.content.trim().length === 0) return '请填写正文';
    if (form.tags.length === 0) return '请至少选择一个标签';
    if (form.source.trim().length === 0) return '请填写来源';
    if (form.source.trim().length > 40) return '来源不得超过 40 字';
    if ((form.relatedLensIds?.length ?? 0) > 5) return '关联镜片最多 5 个';
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) { err(v); return; }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await ContentService.update(editing.id, {
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          tags: form.tags,
          coverImage: form.coverImage.trim() || undefined,
          source: form.source.trim(),
          relatedLensIds: form.relatedLensIds,
          isPinned: form.isPinned,
          enabled: form.enabled,
        });
        if (res.code === 0) {
          ok('已更新');
          setModalOpen(false);
          void load();
        } else err(res.message);
      } else {
        const res = await ContentService.create({
          category: CATEGORY,
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          tags: form.tags,
          coverImage: form.coverImage.trim() || undefined,
          source: form.source.trim(),
          relatedLensIds: form.relatedLensIds,
          isPinned: form.isPinned,
          enabled: form.enabled,
        });
        if (res.code === 0) {
          ok('已新增');
          setModalOpen(false);
          void load();
        } else err(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (item: any) => {
    const res = await ContentService.toggleEnabled(item.id);
    if (res.code === 0) {
      ok(res.data.enabled ? '已启用展示' : '已暂停展示');
      void load();
    } else err(res.message);
  };
  const togglePinned = async (item: any) => {
    const res = await ContentService.togglePinned(item.id);
    if (res.code === 0) {
      ok(res.data.isPinned ? '已置顶' : '已取消置顶');
      void load();
    } else err(res.message);
  };
  const move = async (item: any, dir: 'up' | 'down' | 'top') => {
    const res = await ContentService.move(item.id, dir);
    if (res.code === 0) void load();
    else err(res.message);
  };

  const openRemove = (item: any) => {
    setRemoveTarget(item);
    setRemoveOpen(true);
  };
  const submitRemove = async () => {
    if (!removeTarget) return;
    const res = await ContentService.remove(removeTarget.id);
    if (res.code === 0) {
      ok('已删除');
      setRemoveOpen(false);
      setRemoveTarget(null);
      void load();
    } else err(res.message);
  };

  const openPickLens = () => {
    setPickedIds([...form.relatedLensIds]);
    setPickKw('');
    setPickOpen(true);
  };
  const confirmPickLens = () => {
    setForm({ ...form, relatedLensIds: pickedIds });
    setPickOpen(false);
  };
  const toggleTag = (t: ContentTagType) => {
    setForm({
      ...form,
      tags: form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t],
    });
  };

  const lensById = (id: string) => mockLensList.find((l) => l.id === id);
  const pickCandidateList = mockLensList.filter((l) => !(l as any).management?.softDeleted).filter((l: any) => {
    if (!pickKw.trim()) return true;
    const q = pickKw.trim().toLowerCase();
    return (l.baseInfo.fullName as string).toLowerCase().includes(q)
      || nameOfBrand(l.baseInfo.brandId).toLowerCase().includes(q);
  });

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-full">
      <SpecCard
        title={`${CATEGORY_LABEL} · 操作规范`}
        items={[
          `「${CATEGORY_LABEL}」建议 3~6 条，置顶配合 sortWeight 排序；首页卡片置顶项优先展示。`,
          '暂停展示只会在 C 端隐藏，不会删除记录；删除操作不可逆，建议优先使用暂停。',
          '关联镜片最多 5 个，详情页底部展示"推荐相关镜片"。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <MessageSquareText className="w-4 h-4 text-brand-600" />
            当前板块：
            <Tag color="brand" size="sm">
              {CATEGORY_LABEL} · {filteredList.length}项
            </Tag>
          </div>
          <ToolbarDivider />
          <span className="text-xs text-slate-500">
            已启用展示：
            <span className="font-bold text-emerald-600 ml-1">
              {list.filter((r: any) => r.enabled).length}
            </span>
            {' / '}
            暂停：
            <span className="font-bold text-slate-500 ml-1">
              {list.filter((r: any) => !r.enabled).length}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="icon" onClick={() => void load()} title="刷新">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
            新增内容
          </Button>
        </div>
      </ToolbarCard>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="w-72 shrink-0">
          <InputSearch
            placeholder={`搜索${CATEGORY_LABEL}标题/摘要/来源`}
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            onSearch={load}
          />
        </div>
        <div className="w-40 shrink-0">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as any)}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '仅启用', value: 'enabled' },
              { label: '仅暂停', value: 'disabled' },
            ]}
          />
        </div>
        <div className="flex-1" />
        <Button variant="default" onClick={load}>筛选</Button>
      </div>

      <Table<any>
        size="sm"
        rowKey="id"
        dataSource={filteredList}
        loading={loading}
        columns={[
          {
            key: 'index',
            title: '#',
            width: 52,
            align: 'center',
            render: (_v, _r, i) => (
              <span className={`font-bold text-sm ${i === 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {i + 1}
              </span>
            ),
          },
          {
            key: 'title',
            title: '标题与摘要',
            width: 420,
            render: (_v, r) => (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {r.isPinned && (
                    <Tag color="amber" size="sm">
                      <Pin className="w-3 h-3 mr-1 inline" /> TOP
                    </Tag>
                  )}
                  {!r.enabled && <Tag color="slate" size="sm">暂停</Tag>}
                  <span className="font-bold text-slate-800 text-sm truncate inline-block max-w-[260px]">
                    {r.title}
                  </span>
                </div>
                <div className="text-xs text-slate-500 leading-5 line-clamp-2">
                  {r.summary}
                </div>
              </div>
            ),
          },
          {
            key: 'tags',
            title: '标签',
            width: 200,
            render: (_v, r) => (
              <div className="flex flex-wrap gap-1">
                {r.tags.map((t: ContentTagType) => (
                  <Tag key={t} color="brand" size="sm">
                    {CONTENT_TAG_LABEL[t]}
                  </Tag>
                ))}
              </div>
            ),
          },
          {
            key: 'source',
            title: '来源',
            width: 160,
            render: (_v, r) => (
              <span className="text-xs text-slate-600 truncate block max-w-[150px]" title={r.source}>
                {r.source}
              </span>
            ),
          },
          {
            key: 'pinned',
            title: '置顶',
            width: 72,
            align: 'center',
            render: (_v, r) => (
              <Switch checked={r.isPinned} onChange={() => togglePinned(r)} size="sm" />
            ),
          },
          {
            key: 'enabled',
            title: '状态',
            width: 72,
            align: 'center',
            render: (_v, r) => (
              <Switch checked={r.enabled} onChange={() => toggleEnabled(r)} size="sm" />
            ),
          },
          {
            key: 'updatedAt',
            title: '更新时间',
            width: 150,
            render: (_v, r) => (
              <span className="text-xs text-slate-500">
                {(r.updatedAt ?? '').slice(0, 16).replace('T', ' ')}
              </span>
            ),
          },
          {
            key: 'actions',
            title: '操作',
            width: 260,
            render: (_v, r, i) => {
              const first = i === 0;
              const last = i === filteredList.length - 1;
              return (
                <div className="flex flex-wrap items-center gap-1">
                  <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5">
                    <Button variant="ghost" size="sm" onClick={() => move(r, 'top')} disabled={first}>
                      <Pin className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(r, 'up')} disabled={first}>
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(r, 'down')} disabled={last}>
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <ActionEditBtn onClick={() => openEdit(r)} />
                  <ActionDeleteBtn onClick={() => openRemove(r)} />
                </div>
              );
            },
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="xl"
        title={editing ? `编辑${CATEGORY_LABEL} · ${editing.title}` : `新增${CATEGORY_LABEL}`}
        description="表单中标题、摘要、正文、标签、来源为必填项"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setModalOpen(false)}>取消</Button>
            <Button variant="primary" loading={submitting} leftIcon={<Save className="w-4 h-4" />} onClick={() => { void submit(); }}>
              {editing ? '保存修改' : '确认新增'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                分类
                <Tag color="brand" size="sm" className="ml-2">{CATEGORY_LABEL}</Tag>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                标题 * <span className="text-slate-400 font-normal">({form.title.length}/60)</span>
              </div>
              <Input
                placeholder="不超过 60 字，如：近视防控镜片验配四要点"
                value={form.title}
                maxLength={60}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                摘要 * <span className="text-slate-400 font-normal">({form.summary.length}/100)</span>
              </div>
              <Textarea
                rows={2}
                placeholder="首页卡片展示的摘要，100 字内，突出核心观点"
                value={form.summary}
                maxLength={100}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">标签 *</div>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(([val, label]) => {
                  const checked = form.tags.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleTag(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        checked
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">封面图 URL（可选）</div>
              <Input
                placeholder="https://..."
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                来源 * <span className="text-slate-400 font-normal">({form.source.length}/40)</span>
              </div>
              <Input
                placeholder="如：某三甲医院视光中心·张主任"
                value={form.source}
                maxLength={40}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                关联镜片 <span className="text-slate-400 font-normal">（最多 5 个，可选）</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {form.relatedLensIds.length === 0 ? (
                  <div className="text-xs text-slate-400">尚未关联镜片</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {form.relatedLensIds.map((id) => {
                      const lens = lensById(id);
                      return (
                        <div key={id} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                            {(lens as any)?.baseInfo?.fullName ?? '（镜片已删除）'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              relatedLensIds: form.relatedLensIds.filter((x) => x !== id),
                            })}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <Button
                    variant="default"
                    size="sm"
                    leftIcon={<Plus className="w-3 h-3" />}
                    onClick={openPickLens}
                  >
                    选择镜片
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.isPinned} onChange={(v: any) => setForm({ ...form, isPinned: v })} size="sm" />
                <span className="text-xs font-bold text-slate-600">置顶展示</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.enabled} onChange={(v: any) => setForm({ ...form, enabled: v })} size="sm" />
                <span className="text-xs font-bold text-slate-600">立即启用</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>正文 * (Markdown)</span>
                <span className="text-slate-400 font-normal">
                  支持 # / ## / **粗体** / - 列表 / &gt; 引用 / 表格
                </span>
              </div>
              <Textarea
                rows={14}
                placeholder="# 标题\n\n正文段落...\n\n- 要点一\n- 要点二"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        size="lg"
        title={`选择关联镜片（${pickedIds.length}/5）`}
        description="多选，最多 5 个；已在详情页展示相关推荐"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <div className="text-xs text-slate-500 mr-auto">已选 {pickedIds.length} 个</div>
            <Button variant="default" onClick={() => setPickOpen(false)}>取消</Button>
            <Button variant="primary" onClick={confirmPickLens} leftIcon={<Save className="w-4 h-4" />}>
              确认选择
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <InputSearch
                placeholder="搜索镜片名/品牌"
                value={pickKw}
                onChange={(e) => setPickKw(e.target.value)}
              />
            </div>
          </div>
          <Table<any>
            size="sm"
            rowKey="id"
            dataSource={pickCandidateList.slice(0, 30)}
            columns={[
              {
                key: 'pick',
                title: '选择',
                width: 56,
                align: 'center',
                render: (_v, r) => {
                  const checked = pickedIds.includes(r.id);
                  const disabled = !checked && pickedIds.length >= 5;
                  return (
                    <input
                      type="checkbox"
                      className="accent-brand-600 w-4 h-4 cursor-pointer"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPickedIds((prev) => [...prev, r.id]);
                        } else {
                          setPickedIds((prev) => prev.filter((x) => x !== r.id));
                        }
                      }}
                    />
                  );
                },
              },
              {
                key: 'name',
                title: '镜片名称',
                render: (_v, r) => (
                  <div className="font-bold text-slate-800 truncate max-w-xs">{(r as any).baseInfo.fullName}</div>
                ),
              },
              {
                key: 'brand',
                title: '品牌',
                width: 120,
                render: (_v, r) => nameOfBrand((r as any).baseInfo.brandId),
              },
              {
                key: 'rate',
                title: '控制率',
                width: 100,
                align: 'right',
                render: (_v, r) => (r as any).coreParams?.myopiaControlRate ?? '—',
              },
            ]}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={removeOpen}
        type="danger"
        title="确认删除该内容？"
        description={removeTarget ? (
          <>
            将删除
            <span className="font-bold text-slate-700 mx-1">「{removeTarget.title}」</span>
            ，操作不可逆。建议使用"暂停展示"替代。
          </>
        ) : ''}
        confirmText="确认删除"
        cancelText="再想想"
        loading={submitting}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          setSubmitting(true);
          void submitRemove().finally(() => setSubmitting(false));
        }}
      />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-[2000] min-w-[200px] px-4 py-3 rounded-xl shadow-lg border text-sm font-bold ${
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
