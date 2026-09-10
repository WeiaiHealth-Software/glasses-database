import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronDown, Filter, AlertCircle, Home, Scale, UserCircle,
  Share2, Heart, X, ChevronLeft, User, Stethoscope, Award, AlertTriangle,
  ClipboardList, FileText, Info, ArrowLeft, Check, ShieldCheck, BookOpen,
  MessageCircle, ExternalLink, Clock, Sparkles, Bookmark, Star, Handshake,
  ChevronRight, Eye,
} from 'lucide-react';
import { Tag } from '../../components/ui/Tag';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Tabs, TabItem } from '../../components/ui/Tabs';
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

type BottomTab = 'home' | 'compare' | 'me';
type ListSection = 'recommend' | 'hot' | 'latest';

const parentIcon: Record<string, typeof Heart> = {
  heart: Heart,
  shield: Stethoscope,
  clock: ClipboardList,
  wallet: FileText,
  book: Info,
};

export default function MiniProgramPreviewPage() {
  const [bottomTab, setBottomTab] = useState<BottomTab>('home');
  const [detailLensId, setDetailLensId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Lens | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listSection, setListSection] = useState<ListSection>('recommend');

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

  const showToast = (msg: string) => setToast(msg);

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
        showToast('已从对比清单移除');
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 4) {
        showToast('对比最多 4 款，请先移除');
        return prev;
      }
      showToast('已加入对比');
      return [...prev, id];
    });
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(id)) {
        showToast('已取消收藏');
        return prev.filter((x) => x !== id);
      }
      showToast('已收藏');
      return [...prev, id];
    });
  };

  const visibleLensList = useMemo(() => {
    const base = mockLensList.filter((l) => !l.management.softDeleted);
    const kw = searchKeyword.trim().toLowerCase();
    let list = base;
    if (kw) {
      list = list.filter((l) => {
        const brand = nameOfBrand(l.baseInfo.brandId).toLowerCase();
        const tech = nameOfTech(l.baseInfo.techCategoryId).toLowerCase();
        const name = l.baseInfo.fullName.toLowerCase();
        const series = (l.baseInfo.series ?? '').toLowerCase();
        return brand.includes(kw) || tech.includes(kw) || name.includes(kw) || series.includes(kw);
      });
    }
    if (listSection === 'hot') {
      list = [...list].sort((a, b) =>
        Number(b.management.sortWeight ?? 0) - Number(a.management.sortWeight ?? 0),
      );
    } else if (listSection === 'latest') {
      list = [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    } else {
      list = [...list].sort((a, b) =>
        Number(b.management.isHomepageRecommended) - Number(a.management.isHomepageRecommended)
        || Number(b.management.sortWeight ?? 0) - Number(a.management.sortWeight ?? 0),
      );
    }
    return list;
  }, [searchKeyword, listSection]);

  const lensById = (id: string) => mockLensList.find((l) => l.id === id);

  const renderLensCard = (lens: Lens, showFavorite = true) => {
    const inCmp = compareIds.includes(lens.id);
    const fav = favoriteIds.includes(lens.id);
    return (
      <div
        key={lens.id}
        onClick={() => setDetailLensId(lens.id)}
        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 relative overflow-hidden cursor-pointer transition-transform active:scale-[0.99]"
      >
        {showFavorite && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(lens.id); }}
            className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              fav ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-rose-500' : ''}`} />
          </button>
        )}
        <div className="flex justify-between items-start gap-3 pr-8">
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
                控制率 <span className="font-bold text-amber-600">{lens.coreParams.myopiaControlRate}</span>
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
  };

  const renderHeader = () => {
    if (detailLensId) {
      return (
        <div className="pt-10 pb-2 px-3 bg-brand-600 text-white flex items-center justify-between shadow-sm shrink-0">
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
            onClick={() => showToast('已生成分享卡片（Demo）')}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <div className="pt-12 pb-3 px-4 bg-brand-600 text-white flex items-center justify-center relative shadow-sm shrink-0">
        <h1 className="font-bold text-lg tracking-wide text-white">
          {bottomTab === 'home' && '近视防控镜片查询'}
          {bottomTab === 'compare' && '镜片横向对比'}
          {bottomTab === 'me' && '个人中心'}
        </h1>
      </div>
    );
  };

  const renderHomePage = () => (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
      <div className="bg-white p-4 space-y-3 rounded-b-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索品牌、镜片名称、系列"
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
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="shrink-0 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center gap-1 active:bg-slate-200"
          >
            更多筛选 <Filter className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          {(['recommend', 'hot', 'latest'] as ListSection[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setListSection(s)}
              className={`py-1.5 rounded-xl text-xs font-bold transition-colors ${
                listSection === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 active:bg-slate-100'
              }`}
            >
              {s === 'recommend' ? '精选推荐' : s === 'hot' ? '热门镜片' : '最新录入'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-xs font-bold text-slate-500 flex justify-between items-center">
          <span>
            {listSection === 'recommend' ? '精选推荐' : listSection === 'hot' ? '热门镜片' : '最新录入'}
            · 共 {visibleLensList.length} 款
          </span>
          <span
            className="text-brand-600 flex items-center gap-1 cursor-pointer active:opacity-70"
            onClick={() => setDisclaimerOpen(true)}
          >
            医疗免责声明 <AlertCircle className="w-3 h-3" />
          </span>
        </div>
        {visibleLensList.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-16">
            暂无匹配的镜片
          </div>
        ) : (
          visibleLensList.map((l) => renderLensCard(l))
        )}
      </div>
    </div>
  );

  const renderComparePage = () => (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-4 pb-3 rounded-b-2xl shadow-sm">
        <div className="text-[17px] font-extrabold text-slate-800">横向对比</div>
        <div className="text-[11px] text-slate-500 mt-1">
          已选择 {compareIds.length} / 4 款镜片 · 建议 2-4 款同屏对比
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((slot) => {
            const id = compareIds[slot];
            const lens = id ? lensById(id) : undefined;
            return (
              <div
                key={slot}
                className={`h-20 rounded-xl border border-dashed flex items-center justify-center px-3 ${
                  lens
                    ? 'bg-brand-50/50 border-brand-200'
                    : 'bg-slate-50 border-slate-200 text-slate-400 text-xs'
                }`}
              >
                {lens ? (
                  <div className="w-full min-w-0 flex items-center gap-2">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                      {slot + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-slate-500 truncate">
                        {nameOfBrand(lens.baseInfo.brandId)}
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate leading-4">
                        {lens.baseInfo.fullName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(lens.id)}
                      className="shrink-0 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-slate-400 active:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span>请在首页选择镜片</span>
                )}
              </div>
            );
          })}
        </div>
        {compareIds.length >= 2 && (
          <button
            type="button"
            className="mt-3 w-full h-10 rounded-full bg-brand-600 text-white text-sm font-bold active:bg-brand-700"
            onClick={() => showToast('跳转到横向对比工具（Demo）')}
          >
            立即对比这 {compareIds.length} 款
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {compareIds.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-16 space-y-2">
            <Scale className="w-10 h-10 mx-auto opacity-50" />
            <div>对比清单为空</div>
            <div className="text-xs">在首页卡片点击「加入对比」开始</div>
          </div>
        ) : (
          compareIds.map((id) => {
            const lens = lensById(id);
            return lens ? renderLensCard(lens) : null;
          })
        )}
      </div>
    </div>
  );

  const renderMePage = () => (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-brand-600 to-brand-500 px-5 pt-5 pb-10 text-white rounded-b-[2rem] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="text-lg font-bold">家长用户</div>
            <div className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 已阅读并同意免责声明
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            className="bg-white/15 backdrop-blur rounded-2xl p-3 text-left active:bg-white/25"
          >
            <Bookmark className="w-5 h-5 mb-1.5" />
            <div className="text-xl font-extrabold leading-none">{favoriteIds.length}</div>
            <div className="text-[11px] text-white/85 mt-1">收藏镜片</div>
          </button>
          <button
            type="button"
            className="bg-white/15 backdrop-blur rounded-2xl p-3 text-left active:bg-white/25"
            onClick={() => setBottomTab('compare')}
          >
            <Scale className="w-5 h-5 mb-1.5" />
            <div className="text-xl font-extrabold leading-none">{compareIds.length}</div>
            <div className="text-[11px] text-white/85 mt-1">对比中（/4）</div>
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="w-full px-4 py-3 flex items-center gap-3 active:bg-slate-50 border-b border-slate-100"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-slate-800">使用说明</div>
              <div className="text-[11px] text-slate-500 mt-0.5">如何搜索、对比、收藏镜片</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="w-full px-4 py-3 flex items-center gap-3 active:bg-slate-50 border-b border-slate-100"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-slate-800">关于我们</div>
              <div className="text-[11px] text-slate-500 mt-0.5">产品介绍 · 版本信息 · 联系我们</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => showToast('已保存分享图片到相册（Demo）')}
            className="w-full px-4 py-3 flex items-center gap-3 active:bg-slate-50 border-b border-slate-100"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-slate-800">分享给好友</div>
              <div className="text-[11px] text-slate-500 mt-0.5">生成小程序卡片或海报</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => showToast('已复制朋友圈文案（Demo）')}
            className="w-full px-4 py-3 flex items-center gap-3 active:bg-slate-50"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-slate-800">分享到朋友圈</div>
              <div className="text-[11px] text-slate-500 mt-0.5">一键生成九图+配文</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 px-1 pt-1">我的收藏 ({favoriteIds.length})</div>
        <div className="space-y-3">
          {favoriteIds.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-sm space-y-2">
              <Star className="w-8 h-8 mx-auto opacity-40" />
              <div>还没有收藏镜片</div>
              <div className="text-xs">在详情页或卡片点击 ♥ 收藏</div>
            </div>
          ) : (
            favoriteIds.map((id) => {
              const lens = lensById(id);
              return lens ? renderLensCard(lens, false) : null;
            })
          )}
        </div>

        <div className="text-[10px] text-slate-400 text-center pt-2 pb-1 leading-5">
          近视防控镜片查询 v1.0.0 · Demo 预览<br />
          数据仅供产品参数查阅，不构成诊疗承诺
        </div>
      </div>
    </div>
  );

  const renderDetailPage = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {detail ? (
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-28">
          <div className="bg-white px-4 pt-4 pb-3 space-y-2.5 rounded-b-3xl shadow-sm border-b border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">
              {nameOfBrand(detail.baseInfo.brandId)}
              {detail.baseInfo.launchYear && (
                <span className="ml-2">· {formatYear(detail.baseInfo.launchYear)}上市</span>
              )}
            </div>
            <div className="flex items-start gap-2">
              <div className="text-[17px] font-extrabold text-slate-900 leading-6 flex-1">
                {detail.baseInfo.fullName}
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(detail.id)}
                className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  favoriteIds.includes(detail.id)
                    ? 'bg-rose-50 text-rose-500'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${favoriteIds.includes(detail.id) ? 'fill-rose-500' : ''}`} />
              </button>
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
                <Tag color="violet" size="sm">控制率 {detail.coreParams.myopiaControlRate}</Tag>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="rounded-2xl bg-brand-50/80 border border-brand-100 p-2.5 text-center">
                <div className="text-[10px] text-slate-500 font-semibold mb-1">控制率</div>
                <div className="text-[15px] font-extrabold text-brand-700 leading-tight">
                  {detail.coreParams.myopiaControlRate ?? '—'}
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
                  {formatPrice(detail.management.suggestedRetailPrice)}
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
            onClick={() => { toggleFavorite(detailLensId!); }}
            className={`h-11 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-sm ${
              favoriteIds.includes(detailLensId!)
                ? 'bg-rose-500 text-white active:bg-rose-600'
                : 'bg-brand-600 text-white active:bg-brand-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${favoriteIds.includes(detailLensId!) ? 'fill-white' : ''}`} />
            {favoriteIds.includes(detailLensId!) ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBody = () => {
    if (detailLensId) return renderDetailPage();
    if (bottomTab === 'home') return renderHomePage();
    if (bottomTab === 'compare') return renderComparePage();
    return renderMePage();
  };

  const renderBottomTabBar = () => {
    if (detailLensId) return null;
    const tabs: { key: BottomTab; label: string; Icon: typeof Home; active: boolean }[] = [
      { key: 'home', label: '首页', Icon: Home, active: bottomTab === 'home' },
      { key: 'compare', label: `对比 (${compareIds.length})`, Icon: Scale, active: bottomTab === 'compare' },
      { key: 'me', label: '我的', Icon: UserCircle, active: bottomTab === 'me' },
    ];
    return (
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-around items-center pb-6 pt-3 px-4 z-40">
        {tabs.map(({ key, label, Icon, active }) => (
          <button
            key={key}
            type="button"
            onClick={() => setBottomTab(key)}
            className={`flex flex-col items-center gap-1 ${
              active ? 'text-brand-600' : 'text-slate-400'
            }`}
          >
            <Icon className={`w-6 h-6 ${active ? 'stroke-[2.2]' : ''}`} />
            <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 flex justify-center items-start min-h-[calc(100vh-120px)] gap-6 bg-slate-50/50">
      <div
        className="bg-white rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col shrink-0"
        style={{ width: '375px', height: '812px' }}
      >
        <div className="h-7 w-full flex justify-center absolute top-0 z-50 pointer-events-none">
          <div className="w-32 h-5 bg-slate-800 rounded-b-2xl" />
        </div>
        {renderHeader()}
        {disclaimerAccepted ? renderBody() : (
          <div className="flex-1 bg-slate-50 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center px-10">
              请先阅读并同意免责声明后使用
            </div>
            <div className="px-6 pb-10">
              <button
                type="button"
                onClick={() => setDisclaimerOpen(true)}
                className="w-full h-11 rounded-2xl bg-brand-600 text-white text-sm font-bold active:bg-brand-700"
              >
                查看并同意免责声明
              </button>
            </div>
          </div>
        )}
        {disclaimerAccepted && renderBottomTabBar()}

        {toast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-2xl bg-slate-800/90 text-white text-xs font-bold shadow-lg animate-in fade-in">
            {toast}
          </div>
        )}

        {disclaimerOpen && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center px-5">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] animate-in fade-in"
              onClick={() => {
                if (!disclaimerAccepted) return;
                setDisclaimerOpen(false);
              }}
            />
            <div className="relative w-full max-w-[320px] bg-white rounded-[22px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="text-base font-extrabold text-slate-900 leading-tight">医疗免责声明</div>
                </div>
                {disclaimerAccepted && (
                  <button
                    type="button"
                    onClick={() => setDisclaimerOpen(false)}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="px-5 pb-3 text-[13px] text-slate-600 leading-6">
                本小程序所提供的所有镜片参数、说明与对比结果，仅供用户学习参考，不构成任何诊疗建议、配镜处方或疗效承诺。
              </div>
              <div className="px-5 pb-4">
                <ul className="space-y-1.5 text-[12px] text-slate-600 list-disc pl-4 leading-5 border-t border-slate-100 pt-3">
                  <li>儿童及青少年近视防控产品的适配必须在执业眼科医生或验光师的专业指导下完成。</li>
                  <li>本站数据来源于公开资料及厂商宣传，实际产品参数以官方说明书及门店实物为准。</li>
                  <li>任何眼部不适、视力下降等情况请立即就医，切勿自行诊断或配镜。</li>
                  <li>使用本小程序即视为您已了解并自愿承担相关风险。</li>
                </ul>
              </div>
              <div className="px-5 pb-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (disclaimerAccepted) {
                      setDisclaimerOpen(false);
                    } else {
                      showToast('请阅读并同意免责声明后使用');
                    }
                  }}
                  className="flex-1 h-11 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold active:bg-slate-200"
                >
                  {disclaimerAccepted ? '关闭' : '不同意'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisclaimerAccepted(true);
                    setDisclaimerOpen(false);
                    showToast('欢迎使用，已确认免责声明');
                  }}
                  className="flex-1 h-11 rounded-2xl bg-brand-600 text-white text-sm font-bold active:bg-brand-700 shadow-md shadow-brand-600/20"
                >
                  {disclaimerAccepted ? '我已知晓' : '我已阅读并同意'}
                </button>
              </div>
            </div>
          </div>
        )}

        <Modal
          open={aboutOpen}
          onClose={() => setAboutOpen(false)}
          title="关于我们"
          size="md"
          type="info"
          hideCancel
          confirmText="好的"
          onConfirm={() => setAboutOpen(false)}
          description="帮助家长和专业人士在配镜前，一站式查阅、对比、收藏主流近视防控镜片。"
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-50/60 border border-brand-100 p-4 space-y-2">
              <div className="text-sm font-bold text-brand-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> 产品使命
              </div>
              <div className="text-xs text-brand-700/90 leading-5">
                让每一片近视防控镜片的参数、特点、适应人群都透明可见，让家长不踩坑，让专业人士更高效。
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-100 p-3">
                <div className="text-[11px] text-slate-500 mb-1">版本</div>
                <div className="font-bold text-slate-800">v1.0.0 (Demo)</div>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <div className="text-[11px] text-slate-500 mb-1">上线时间</div>
                <div className="font-bold text-slate-800">2026-09</div>
              </div>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => showToast('客服微信：lens-help（Demo）')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 active:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <MessageCircle className="w-4 h-4 text-brand-600" /> 联系客服
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => showToast('商务合作：bd@lens.db（Demo）')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 active:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Handshake className="w-4 h-4 text-emerald-600" /> 商务合作
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          title="使用说明"
          size="md"
          type="info"
          hideCancel
          confirmText="开始使用"
          onConfirm={() => setGuideOpen(false)}
          description="4 步上手，用好这款镜片查询工具。"
        >
          <div className="space-y-3">
            {[
              { step: '01', icon: Search, title: '全局检索', desc: '首页搜索框支持品牌名、镜片名、系列模糊搜索，快速缩小范围。' },
              { step: '02', icon: Filter, title: '高级筛选', desc: '点击「更多筛选」按技术类型、年龄适配、现货/定制精准锁定目标镜片。' },
              { step: '03', icon: Scale, title: '横向对比', desc: '加入对比最多 4 款，同屏比较核心参数、适配人群与价格，辅助决策。' },
              { step: '04', icon: Heart, title: '收藏与分享', desc: '高频款一键收藏，生成海报分享给好友或朋友圈，集体决策更高效。' },
            ].map(({ step, icon: I, title, desc }) => (
              <div key={step} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-extrabold flex items-center justify-center text-sm">
                  <I className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-800">
                    <span className="mr-2 text-brand-600">{step}</span>{title}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-5 mt-1">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal>

        <Modal
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="高级筛选"
          size="md"
          onConfirm={() => { setFilterOpen(false); showToast('已应用筛选（Demo）'); }}
          confirmText="应用筛选"
          cancelText="重置"
          onCancel={() => showToast('筛选已重置（Demo）')}
          description="按技术类型、年龄适配、供货类型等条件精准筛选镜片。"
        >
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">技术类型</div>
              <div className="flex flex-wrap gap-2">
                {['多点离焦', '环带微柱镜', '微透镜星环', '周边离焦', 'OK镜'].map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">建议年龄</div>
              <div className="flex flex-wrap gap-2">
                {['6-8 岁', '8-12 岁', '12-18 岁', '全年龄段'].map((a) => (
                  <span key={a} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">供货类型</div>
              <div className="flex flex-wrap gap-2">
                {['仅现货', '仅定制', '不限'].map((s, idx) => (
                  <span
                    key={s}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      idx === 2 ? 'bg-brand-50 border-brand-100 text-brand-600' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">近视控制有效率</div>
              <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                <span>≥ 50%</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full relative">
                  <div className="absolute left-0 top-0 h-full w-[60%] bg-brand-500 rounded-full" />
                </div>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>

      <div className="ml-8 w-[320px] hidden xl:block">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <div className="text-sm font-bold text-slate-800 mb-1">当前 Demo 预览模式</div>
            <div className="text-xs text-slate-500 leading-5">
              在 375 × 812 的 iPhone 尺寸下预览 C 端小程序，完整覆盖 4 大模块 12+ 功能：
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: '启动免责弹窗', tag: '合规' },
              { title: '首页：推荐/热门/最新', tag: '首页' },
              { title: '全局模糊搜索', tag: '检索' },
              { title: '高级条件筛选', tag: '筛选' },
              { title: '详情双模式 Tabs', tag: '详情' },
              { title: '2-4 款横向对比', tag: '对比' },
              { title: '收藏镜片管理', tag: '收藏' },
              { title: '分享好友/朋友圈', tag: '传播' },
              { title: '关于我们页', tag: '关于' },
              { title: '4 步使用说明', tag: '指南' },
              { title: '底部三 Tab 导航', tag: '导航' },
              { title: '底部常驻免责声明', tag: '合规' },
            ].map(({ title, tag }) => (
              <div key={title} className="rounded-xl border border-slate-100 p-2.5 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-800 truncate leading-4">{title}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{tag}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-brand-50/60 border border-brand-100 p-3 text-[11px] text-brand-700 leading-5">
            <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
            家长版与医生版共用同一份 B 端数据，仅在字段组织方式和措辞上做区分，避免双份录入。
          </div>
        </div>
      </div>
    </div>
  );
}
