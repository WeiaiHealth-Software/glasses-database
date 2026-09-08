import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus, Search, Trash2, X, RotateCcw, RefreshCw, ArrowLeftRight, Scale, Star,
  Heart, ShieldCheck, Clock, Wallet, BookOpen, ChevronDown, ChevronRight, AlertTriangle,
  Award, CheckCircle,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Tabs, TabItem } from '../../components/ui/Tabs';
import { Checkbox } from '../../components/ui/Form';
import { Select } from '../../components/ui/Select';
import type { Lens, LensSupplyType } from '../../types/lens';
import { nameOfBrand, nameOfTech } from '../../services/lens.service';
import { LensService } from '../../services/lens.service';
import type { ListQuery } from '../../services/request';
import {
  buildDoctorSections,
  buildParentSections,
  formatRate,
  formatAge,
  formatBool,
} from '../../services/compare.service';

const PARENT_ICON: Record<string, typeof Heart> = {
  heart: Heart,
  shield: ShieldCheck,
  clock: Clock,
  wallet: Wallet,
  book: BookOpen,
};

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['L-ZEISS-XLY', 'L-ESSIL-ST']);
  const [rows, setRows] = useState<Lens[]>([]);
  const [candidates, setCandidates] = useState<Lens[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [supplyFilter, setSupplyFilter] = useState<LensSupplyType | 'all'>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<'doctor' | 'parent'>('doctor');

  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  const ok = (m: string) => setToast({ type: 'success', msg: m });
  const err = (m: string) => setToast({ type: 'error', msg: m });

  const loadSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      setRows([]);
      return;
    }
    const result = await Promise.all(selectedIds.map((id) => LensService.get(id)));
    setRows(result.filter((r) => r.code === 0).map((r) => (r as { code: 0; data: Lens }).data));
  }, [selectedIds]);

  useEffect(() => {
    void loadSelected();
  }, [loadSelected]);

  const loadCandidates = useCallback(async () => {
    const q: ListQuery & { supplyType?: LensSupplyType } = { page, pageSize, keyword };
    if (brandFilter !== 'all') q.brandId = brandFilter;
    if (supplyFilter !== 'all') q.supplyType = supplyFilter;
    const res = await LensService.page(q);
    if (res.code === 0) {
      const list = res.data.list.filter((l) => !l.management.softDeleted);
      setCandidates(list);
      setTotal(res.data.total);
    }
  }, [page, pageSize, keyword, brandFilter, supplyFilter]);

  useEffect(() => {
    if (pickerOpen) void loadCandidates();
  }, [pickerOpen, loadCandidates]);

  const brandOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const l of candidates) {
      const id = l.baseInfo.brandId;
      if (!set.has(id)) set.set(id, nameOfBrand(id));
    }
    return [
      { value: 'all', label: '全部品牌' },
      ...Array.from(set.entries()).map(([v, label]) => ({ value: v, label })),
    ];
  }, [candidates]);

  const togglePick = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        err('最多同时对比 4 款镜片，请先移除已选');
        return prev;
      }
      ok(`已加入：${rows.find((l) => l.id === id)?.baseInfo.fullName ?? candidates.find((l) => l.id === id)?.baseInfo.fullName ?? ''}`);
      return [...prev, id];
    });
  };

  const removeOne = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const addFromPicker = () => {
    if (selectedIds.length < 2) {
      err('至少保留 2 款镜片才能进行对比');
      return;
    }
    setPickerOpen(false);
    void loadSelected();
  };

  const doctorSections = useMemo(() => buildDoctorSections(rows), [rows]);
  const parentSections = useMemo(() => buildParentSections(rows), [rows]);

  const summary = useMemo(() => {
    if (rows.length < 2) return null;
    const maxRate = Math.max(
      ...rows.map((l) => Number(l.coreParams.myopiaControlRate) || 0),
    );
    const minPrice = Math.min(
      ...rows.map((l) => l.management.suggestedRetailPrice ?? Infinity),
    );
    const widestAge = rows.reduce(
      (best, l, idx) => {
        const s = (l.coreParams.recommendedAgeMax ?? 0) - (l.coreParams.recommendedAgeMin ?? 999);
        return s > best.s ? { idx, s } : best;
      },
      { idx: -1, s: -Infinity },
    );
    return {
      rateIdx: rows.findIndex(
        (l) => Number(l.coreParams.myopiaControlRate) === maxRate && maxRate > 0,
      ),
      priceIdx: rows.findIndex((l) => l.management.suggestedRetailPrice === minPrice && isFinite(minPrice)),
      ageIdx: widestAge.idx,
    };
  }, [rows]);

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
      <SpecCard
        title="镜片横向对比工具 · 使用规范"
        items={[
          '支持 2–4 款镜片同屏对比，超过 4 款请先移除已选；少于 2 款时请先从「加入对比」添加。',
          '专业版按 5 大字段维度 25+ 行参数逐列比较，差异行自动高亮（品牌色描边+底）；同一列数据不同时才标色。',
          '家长版按 5 大场景问题给出通俗解读：效果 / 安全 / 佩戴 / 价格 / 资料，自动标注「最优」和「需留意」。',
          '价格、控制率均为建议值与文献数据，不代表临床承诺；对比结果不构成诊疗建议，最终以验光医师为准。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Scale className="w-4 h-4 text-brand-600" />
            已选对比 · {selectedIds.length} / 4 款
          </div>
          <ToolbarDivider />
          <div className="flex flex-wrap items-center gap-2">
            {rows.length === 0 && (
              <span className="text-xs text-slate-400 italic">尚未选择镜片，请点击右侧「加入对比」</span>
            )}
            {rows.map((l) => (
              <div
                key={l.id}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-xs font-bold text-slate-800 max-w-[160px] truncate">
                  {l.baseInfo.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => removeOne(l.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            title="一键清空"
            onClick={() => {
              if (selectedIds.length > 0) setClearOpen(true);
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setPickerOpen(true)}
          >
            加入对比
          </Button>
        </div>
      </ToolbarCard>

      {rows.length >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summary?.rateIdx != null && summary.rateIdx >= 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-1">
                <Star className="w-3.5 h-3.5" /> 临床数据最优
              </div>
              <div className="text-sm font-bold text-slate-800 leading-5 truncate">
                {rows[summary.rateIdx].baseInfo.fullName}
              </div>
              <div className="text-xs text-amber-700 mt-1 font-bold">
                {formatRate(rows[summary.rateIdx].coreParams.myopiaControlRate)}
              </div>
            </div>
          )}
          {summary?.priceIdx != null && summary.priceIdx >= 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                <Wallet className="w-3.5 h-3.5" /> 价格最友好
              </div>
              <div className="text-sm font-bold text-slate-800 leading-5 truncate">
                {rows[summary.priceIdx].baseInfo.fullName}
              </div>
              <div className="text-xs text-emerald-700 mt-1 font-bold">
                ¥ {rows[summary.priceIdx].management.suggestedRetailPrice?.toLocaleString()}
              </div>
            </div>
          )}
          {summary?.ageIdx != null && summary.ageIdx >= 0 && (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-1">
                <Heart className="w-3.5 h-3.5" /> 适配年龄最广
              </div>
              <div className="text-sm font-bold text-slate-800 leading-5 truncate">
                {rows[summary.ageIdx].baseInfo.fullName}
              </div>
              <div className="text-xs text-sky-700 mt-1 font-bold">
                {formatAge(
                  rows[summary.ageIdx].coreParams.recommendedAgeMin,
                  rows[summary.ageIdx].coreParams.recommendedAgeMax,
                )}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-700 mb-1">
              <ArrowLeftRight className="w-3.5 h-3.5" /> 对比视角
            </div>
            <Tabs variant="secondary" value={mode} onChange={(v) => setMode(v as never)} defaultValue="doctor">
              <TabItem label="医生专业" value="doctor" />
              <TabItem label="家长通俗" value="parent" />
            </Tabs>
          </div>
        </div>
      )}

      {rows.length >= 2 && mode === 'doctor' && (
        <div className="space-y-4">
          {doctorSections.map((sec) => (
            <div
              key={sec.group}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{sec.section}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    共 {sec.rows.length} 条 · 差异行
                    <span className="font-bold text-brand-600 ml-1">
                      {sec.rows.filter((r) => r.hasDiff).length}
                    </span>
                    条
                  </div>
                </div>
                <Tag color={sec.rows.filter((r) => r.hasDiff).length > 0 ? 'brand' : 'slate'} size="sm">
                  {sec.rows.filter((r) => r.hasDiff).length > 0 ? '差异存在' : '数据一致'}
                </Tag>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 text-xs text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-3 font-semibold w-48 sticky left-0 bg-slate-50/60 z-10">参数</th>
                      {rows.map((l, idx) => (
                        <th
                          key={l.id}
                          className={`px-4 py-3 font-semibold ${idx === rows.length - 1 ? 'pr-5' : ''}`}
                          style={{ minWidth: 200 }}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              idx === 0 ? 'bg-brand-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-amber-500' : 'bg-violet-500'
                            }`} />
                            <span className="font-bold text-slate-800">
                              {nameOfBrand(l.baseInfo.brandId)}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 mt-1 leading-5">{l.baseInfo.fullName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sec.rows.map((r) => (
                      <tr
                        key={r.key}
                        className={`${
                          r.hasDiff
                            ? 'bg-brand-50/40 hover:bg-brand-50/70'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-5 py-3 align-top sticky left-0 bg-inherit z-10">
                          <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            {r.label}
                            {r.hasDiff && (
                              <Tag color="brand" size="sm">不同</Tag>
                            )}
                          </div>
                          {r.hint && (
                            <div className="text-[11px] text-slate-400 mt-1 leading-4">{r.hint}</div>
                          )}
                        </td>
                        {r.values.map((cell, idx) => {
                          const c = cell as { text: string; highlighted?: boolean; warn?: boolean };
                          return (
                            <td
                              key={idx}
                              className={`px-4 py-3 align-top leading-6 ${idx === r.values.length - 1 ? 'pr-5' : ''}`}
                            >
                              <div
                                className={`text-sm rounded-lg px-2 py-1.5 ${
                                  c.warn
                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                    : c.highlighted && r.hasDiff
                                    ? 'bg-amber-50 text-amber-800 border border-amber-100 font-bold'
                                    : r.hasDiff
                                    ? 'bg-white text-slate-700 border border-brand-100/60'
                                    : 'text-slate-700'
                                }`}
                              >
                                {c.warn && (
                                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                )}
                                {c.text.split('\n').map((line, i) => (
                                  <div key={i}>{line || '—'}</div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length >= 2 && mode === 'parent' && (
        <div className="space-y-5">
          {parentSections.map((sec) => {
            const Icon = PARENT_ICON[sec.icon] ?? Heart;
            return (
              <div
                key={sec.section}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 bg-gradient-to-r from-brand-50 via-white to-white border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{sec.section}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">共 {sec.items.length} 个问题</div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  {sec.items.map((it) => (
                    <div
                      key={it.key}
                      className="rounded-2xl border border-slate-100 bg-slate-50/40 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-white/80">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-slate-800">{it.title}</div>
                          {it.bestIdx != null && it.bestIdx >= 0 && (
                            <Tag color="amber" size="sm">
                              <Award className="w-3 h-3 mr-1" /> 最优
                            </Tag>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 leading-5">{it.desc}</div>
                      </div>
                      <div className={`grid gap-3 p-4 ${
                        rows.length === 2 ? 'grid-cols-2' : rows.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'
                      }`}>
                        {it.lensTexts.map((t, idx) => {
                          const warn = it.warnPerLens[idx];
                          const best = it.bestIdx === idx;
                          return (
                            <div
                              key={idx}
                              className={`relative rounded-xl px-4 py-3 border ${
                                warn
                                  ? 'bg-red-50 border-red-100 text-red-700'
                                  : best
                                  ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm'
                                  : 'bg-white border-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    idx === 0 ? 'bg-brand-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-amber-500' : 'bg-violet-500'
                                  }`} />
                                  <span className="text-[11px] font-bold text-slate-500 truncate max-w-[140px]">
                                    {rows[idx]?.baseInfo.fullName}
                                  </span>
                                </div>
                                {best && (
                                  <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                                )}
                                {warn && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                              <div className="text-sm leading-6 whitespace-pre-wrap">
                                {t}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="选择镜片加入对比"
        description={`已选 ${selectedIds.length} / 4（至少保留 2 款进行对比）`}
        size="xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-slate-500">
              勾选后将加入对比，移除勾选即移除
            </div>
            <div className="flex gap-2">
              <Button variant="default" onClick={() => setPickerOpen(false)}>取消</Button>
              <Button
                variant="primary"
                disabled={selectedIds.length < 2 || selectedIds.length > 4}
                onClick={addFromPicker}
              >
                {selectedIds.length < 2
                  ? `请至少选择 2 款（当前 ${selectedIds.length}）`
                  : selectedIds.length > 4
                  ? '请移除多余选项'
                  : `确认加入 ${selectedIds.length} 款`}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <InputSearch
                placeholder="搜索品牌 / 镜片名 / 系列"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSearch={() => setPage(1)}
              />
            </div>
            <Select
              size="md"
              searchable
              placeholder="品牌"
              wrapperClassName="w-40"
              value={brandFilter}
              onChange={(v) => {
                setBrandFilter(v);
                setPage(1);
              }}
              options={brandOptions}
            />
            <Select
              size="md"
              placeholder="供货类型"
              wrapperClassName="w-36"
              value={supplyFilter}
              onChange={(v) => {
                setSupplyFilter(v as LensSupplyType | 'all');
                setPage(1);
              }}
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'stock', label: '现货片' },
                { value: 'custom', label: '定制片' },
              ]}
            />
          </div>
          <Table<Lens>
            size="sm"
            rowKey="id"
            dataSource={candidates}
            columns={[
              {
                key: 'pick',
                title: '对比',
                width: 60,
                align: 'center',
                render: (_v, r) => {
                  const inList = selectedIds.includes(r.id);
                  const overLimit = !inList && selectedIds.length >= 4;
                  return (
                    <Checkbox
                      disabled={overLimit}
                      checked={inList}
                      onChange={() => togglePick(r.id)}
                      title={overLimit ? '已达 4 款上限' : undefined}
                    />
                  );
                },
              },
              {
                key: 'name',
                title: '镜片名称',
                render: (_v, r) => (
                  <div>
                    <div className="font-bold text-slate-800 truncate max-w-md">
                      {r.baseInfo.fullName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatBool(r.management.isHomepageRecommended, '首页推荐', undefined) === '首页推荐' && (
                        <Tag color="amber" size="sm" className="mr-1.5">首页推荐</Tag>
                      )}
                      {r.baseInfo.launchYear}
                    </div>
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
                title: '技术',
                width: 160,
                render: (_v, r) => (
                  <Tag color="brand" size="sm">{nameOfTech(r.baseInfo.techCategoryId)}</Tag>
                ),
              },
              {
                key: 'rate',
                title: '控制率',
                width: 110,
                align: 'right',
                render: (_v, r) => (
                  <span className={`font-bold ${r.coreParams.myopiaControlRate ? 'text-amber-600' : 'text-slate-400'}`}>
                    {formatRate(r.coreParams.myopiaControlRate)}
                  </span>
                ),
              },
              {
                key: 'age',
                title: '年龄',
                width: 130,
                align: 'right',
                render: (_v, r) => formatAge(
                  r.coreParams.recommendedAgeMin,
                  r.coreParams.recommendedAgeMax,
                ),
              },
              {
                key: 'supply',
                title: '供货',
                width: 100,
                align: 'center',
                render: (_v, r) => (
                  r.supplyProfile.type === 'stock'
                    ? <Tag color="emerald" size="sm">现货</Tag>
                    : <Tag color="amber" size="sm">定制</Tag>
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
        </div>
      </Modal>

      <ConfirmModal
        open={clearOpen}
        type="danger"
        title="清空全部对比？"
        description="将从对比表中移除当前选中的全部镜片，可随时重新加入。"
        confirmText="确认清空"
        danger
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          setSelectedIds([]);
          setClearOpen(false);
          ok('已清空对比列表');
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
