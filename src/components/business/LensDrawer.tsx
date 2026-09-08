import React, { useEffect, useState } from 'react';
import { X, Star, ToggleLeft, ToggleRight, Edit3 } from 'lucide-react';
import { Tag } from '../ui/Tag';
import { Button } from '../ui/Button';
import { Tabs, TabItem } from '../ui/Tabs';
import type { Lens } from '../../types/lens';
import { LensService, nameOfBrand, nameOfTech } from '../../services/lens.service';

interface LensDrawerProps {
  open: boolean;
  lensId?: string | null;
  onClose: () => void;
  onEdit?: (lens: Lens) => void;
  onToggleStatus?: (lens: Lens) => void;
  onToggleRecommend?: (lens: Lens) => void;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div className="grid grid-cols-3 gap-3 py-2.5 border-b border-slate-100 last:border-0">
    <div className="col-span-1 text-xs text-slate-400 font-medium pt-0.5">{label}</div>
    <div
      className={`col-span-2 text-sm text-slate-700 leading-6 ${
        strong ? 'font-bold text-slate-800' : ''
      }`}
    >
      {value || <span className="text-slate-300">-</span>}
    </div>
  </div>
);

export const LensDrawer: React.FC<LensDrawerProps> = ({
  open,
  lensId,
  onClose,
  onEdit,
  onToggleStatus,
  onToggleRecommend,
}) => {
  const [lens, setLens] = useState<Lens | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lensId) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await LensService.get(lensId);
        if (res.code === 0) setLens(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, lensId]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;
  const L = lens;

  return (
    <div className="fixed inset-0 z-[900] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex-1 pr-4">
            {loading && !L ? (
              <div className="h-7 w-48 bg-slate-100 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-bold text-slate-800">{L?.baseInfo.fullName ?? '-'}</h2>
                  {L?.management.status === 'online' ? (
                    <Tag color="emerald" size="sm">已上架</Tag>
                  ) : (
                    <Tag color="slate" size="sm">已下架</Tag>
                  )}
                  {L?.management.isHomepageRecommended && (
                    <Tag color="amber" size="sm">
                      <Star className="w-3 h-3 mr-0.5 fill-amber-500" />
                      首页推荐
                    </Tag>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>品牌：{L ? nameOfBrand(L.baseInfo.brandId) : '-'}</span>
                  <span>技术大类：{L ? nameOfTech(L.baseInfo.techCategoryId) : '-'}</span>
                  <span>ID：{L?.id ?? '-'}</span>
                  <span>更新时间：{L?.management.updatedAt ?? '-'}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={L?.management.status === 'online' ? 'default' : 'primary'}
              onClick={() => L && onToggleStatus?.(L)}
              leftIcon={L?.management.status === 'online' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            >
              {L?.management.status === 'online' ? '下架' : '上架'}
            </Button>
            <Button
              size="sm"
              variant={L?.management.isHomepageRecommended ? 'default' : 'primary'}
              onClick={() => L && onToggleRecommend?.(L)}
              leftIcon={<Star className="w-4 h-4" />}
            >
              {L?.management.isHomepageRecommended ? '取消首页推荐' : '首页推荐'}
            </Button>
          </div>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Edit3 className="w-4 h-4" />}
            onClick={() => L && onEdit?.(L)}
          >
            编辑
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!L ? (
            <div className="py-24 text-center text-slate-400 text-sm">加载中...</div>
          ) : (
            <Tabs variant="secondary" defaultValue="base">
              <TabItem label="基础信息" value="base">
                <div className="px-1">
                  <InfoRow label="镜片完整名称" value={L.baseInfo.fullName} strong />
                  <InfoRow label="品牌名称" value={nameOfBrand(L.baseInfo.brandId)} />
                  <InfoRow label="产品系列" value={L.baseInfo.series} />
                  <InfoRow label="上市年份" value={L.baseInfo.launchYear ? `${L.baseInfo.launchYear} 年` : '-'} />
                  <InfoRow label="技术大类" value={nameOfTech(L.baseInfo.techCategoryId)} />
                  <InfoRow label="技术结构" value={L.baseInfo.techStructure} />
                  <InfoRow label="镜片基材" value={L.baseInfo.material} />
                  <InfoRow label="标准折射率" value={L.baseInfo.refractiveIndex} />
                  <InfoRow label="标配膜层" value={L.baseInfo.standardCoating} />
                  <InfoRow
                    label="可选升级膜层"
                    value={
                      L.baseInfo.upgradeCoatings?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {L.baseInfo.upgradeCoatings.map((c) => (
                            <Tag key={c} color="brand" size="xs">{c}</Tag>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )
                    }
                  />
                </div>
              </TabItem>

              <TabItem label="核心参数" value="core" badge={<Tag color="red" size="xs">专业</Tag>}>
                <div className="px-1">
                  <InfoRow
                    label="近视控制有效率"
                    value={
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-brand-700 font-bold">{L.coreParams.myopiaControlRate ?? '-'}</span>
                        {L.coreParams.myopiaControlSource && (
                          <Tag color="slate" size="xs" className="font-normal">
                            数据来源：{L.coreParams.myopiaControlSource}
                          </Tag>
                        )}
                      </div>
                    }
                  />
                  <InfoRow label="离焦量 (D值)" value={L.coreParams.defocusValue} strong />
                  <InfoRow label="中心光学区直径" value={L.coreParams.centerOpticDiameter ? `φ ${L.coreParams.centerOpticDiameter} mm` : '-'} />
                  <InfoRow label="离焦环/点位数量" value={L.coreParams.defocusRingCount ? `${L.coreParams.defocusRingCount} 个` : '-'} />
                  <InfoRow label="适配最大散光" value={L.coreParams.astigmatismMax ? `${L.coreParams.astigmatismMax} 度` : '-'} />
                  <InfoRow
                    label="适配年龄区间"
                    value={
                      L.coreParams.recommendedAgeMin != null && L.coreParams.recommendedAgeMax != null
                        ? `${L.coreParams.recommendedAgeMin} - ${L.coreParams.recommendedAgeMax} 岁`
                        : '-'
                    }
                  />
                  <InfoRow
                    label="最佳适配近视区间"
                    value={
                      L.coreParams.myopiaRangeMin != null && L.coreParams.myopiaRangeMax != null
                        ? `${L.coreParams.myopiaRangeMin / 100 > 0 ? '+' : ''}${L.coreParams.myopiaRangeMin / 100}D ~ ${
                            L.coreParams.myopiaRangeMax / 100 > 0 ? '+' : ''
                          }${L.coreParams.myopiaRangeMax / 100}D`
                        : '-'
                    }
                  />
                </div>
              </TabItem>

              <TabItem label="供货与适配" value="supply">
                <div className="px-1">
                  <InfoRow
                    label="供货属性"
                    value={
                      L.supplyProfile.type === 'stock' ? (
                        <Tag color="emerald">现货镜片</Tag>
                      ) : (
                        <Tag color="brand">定制镜片</Tag>
                      )
                    }
                  />
                  <InfoRow label="常规订货周期" value={L.supplyProfile.standardLeadTime} />
                  <InfoRow
                    label="大散光定制"
                    value={L.supplyProfile.highAstigmatismSupport ? <Tag color="emerald">支持</Tag> : <Tag color="slate">不支持</Tag>}
                  />
                  <InfoRow
                    label="高度数定制"
                    value={L.supplyProfile.highMyopiaSupport ? <Tag color="emerald">支持</Tag> : <Tag color="slate">不支持</Tag>}
                  />
                  <InfoRow label="适配人群特征" value={L.supplyProfile.fitCharacteristics} />
                  <InfoRow
                    label="绝对禁忌症"
                    value={<span className="text-red-600">{L.supplyProfile.absoluteContraindications ?? '-'}</span>}
                  />
                  <InfoRow label="谨慎适配人群" value={L.supplyProfile.cautionConditions} />
                </div>
              </TabItem>

              <TabItem label="临床验配铁律" value="clinical" badge={<Tag color="red" size="xs">必读</Tag>}>
                <div className="px-1 space-y-1">
                  <InfoRow label="验光原则" value={L.clinicalRules.refractionPrinciple} />
                  <InfoRow label="双眼视功能要求" value={L.clinicalRules.binocularVisionReq} />
                  <InfoRow label="佩戴时长" value={L.clinicalRules.wearingDuration} />
                  <InfoRow label="初次适应期" value={L.clinicalRules.initialAdaptation} />
                  <InfoRow label="加工装配误差" value={L.clinicalRules.processingTolerance} />
                  <InfoRow label="复查周期" value={L.clinicalRules.reviewCycle} />
                </div>
              </TabItem>

              <TabItem label="价格与资料" value="mgmt">
                <div className="px-1">
                  <InfoRow
                    label="官方建议零售价"
                    value={
                      L.management.suggestedRetailPrice != null ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-brand-700">
                            ¥ {L.management.suggestedRetailPrice.toLocaleString()}
                          </span>
                          {L.management.priceNote && (
                            <span className="text-xs text-slate-400">（{L.management.priceNote}）</span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )
                    }
                  />
                  <InfoRow label="排序权重" value={L.management.sortWeight} />
                  <InfoRow
                    label="资料来源附件"
                    value={
                      L.management.sourceDocs.length ? (
                        <div className="space-y-1.5">
                          {L.management.sourceDocs.map((d, i) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600"
                            >
                              <Tag color="brand" size="xs">
                                {d.type === 'whitepaper' ? '白皮书' : d.type === 'clinical' ? '临床文献' : '链接资料'}
                              </Tag>
                              <span className="font-medium">{d.name}</span>
                              {d.url && <span className="text-xs text-brand-600">查看</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )
                    }
                  />
                  <InfoRow label="创建时间" value={L.createdAt} />
                  <InfoRow label="最近更新时间" value={L.management.updatedAt} />
                </div>
              </TabItem>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
