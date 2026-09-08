import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, ArrowUp, ArrowDown, Pin, Edit2, Trash2, X, RefreshCw,
  Star, Zap, Sparkles, Save,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Form';
import { Tabs, TabItem } from '../../components/ui/Tabs';
import type { RecommendItem, RecommendSlot } from '../../types/system';
import { RECOMMEND_SLOT_LABEL } from '../../types/system';
import type { Lens } from '../../types/lens';
import { RecommendService } from '../../services/recommend.service';
import { nameOfBrand, nameOfTech } from '../../services/lens.service';
import type { ListQuery } from '../../services/request';

export default function RecommendListPage() {
  const [slot, setSlot] = useState<RecommendSlot>('expert');
  const [lists, setLists] = useState<Record<RecommendSlot, RecommendItem[]>>({ expert: [], hot: [] });
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<RecommendItem | null>(null);
  const [candidates, setCandidates] = useState<Lens[]>([]);
  const [candPage, setCandPage] = useState(1);
  const [candSize, setCandSize] = useState(8);
  const [candTotal, setCandTotal] = useState(0);
  const [candKw, setCandKw] = useState('');
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editTextOpen, setEditTextOpen] = useState(false);
  const [editTextTarget, setEditTextTarget] = useState<RecommendItem | null>(null);
  const [editTextValue, setEditTextValue] = useState('');

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RecommendItem | null>(null);

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
      const res = await RecommendService.listBySlot();
      if (res.code === 0) setLists(res.data);
      else err(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentList = lists[slot];

  const loadCandidates = useCallback(async () => {
    const q: ListQuery & { excludeSlot?: RecommendSlot } = {
      page: candPage,
      pageSize: candSize,
      keyword: candKw || undefined,
      excludeSlot: replaceOpen ? replaceTarget?.slot : slot,
    };
    const res = await RecommendService.candidates(q);
    if (res.code === 0) {
      setCandidates(res.data.list);
      setCandTotal(res.data.total);
    }
  }, [candPage, candSize, candKw, replaceOpen, replaceTarget?.slot, slot]);

  const openAdd = () => {
    setSelectedLensId(null);
    setCandPage(1);
    setCandKw('');
    setAddOpen(true);
  };
  const openReplace = (item: RecommendItem) => {
    setReplaceTarget(item);
    setSelectedLensId(null);
    setCandPage(1);
    setCandKw('');
    setReplaceOpen(true);
  };
  useEffect(() => {
    if (addOpen || replaceOpen) void loadCandidates();
  }, [addOpen, replaceOpen, loadCandidates]);

  const submitAdd = async () => {
    if (!selectedLensId) {
      err('请先选择要加推的镜片');
      return;
    }
    setSubmitting(true);
    try {
      const res = await RecommendService.add({
        slot,
        lensId: selectedLensId,
        enabled: true,
      });
      if (res.code === 0) {
        ok(`已加入「${RECOMMEND_SLOT_LABEL[slot]}」`);
        setAddOpen(false);
        void load();
      } else err(res.message);
    } finally {
      setSubmitting(false);
    }
  };
  const submitReplace = async () => {
    if (!replaceTarget || !selectedLensId) {
      err('请选择替换镜片');
      return;
    }
    setSubmitting(true);
    try {
      const res = await RecommendService.replace(replaceTarget.id, selectedLensId);
      if (res.code === 0) {
        ok('已完成推荐位替换');
        setReplaceOpen(false);
        setReplaceTarget(null);
        void load();
      } else err(res.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (item: RecommendItem) => {
    const res = await RecommendService.toggleEnabled(item.id);
    if (res.code === 0) {
      ok(res.data.enabled ? '已启用展示' : '已暂停展示');
      void load();
    } else err(res.message);
  };

  const move = async (item: RecommendItem, dir: 'up' | 'down' | 'top') => {
    const res = await RecommendService.move(item.id, dir);
    if (res.code === 0) void load();
    else err(res.message);
  };

  const openEditText = (item: RecommendItem) => {
    setEditTextTarget(item);
    setEditTextValue(item.recommendText ?? '');
    setEditTextOpen(true);
  };
  const submitEditText = async () => {
    if (!editTextTarget) return;
    setSubmitting(true);
    try {
      const res = await RecommendService.updateText(editTextTarget.id, editTextValue.trim());
      if (res.code === 0) {
        ok('推荐语已更新');
        setEditTextOpen(false);
        void load();
      } else err(res.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openRemove = (item: RecommendItem) => {
    setRemoveTarget(item);
    setRemoveOpen(true);
  };
  const submitRemove = async () => {
    if (!removeTarget) return;
    const res = await RecommendService.remove(removeTarget.id);
    if (res.code === 0) {
      ok('已从推荐位移除');
      setRemoveOpen(false);
      setRemoveTarget(null);
      void load();
    } else err(res.message);
  };

  const SlotIcon = slot === 'expert' ? Sparkles : Zap;
  const slotBadgeColor = slot === 'expert' ? 'violet' : 'brand';

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
      <SpecCard
        title="首页推荐位 · 操作规范"
        items={[
          '「专家解说」建议 3~5 项，展示在首页最上部引流位；「热门镜片」建议 5~8 项，按点击热度+人工干预排序。',
          '支持置顶、上移、下移、替换镜片、修改推荐语；暂停展示只会在 C 端隐藏，不会移除记录。',
          '从推荐位移除 = 取消推荐，原镜片数据不受影响；同一块推荐位同一镜片不可重复加推。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <SlotIcon className="w-4 h-4 text-brand-600" />
            当前板块：
            <Tag color={slotBadgeColor as 'brand' | 'violet'} size="md">
              {RECOMMEND_SLOT_LABEL[slot]} · {currentList.length}项
            </Tag>
          </div>
          <ToolbarDivider />
          <span className="text-xs text-slate-500">
            已启用展示：
            <span className="font-bold text-emerald-600 ml-1">
              {currentList.filter((r) => r.enabled).length}
            </span>
            {' / '}
            暂停：
            <span className="font-bold text-slate-500 ml-1">
              {currentList.filter((r) => !r.enabled).length}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="icon" onClick={() => void load()} title="刷新">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
            加入推荐位
          </Button>
        </div>
      </ToolbarCard>

      <Tabs
        variant="primary"
        defaultValue="expert"
        value={slot}
        onChange={(v) => setSlot(v as RecommendSlot)}
      >
        {(['expert', 'hot'] as RecommendSlot[]).map((s) => (
          <TabItem
            key={s}
            label={
              <span className="inline-flex items-center gap-2">
                {s === 'expert' ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {RECOMMEND_SLOT_LABEL[s]}
              </span>
            }
            value={s}
            badge={
              <span className="text-xs opacity-80">
                {lists[s].length}
              </span>
            }
          >
            <div className="space-y-3">
              {currentList.length === 0 && !loading && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <div className="text-sm font-bold text-slate-700">暂无推荐内容</div>
                  <div className="text-xs text-slate-500 mt-1">点击右上角「加入推荐位」开始配置</div>
                </div>
              )}
              {currentList.map((item, idx) => {
                const first = idx === 0;
                const last = idx === currentList.length - 1;
                const brand = nameOfBrand(lensById(item.lensId)?.baseInfo.brandId ?? '');
                const tech = nameOfTech(lensById(item.lensId)?.baseInfo.techCategoryId ?? '');
                return (
                  <div
                    key={item.id}
                    className={`relative rounded-2xl border ${
                      item.enabled ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 opacity-80'
                    } shadow-sm p-4 pl-16 transition-all hover:shadow-md`}
                  >
                    <div className="absolute left-4 top-0 bottom-0 w-8 flex flex-col items-center justify-center">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        first ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {first && (
                            <Tag color="amber" size="sm">
                              <Pin className="w-3 h-3 mr-1" /> TOP
                            </Tag>
                          )}
                          {!item.enabled && <Tag color="slate" size="sm">暂停展示</Tag>}
                          <span className="text-sm font-bold text-slate-800 truncate">
                            {lensById(item.lensId)?.baseInfo.fullName ?? '（镜片已被删除）'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{brand}</span>
                          <span className="text-slate-300">·</span>
                          <span>{tech}</span>
                          <span className="text-slate-300">·</span>
                          <span>
                            更新 {item.updatedAt?.slice(0, 16).replace('T', ' ')}
                          </span>
                        </div>
                        {item.recommendText ? (
                          <div className="mt-2 text-xs text-slate-600 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2 leading-5">
                            {item.recommendText}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-400 italic">
                            （未填写推荐语，C 端将展示默认话术）
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => move(item, 'top')}
                            disabled={first}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => move(item, 'up')}
                            disabled={first}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => move(item, 'down')}
                            disabled={last}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Switch
                          checked={item.enabled}
                          onChange={() => toggleEnabled(item)}
                          size="sm"
                        />
                        <Button
                          variant="default"
                          size="sm"
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => openEditText(item)}
                        >
                          推荐语
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={() => openReplace(item)}
                        >
                          替换
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => openRemove(item)}
                        >
                          移除
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabItem>
        ))}
      </Tabs>

      <Modal
        open={addOpen || replaceOpen}
        onClose={() => {
          setAddOpen(false);
          setReplaceOpen(false);
          setReplaceTarget(null);
        }}
        title={addOpen ? '选择镜片加入推荐位' : `替换推荐位 · ${replaceTarget ? lensById(replaceTarget.lensId)?.baseInfo.fullName : ''}`}
        description={`目标板块：${RECOMMEND_SLOT_LABEL[replaceOpen ? replaceTarget?.slot ?? slot : slot]}（仅显示已上架且不在该板块的镜片）`}
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-slate-500">
              {selectedLensId ? (
                <span className="font-bold text-brand-600">
                  已选：{lensById(selectedLensId)?.baseInfo.fullName}
                </span>
              ) : (
                '请从下方列表勾选一个镜片'
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => {
                  setAddOpen(false);
                  setReplaceOpen(false);
                  setReplaceTarget(null);
                }}
              >
                取消
              </Button>
              <Button
                variant="primary"
                loading={submitting}
                onClick={addOpen ? submitAdd : submitReplace}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {addOpen ? '确认加推' : '确认替换'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <InputSearch
                placeholder="搜索镜片名 / 品牌 / 系列"
                value={candKw}
                onChange={(e) => setCandKw(e.target.value)}
                onSearch={() => {
                  setCandPage(1);
                  void loadCandidates();
                }}
              />
            </div>
            <Button
              variant="default"
              onClick={() => {
                setCandPage(1);
                void loadCandidates();
              }}
            >
              搜索
            </Button>
          </div>
          <Table<Lens>
            size="sm"
            rowKey="id"
            dataSource={candidates}
            columns={[
              {
                key: 'pick',
                title: '选择',
                width: 56,
                align: 'center',
                render: (_v, r) => (
                  <input
                    type="radio"
                    className="accent-brand-600 w-4 h-4 cursor-pointer"
                    checked={selectedLensId === r.id}
                    onChange={() => setSelectedLensId(r.id)}
                  />
                ),
              },
              {
                key: 'name',
                title: '镜片名称',
                dataIndex: 'baseInfo.fullName' as never,
                render: (_v, r) => (
                  <div className="font-bold text-slate-800 truncate max-w-xs">
                    {r.baseInfo.fullName}
                  </div>
                ),
              },
              {
                key: 'brand',
                title: '品牌',
                width: 120,
                render: (_v, r) => nameOfBrand(r.baseInfo.brandId),
              },
              {
                key: 'tech',
                title: '技术大类',
                width: 140,
                render: (_v, r) => (
                  <Tag color="brand" size="sm">
                    {nameOfTech(r.baseInfo.techCategoryId)}
                  </Tag>
                ),
              },
              {
                key: 'rate',
                title: '控制有效率',
                width: 120,
                align: 'right',
                render: (_v, r) => r.coreParams.myopiaControlRate ?? '—',
              },
            ]}
          />
          <Pagination
            page={candPage}
            pageSize={candSize}
            total={candTotal}
            onChange={(p, sz) => {
              setCandPage(p);
              setCandSize(sz);
            }}
          />
        </div>
      </Modal>

      <Modal
        open={editTextOpen}
        onClose={() => setEditTextOpen(false)}
        title="编辑推荐语"
        description={editTextTarget ? `镜片：${lensById(editTextTarget.lensId)?.baseInfo.fullName}` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setEditTextOpen(false)}>取消</Button>
            <Button
              variant="primary"
              loading={submitting}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={submitEditText}
            >
              保存
            </Button>
          </div>
        }
      >
        <Textarea
          rows={4}
          placeholder="推荐语将展示在 C 端卡片下方，建议 40 字以内、结合临床数据或适用人群"
          value={editTextValue}
          onChange={(e) => setEditTextValue(e.target.value)}
        />
        <div className="mt-2 text-xs text-slate-500 text-right">
          {editTextValue.length} 字（建议 15~40 字）
        </div>
      </Modal>

      <ConfirmModal
        open={removeOpen}
        type="danger"
        title="确认从推荐位移除？"
        description={removeTarget ? (
          <>
            将取消
            <span className="font-bold text-slate-700 mx-1">
              「{lensById(removeTarget.lensId)?.baseInfo.fullName}」
            </span>
            在「{RECOMMEND_SLOT_LABEL[removeTarget.slot]}」的展示状态，原镜片数据不受影响。
          </>
        ) : (
          ''
        )}
        confirmText="确认移除"
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

import { mockLensList } from '../../mocks/lens.mock';
function lensById(id: string): Lens | undefined {
  return mockLensList.find((l) => l.id === id);
}
