import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronDown, Filter, AlertCircle, Home, Scale, UserCircle,
  Share2, Heart, X, ChevronLeft, User, Stethoscope, Award, AlertTriangle,
  ClipboardList, FileText, Info, ArrowLeft,
} from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { Tabs, TabItem } from '../../components/ui/Tabs';
import { Tag } from '../../components/ui/Tag';
import type { Lens } from '../../types/lens';
import { nameOfBrand, nameOfTech } from '../../services/lens.service';
import { LensService } from '../../services/lens.service';
import {
  formatAge,
  formatBool,
  formatNum,
  formatPrice,
  formatRange,
  formatRate,
  formatYear,
  buildParentSections,
  buildDoctorSections,
} from '../../services/compare.service';
import { mockLensList } from '../../mocks/lens.mock';
import { mockTechTagList } from '../../mocks/dictionary.mock';

const TECH_TAG_LABEL_MAP: Record<string, string> = {};
for (const t of mockTechTagList) TECH_TAG_LABEL_MAP[t.id] = t.name;

const parentIcon: Record<string, typeof Heart> = {
  heart: Heart,
  shield: Stethoscope,
  clock: ClipboardList,
  wallet: FileText,
  book: Info,
};

export default function MiniProgramPreviewPage() {
  const [detailLensId, setDetailLensId] = useState<string | null>('L-ZEISS-XLY');
  const [detail, setDetail] = useState<Lens | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!detailLensId) {
      setDetail(null);
      return;
    }
    void (async () => {
      const res = await LensService.get(detailLensId);
      if (res.code === 0) setDetail(res.data);
    })();
  }, [detailLensId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const parentSections = useMemo(
    () => (detail ? buildParentSections([detail]).map((s) => ({
      ...s,
      items: s.items.map((i) => ({
        ...i,
        text: i.lensTexts[0] ?? '—',
        warn: i.warnPerLens[0],
      })),
    })) : []),
    [detail],
  );
  const doctorSections = useMemo(
    () => (detail ? buildDoctorSections([detail]) : []),
    [detail],
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        setToast('已从对比清单移除');
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 4) {
        setToast('对比最多 4 款，请先移除');
        return prev;
      }
      setToast('已加入对比');
      return [...prev, id];
    });
  };

  return (
    <div className="p-6 flex justify-center items-start min-h-[calc(100vh-120px)] bg-slate-100/50">
      <div
        className="bg-white rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col shrink-0"
        style={{ width: '375px', height: '812px' }}
      >
        <div className="h-7 w-full flex justify-center absolute top-0 z-50 pointer-events-none">
          <div className="w-32 h-5 bg-slate-800 rounded-b-2xl" />
        </div>
        {!detailLensId ? (
          <>
            <div className="pt-12 pb-3 px-4 bg-brand-600 text-white flex items-center justify-center relative shadow-sm">
              <h1 className="font-bold text-lg tracking-wide">近视防控镜片查询</h1>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
              <div className="bg-white p-4 space-y-3 rounded-b-2xl shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索品牌、镜片名称"
                    className="w-full h-10 rounded-full border border-slate-200 pl-9 pr-4 bg-slate-50 text-sm outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <span className="shrink-0 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-full text-xs font-bold flex items-center gap-1">
                    品牌 <ChevronDown className="w-3 h-3" />
                  </span>
                  <span className="shrink-0 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center gap-1">
                    技术类型 <ChevronDown className="w-3 h-3" />
                  </span>
                  <span className="shrink-0 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center gap-1">
                    更多筛选 <Filter className="w-3 h-3" />
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-xs font-bold text-slate-500 flex justify-between items-center">
                  <span>为您找到 {mockLensList.filter((l) => !l.management.softDeleted).length} 款镜片</span>
                  <span className="text-brand-600 flex items-center gap-1">
                    医疗免责声明 <AlertCircle className="w-3 h-3" />
                  </span>
                </div>
                {mockLensList.filter((l) => !l.management.softDeleted).slice(0, 6).map((lens) => {
                  const inCmp = compareIds.includes(lens.id);
                  return (
                    <div
                      key={lens.id}
                      onClick={() => setDetailLensId(lens.id)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 relative overflow-hidden cursor-pointer transition-transform active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-slate-500 font-semibold mb-1">
                            {nameOfBrand(lens.baseInfo.brandId)}
                          </div>
                          <div className="font-bold text-slate-800 text-[15px] leading-6 truncate">
                            {lens.baseInfo.fullName}
                          </div>
                        </div>
                        {lens.management.isHomepageRecommended && (
                          <div className="shrink-0 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                            <Award className="w-3 h-3" /> 推荐
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-bold border border-brand-100">
                          {nameOfTech(lens.baseInfo.techCategoryId)}
                        </span>
                        <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-[10px] font-bold border border-violet-100">
                          {TECH_TAG_LABEL_MAP[lens.baseInfo.techStructure ?? ''] ?? lens.baseInfo.techStructure ?? '—'}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                          lens.supplyProfile.type === 'stock'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {lens.supplyProfile.type === 'stock' ? '现货' : '定制'}
                        </span>
                        {inCmp && (
                          <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-bold border border-sky-100">
                            已加入对比
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-xs text-slate-500">
                          {lens.coreParams.myopiaControlRate ? (
                            <span>
                              控制率 <span className="font-bold text-amber-600">{lens.coreParams.myopiaControlRate}%</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">控制率暂无</span>
                          )}
                        </div>
                        <div className="text-[15px] font-bold text-brand-700">
                          {formatPrice(lens.management.suggestedRetailPrice)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="pt-10 pb-2 px-3 bg-brand-600 text-white flex items-center justify-between shadow-sm">
              <button
                type="button"
                onClick={() => setDetailLensId(null)}
                className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center px-2 text-[15px] font-bold leading-6 max-w-[260px] truncate mx-1">
                {detail?.baseInfo.fullName ?? '镜片详情'}
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {detail ? (
              <div className="flex-1 overflow-y-auto bg-slate-50 pb-28">
                <div className="bg-white px-4 pt-4 pb-3 space-y-2.5 rounded-b-3xl shadow-sm border-b border-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold">
                    {nameOfBrand(detail.baseInfo.brandId)}
                    {detail.baseInfo.launchYear && (
                      <span className="ml-2">· {formatYear(detail.baseInfo.launchYear)}上市</span>
                    )}
                  </div>
                  <div className="text-[17px] font-extrabold text-slate-900 leading-6">
                    {detail.baseInfo.fullName}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag color="brand" size="sm">{nameOfTech(detail.baseInfo.techCategoryId)}</Tag>
                    {detail.management.isHomepageRecommended && (
                      <Tag color="amber" size="sm"><Award className="w-3 h-3 mr-1" /> 首页推荐</Tag>
                    )}
                    {detail.supplyProfile.type === 'stock' ? (
                      <Tag color="emerald" size="sm">现货</Tag>
                    ) : (
                      <Tag color="amber" size="sm">定制</Tag>
                    )}
                    {detail.coreParams.myopiaControlRate && (
                      <Tag color="violet" size="sm">控制率 {detail.coreParams.myopiaControlRate}%</Tag>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="rounded-2xl bg-brand-50/80 border border-brand-100 p-2.5 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">控制率</div>
                      <div className="text-[15px] font-extrabold text-brand-700 leading-tight">
                        {formatRate(detail.coreParams.myopiaControlRate)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-amber-50/80 border border-amber-100 p-2.5 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">建议年龄</div>
                      <div className="text-[14px] font-extrabold text-amber-700 leading-tight">
                        {formatAge(detail.coreParams.recommendedAgeMin, detail.coreParams.recommendedAgeMax)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-2.5 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">参考价</div>
                      <div className="text-[14px] font-extrabold text-emerald-700 leading-tight">
                        {formatPrice(detail.management.suggestedRetailPrice).replace('¥', '¥')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-3">
                  <Tabs variant="secondary" defaultValue="parent">
                    <TabItem
                      label={
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> 家长通俗
                        </span>
                      }
                      value="parent"
                    >
                      <div className="space-y-4 pt-3 pb-2">
                        {parentSections.map((sec) => {
                          const Icon = parentIcon[sec.icon] ?? Info;
                          return (
                            <div key={sec.section} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                              <div className="px-4 py-3 bg-gradient-to-r from-brand-50 via-white to-white border-b border-slate-100 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="text-sm font-extrabold text-slate-800">{sec.section}</div>
                              </div>
                              <div className="p-4 space-y-3">
                                {sec.items.map((it) => {
                                  const item = it as unknown as { key: string; title: string; desc: string; text: string; warn?: boolean; bestIdx?: number };
                                  return (
                                    <div
                                      key={item.key}
                                      className={`rounded-xl border px-3.5 py-3 ${
                                        item.warn
                                          ? 'bg-red-50 border-red-100 text-red-700'
                                          : 'bg-slate-50/60 border-slate-100 text-slate-800'
                                      }`}
                                    >
                                      <div className="text-[13px] font-bold flex items-center gap-1.5 mb-1.5 leading-5">
                                        {item.warn && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                        {item.title}
                                      </div>
                                      <div className="text-[11px] text-slate-500 leading-5 mb-2">{item.desc}</div>
                                      <div className="text-[13px] leading-6 whitespace-pre-wrap font-semibold">
                                        {item.text}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TabItem>
                    <TabItem
                      label={
                        <span className="inline-flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5" /> 医生专业
                        </span>
                      }
                      value="doctor"
                    >
                      <div className="space-y-3 pt-3 pb-2">
                        {doctorSections.map((sec) => (
                          <div key={sec.group} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-sm font-extrabold text-slate-800">
                              {sec.section}
                            </div>
                            <div className="divide-y divide-slate-100">
                              {sec.rows.map((r) => {
                                const cell = r.values[0] as { text: string; highlighted?: boolean; warn?: boolean };
                                return (
                                  <div
                                    key={r.key}
                                    className="grid grid-cols-[110px_1fr] px-4 py-2.5 gap-3"
                                  >
                                    <div className="text-[11px] text-slate-500 pt-1 leading-5 font-semibold">
                                      {r.label}
                                    </div>
                                    <div
                                      className={`text-[12.5px] leading-6 font-medium ${
                                        cell.warn
                                          ? 'text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-100'
                                          : cell.highlighted
                                          ? 'text-amber-800 font-bold'
                                          : 'text-slate-800'
                                      }`}
                                    >
                                      {cell.warn && (
                                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                      )}
                                      {cell.text.split('\n').map((t, i) => (
                                        <div key={i}>{t || '—'}</div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabItem>
                  </Tabs>
                </div>

                <div className="px-4 pt-3 pb-1 text-[10px] text-slate-400 leading-5">
                  ※ 以上数据及说明仅用于产品参数查阅，不构成任何诊疗或疗效承诺；具体适配与佩戴方案请遵医嘱。
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                加载中...
              </div>
            )}

            <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-3 pt-2 pb-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleCompare(detailLensId!)}
                  className={`h-11 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    compareIds.includes(detailLensId!)
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-white text-slate-700 border-slate-200 active:bg-slate-50'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  {compareIds.includes(detailLensId!)
                    ? `对比清单（${compareIds.length}/4）`
                    : '加入对比'}
                </button>
                <button
                  type="button"
                  className="h-11 rounded-2xl text-[13px] font-bold text-white bg-brand-600 active:bg-brand-700 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Heart className="w-4 h-4" /> 收藏
                </button>
              </div>
            </div>
          </div>
        )}

        {!detailLensId && (
          <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-around items-center pb-6 pt-3 px-4 z-40">
            <div className="flex flex-col items-center gap-1 text-brand-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-bold">首页</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-500">
              <Scale className="w-6 h-6" />
              <span className="text-[10px] font-medium">对比 ({compareIds.length})</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <UserCircle className="w-6 h-6" />
              <span className="text-[10px] font-medium">我的</span>
            </div>
          </div>
        )}

        {toast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-2xl bg-slate-800/90 text-white text-xs font-bold shadow-lg animate-in fade-in">
            {toast}
          </div>
        )}
      </div>

      <div className="ml-8 w-[320px] hidden xl:block">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <div className="text-sm font-bold text-slate-800 mb-1">当前 Demo 预览模式</div>
            <div className="text-xs text-slate-500 leading-5">
              在 375 × 812 的 iPhone 尺寸下预览 C 端小程序，可验证：
            </div>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-5 leading-5">
            <li>首页列表：搜索框、品牌筛选气泡、卡片样式</li>
            <li>详情 Secondary Tabs：<span className="font-bold text-brand-600">家长通俗 / 医生专业</span> 平滑切换</li>
            <li>通俗版 5 大场景问题，自动高亮“需留意”</li>
            <li>专业版 5 大字段分组，25+ 条参数展示</li>
            <li>底部操作：加入对比（最多 4 款）、收藏</li>
            <li>列表/详情底部常驻免责声明与返回导航</li>
          </ul>
          <div className="rounded-2xl bg-brand-50/60 border border-brand-100 p-3 text-[11px] text-brand-700 leading-5">
            <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
            家长版与医生版共用同一份 B 端数据，仅在字段组织方式和措辞上做区分，避免双份录入。
          </div>
        </div>
      </div>
    </div>
  );
}
