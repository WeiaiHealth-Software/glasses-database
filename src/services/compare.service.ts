import type { Lens } from '../types/lens';
import { nameOfBrand, nameOfTech } from './lens.service';

export type CompareMode = 'parent' | 'doctor';

export interface CompareSection {
  section: string;
  group: string;
  rows: CompareRow[];
}

export interface CompareRow {
  key: string;
  label: string;
  hint?: string;
  values: (React.ReactNode | { text: string; highlighted?: boolean; warn?: boolean })[];
  hasDiff?: boolean;
}

export function formatRate(value?: string): string {
  return value ? `${value}%` : '—';
}
export function formatAge(min?: number, max?: number): string {
  if (min != null && max != null) return `${min} – ${max} 岁`;
  if (min != null) return `≥ ${min} 岁`;
  if (max != null) return `≤ ${max} 岁`;
  return '—';
}
export function formatRange(min?: number, max?: number, suffix = ''): string {
  if (min != null && max != null) return `${min}${suffix} ~ ${max}${suffix}`;
  if (min != null) return `≥ ${min}${suffix}`;
  if (max != null) return `≤ ${max}${suffix}`;
  return '—';
}
export function formatBool(v?: boolean, yes = '支持', no = '不支持'): string {
  if (v == null) return '—';
  return v ? yes : no;
}
export function formatNum(v?: number, suffix = ''): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v}${suffix}`;
}
export function formatYear(v?: number): string {
  return v ? `${v} 年` : '—';
}
export function formatPrice(v?: number): string {
  return v ? `¥ ${v.toLocaleString()}` : '—';
}

function pickAll<T>(list: Lens[], getter: (l: Lens) => T): T[] {
  return list.map(getter);
}
function hasDiff<T extends string | number | boolean | undefined>(values: T[]): boolean {
  const norm = values.map((v) => (v == null ? '$$EMPTY$$' : v));
  return new Set(norm).size > 1;
}
function hasStrDiff(values: (string | undefined)[]): boolean {
  return new Set(values.map((v) => (v?.trim() ?? '') + '$$')).size > 1;
}

export function buildDoctorSections(lenses: Lens[]): CompareSection[] {
  const brandVals = pickAll(lenses, (l) => nameOfBrand(l.baseInfo.brandId));
  const techVals = pickAll(lenses, (l) => nameOfTech(l.baseInfo.techCategoryId));
  return [
    {
      section: '基础信息',
      group: 'base',
      rows: [
        {
          key: 'base.fullName',
          label: '镜片完整名称',
          values: lenses.map((l) => ({ text: l.baseInfo.fullName })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.baseInfo.fullName)),
        },
        {
          key: 'base.brandId',
          label: '品牌',
          values: brandVals.map((t) => ({ text: t })),
          hasDiff: hasDiff(brandVals as never),
        },
        {
          key: 'base.series',
          label: '系列/款',
          values: lenses.map((l) => ({ text: l.baseInfo.series ?? '—' })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.baseInfo.series)),
        },
        {
          key: 'base.techCategoryId',
          label: '技术大类',
          values: techVals.map((t) => ({ text: t })),
          hasDiff: hasDiff(techVals as never),
        },
        {
          key: 'base.launchYear',
          label: '上市年份',
          values: lenses.map((l) => ({ text: formatYear(l.baseInfo.launchYear) })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.baseInfo.launchYear)),
        },
        {
          key: 'base.techStructure',
          label: '技术结构',
          values: lenses.map((l) => ({ text: l.baseInfo.techStructure ?? '—' })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.baseInfo.techStructure)),
        },
        {
          key: 'base.material',
          label: '镜片材料',
          values: lenses.map((l) => ({ text: l.baseInfo.material ?? '—' })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.baseInfo.material)),
        },
        {
          key: 'base.refractiveIndex',
          label: '折射率',
          values: lenses.map((l) => ({ text: l.baseInfo.refractiveIndex ?? '—' })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.baseInfo.refractiveIndex)),
        },
        {
          key: 'base.standardCoating',
          label: '标配膜层',
          values: lenses.map((l) => ({ text: l.baseInfo.standardCoating ?? '—' })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.baseInfo.standardCoating)),
        },
        {
          key: 'base.upgradeCoatings',
          label: '可选升级膜层',
          values: lenses.map((l) => ({
            text: (l.baseInfo.upgradeCoatings && l.baseInfo.upgradeCoatings.length > 0)
              ? l.baseInfo.upgradeCoatings.join(' / ')
              : '—',
          })),
          hasDiff: hasStrDiff(
            lenses.map((l) => (l.baseInfo.upgradeCoatings ?? []).join('|')),
          ),
        },
      ],
    },
    {
      section: '核心参数',
      group: 'core',
      rows: [
        {
          key: 'core.myopiaControlRate',
          label: '近视控制有效率',
          hint: '数值越高，临床研究中对眼轴/等效球镜的延缓越强',
          values: lenses.map((l) => ({
            text: formatRate(l.coreParams.myopiaControlRate),
            highlighted: !!l.coreParams.myopiaControlRate,
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.coreParams.myopiaControlRate)),
        },
        {
          key: 'core.myopiaControlSource',
          label: '控制有效率 · 数据来源',
          values: lenses.map((l) => ({
            text: l.coreParams.myopiaControlSource ?? '—',
            warn: !!(
              l.coreParams.myopiaControlRate && !l.coreParams.myopiaControlSource
            ),
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.coreParams.myopiaControlSource)),
        },
        {
          key: 'core.defocusValue',
          label: '离焦量',
          values: lenses.map((l) => ({ text: l.coreParams.defocusValue ?? '—' })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.coreParams.defocusValue)),
        },
        {
          key: 'core.centerOpticDiameter',
          label: '中心光学区直径',
          values: lenses.map((l) => ({
            text: formatNum(l.coreParams.centerOpticDiameter, ' mm'),
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.coreParams.centerOpticDiameter)),
        },
        {
          key: 'core.defocusRingCount',
          label: '离焦环 / 微结构数量',
          values: lenses.map((l) => ({
            text: formatNum(l.coreParams.defocusRingCount, ' 环/点'),
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.coreParams.defocusRingCount)),
        },
        {
          key: 'core.astigmatismMax',
          label: '适配最大散光',
          values: lenses.map((l) => ({
            text: formatNum(l.coreParams.astigmatismMax, ' D'),
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.coreParams.astigmatismMax)),
        },
        {
          key: 'core.recommendedAge',
          label: '建议适配年龄',
          values: lenses.map((l) => ({
            text: formatAge(l.coreParams.recommendedAgeMin, l.coreParams.recommendedAgeMax),
          })),
          hasDiff:
            hasDiff(pickAll(lenses, (l) => l.coreParams.recommendedAgeMin)) ||
            hasDiff(pickAll(lenses, (l) => l.coreParams.recommendedAgeMax)),
        },
        {
          key: 'core.myopiaRange',
          label: '建议近视度数范围',
          values: lenses.map((l) => ({
            text: formatRange(l.coreParams.myopiaRangeMin, l.coreParams.myopiaRangeMax, ' D'),
          })),
          hasDiff:
            hasDiff(pickAll(lenses, (l) => l.coreParams.myopiaRangeMin)) ||
            hasDiff(pickAll(lenses, (l) => l.coreParams.myopiaRangeMax)),
        },
      ],
    },
    {
      section: '供货与适配',
      group: 'supply',
      rows: [
        {
          key: 'supply.type',
          label: '供货类型',
          values: lenses.map((l) => ({
            text: l.supplyProfile.type === 'stock' ? '现货片' : '定制片',
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.supplyProfile.type)),
        },
        {
          key: 'supply.standardLeadTime',
          label: '常规交期',
          values: lenses.map((l) => ({
            text: l.supplyProfile.standardLeadTime ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.supplyProfile.standardLeadTime)),
        },
        {
          key: 'supply.highAstigmatismSupport',
          label: '高散光支持',
          values: lenses.map((l) => ({
            text: formatBool(l.supplyProfile.highAstigmatismSupport),
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.supplyProfile.highAstigmatismSupport)),
        },
        {
          key: 'supply.highMyopiaSupport',
          label: '高度数支持',
          values: lenses.map((l) => ({
            text: formatBool(l.supplyProfile.highMyopiaSupport),
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.supplyProfile.highMyopiaSupport)),
        },
        {
          key: 'supply.fitCharacteristics',
          label: '适配特征要点',
          values: lenses.map((l) => ({
            text: l.supplyProfile.fitCharacteristics ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.supplyProfile.fitCharacteristics)),
        },
        {
          key: 'supply.absoluteContraindications',
          label: '绝对禁忌症',
          values: lenses.map((l) => ({
            text: l.supplyProfile.absoluteContraindications ?? '—',
            warn: !!l.supplyProfile.absoluteContraindications,
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.supplyProfile.absoluteContraindications)),
        },
        {
          key: 'supply.cautionConditions',
          label: '谨慎使用 / 需告知家属',
          values: lenses.map((l) => ({
            text: l.supplyProfile.cautionConditions ?? '—',
            warn: !!l.supplyProfile.cautionConditions,
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.supplyProfile.cautionConditions)),
        },
      ],
    },
    {
      section: '临床验配铁律',
      group: 'clinical',
      rows: [
        {
          key: 'clinical.refractionPrinciple',
          label: '验光与配镜原则',
          values: lenses.map((l) => ({
            text: l.clinicalRules.refractionPrinciple ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.clinicalRules.refractionPrinciple)),
        },
        {
          key: 'clinical.binocularVisionReq',
          label: '双眼视功能要求',
          values: lenses.map((l) => ({
            text: l.clinicalRules.binocularVisionReq ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.clinicalRules.binocularVisionReq)),
        },
        {
          key: 'clinical.wearingDuration',
          label: '每日建议配戴时长',
          values: lenses.map((l) => ({
            text: l.clinicalRules.wearingDuration ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.clinicalRules.wearingDuration)),
        },
        {
          key: 'clinical.initialAdaptation',
          label: '初期适应期说明',
          values: lenses.map((l) => ({
            text: l.clinicalRules.initialAdaptation ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.clinicalRules.initialAdaptation)),
        },
        {
          key: 'clinical.processingTolerance',
          label: '加工 / 点瞳公差',
          values: lenses.map((l) => ({
            text: l.clinicalRules.processingTolerance ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.clinicalRules.processingTolerance)),
        },
        {
          key: 'clinical.reviewCycle',
          label: '建议复查周期',
          values: lenses.map((l) => ({
            text: l.clinicalRules.reviewCycle ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.clinicalRules.reviewCycle)),
        },
      ],
    },
    {
      section: '价格与参考资料',
      group: 'manage',
      rows: [
        {
          key: 'manage.suggestedRetailPrice',
          label: '建议零售价（单副）',
          values: lenses.map((l) => ({
            text: formatPrice(l.management.suggestedRetailPrice),
            highlighted: !!l.management.suggestedRetailPrice,
          })),
          hasDiff: hasDiff(pickAll(lenses, (l) => l.management.suggestedRetailPrice)),
        },
        {
          key: 'manage.priceNote',
          label: '价格说明',
          values: lenses.map((l) => ({
            text: l.management.priceNote ?? '—',
          })),
          hasDiff: hasStrDiff(pickAll(lenses, (l) => l.management.priceNote)),
        },
        {
          key: 'manage.sourceDocs',
          label: '资料来源数量',
          hint: '白皮书 / 临床研究 / 官方链接',
          values: lenses.map((l) => ({
            text: `${l.management.sourceDocs.length} 份`,
          })),
          hasDiff: hasDiff(lenses.map((l) => l.management.sourceDocs.length) as never),
        },
      ],
    },
  ];
}

export interface ParentSection {
  section: string;
  icon: 'heart' | 'shield' | 'clock' | 'wallet' | 'book';
  items: ParentItem[];
}
export interface ParentItem {
  key: string;
  title: string;
  desc: string;
  lensTexts: string[];
  warnPerLens: (boolean | undefined)[];
  bestIdx?: number;
}

export function buildParentSections(lenses: Lens[]): ParentSection[] {
  const ageBestIdx = (() => {
    const arr = lenses.map((l) => [l.coreParams.recommendedAgeMin ?? 99, l.coreParams.recommendedAgeMax ?? 0]);
    const scored = arr.map((a, i) => ({ i, s: (a[1] as number) - (a[0] as number) }));
    return scored.sort((a, b) => b.s - a.s)[0]?.i;
  })();
  const rateBestIdx = (() => {
    const arr = lenses.map((l) => Number(l.coreParams.myopiaControlRate) || 0);
    const max = Math.max(...arr);
    return arr.findIndex((v) => v === max);
  })();
  const priceBestIdx = (() => {
    const arr = lenses.map((l) => l.management.suggestedRetailPrice ?? Infinity);
    const min = Math.min(...arr);
    if (min === Infinity) return undefined;
    return arr.findIndex((v) => v === min);
  })();
  const warnAbs = lenses.map((l) => !!l.supplyProfile.absoluteContraindications);
  const warnCau = lenses.map((l) => !!l.supplyProfile.cautionConditions);
  return [
    {
      section: '它对孩子的效果怎样？',
      icon: 'heart',
      items: [
        {
          key: 'control',
          title: '近视控制有效率',
          desc: '数据越高，临床研究中近视加深越慢；注意每个品牌的数据来源不同，建议结合孩子情况咨询医生。',
          lensTexts: lenses.map((l) => {
            const r = l.coreParams.myopiaControlRate;
            const src = l.coreParams.myopiaControlSource;
            if (!r) return '暂无公开临床数据';
            return `${r}%（来源：${src ?? '未标注，请谨慎'}）`;
          }),
          warnPerLens: lenses.map(
            (l) => !!l.coreParams.myopiaControlRate && !l.coreParams.myopiaControlSource,
          ),
          bestIdx: rateBestIdx >= 0 && lenses[rateBestIdx].coreParams.myopiaControlRate
            ? rateBestIdx
            : undefined,
        },
        {
          key: 'ageFit',
          title: '适合多大的孩子？',
          desc: '年龄范围仅做参考，需要结合眼轴、度数进展速度由医生综合判断。',
          lensTexts: lenses.map((l) => {
            const s = formatAge(l.coreParams.recommendedAgeMin, l.coreParams.recommendedAgeMax);
            if (s === '—') return '未标注具体年龄范围';
            return `适合 ${s}`;
          }),
          warnPerLens: lenses.map(
            (l) => !(l.coreParams.recommendedAgeMin || l.coreParams.recommendedAgeMax),
          ),
          bestIdx: ageBestIdx,
        },
        {
          key: 'diopter',
          title: '能覆盖多少度？',
          desc: '一般来说，近视 400 度以内、散光 150 度以内是大多数品牌的主力区间。',
          lensTexts: lenses.map((l) => {
            const m = formatRange(l.coreParams.myopiaRangeMin, l.coreParams.myopiaRangeMax, ' D（近视）');
            const a = formatNum(l.coreParams.astigmatismMax, ' D（散光上限）');
            return `度数：${m}；散光上限：${a}`;
          }),
          warnPerLens: lenses.map(
            (l) => !(l.coreParams.myopiaRangeMin || l.coreParams.astigmatismMax),
          ),
        },
      ],
    },
    {
      section: '安全与佩戴要注意什么？',
      icon: 'shield',
      items: [
        {
          key: 'contra',
          title: '哪些情况不能戴？（绝对禁忌症）',
          desc: '以下情况需要严格避免，如存在其他眼病、全身病请一定先咨询医生。',
          lensTexts: lenses.map((l) =>
            l.supplyProfile.absoluteContraindications?.trim() || '品牌未单独列出禁忌症，按常规医学规范处理',
          ),
          warnPerLens: warnAbs,
        },
        {
          key: 'caution',
          title: '哪些情况需要家长特别留意？',
          desc: '注意孩子的佩戴习惯、眼干、视疲劳、点瞳位置是否准确，这些会直接影响效果。',
          lensTexts: lenses.map((l) =>
            l.supplyProfile.cautionConditions?.trim() || '暂无特殊提醒，请保持常规复查即可',
          ),
          warnPerLens: warnCau,
        },
        {
          key: 'review',
          title: '多久复查一次？',
          desc: '大多数品牌建议每 3~6 个月复查；若期间出现眼红眼痛请立即停戴并就医。',
          lensTexts: lenses.map((l) =>
            l.clinicalRules.reviewCycle?.trim() || '建议每 3~6 个月复查一次',
          ),
          warnPerLens: lenses.map((l) => !l.clinicalRules.reviewCycle),
        },
      ],
    },
    {
      section: '每天配戴多久？多久能拿到？',
      icon: 'clock',
      items: [
        {
          key: 'wear',
          title: '每天戴多久效果最好？',
          desc: '一般每天建议 ≥12 小时（OK镜除外，夜戴 8~10 小时），戴不满时控制效果会下降。',
          lensTexts: lenses.map((l) =>
            l.clinicalRules.wearingDuration?.trim() || '请遵循验光医师嘱咐',
          ),
          warnPerLens: lenses.map((l) => !l.clinicalRules.wearingDuration),
        },
        {
          key: 'lead',
          title: '下单后多久能拿到？',
          desc: '现货片通常 1~3 天；定制片尤其是高散光 / 高度数可能需要 7~15 天。',
          lensTexts: lenses.map((l) => {
            const t = l.supplyProfile.type === 'stock' ? '现货片' : '定制片';
            const d = l.supplyProfile.standardLeadTime ?? '按门店库存';
            return `${t}，常规 ${d}`;
          }),
          warnPerLens: lenses.map((l) => !l.supplyProfile.standardLeadTime),
        },
        {
          key: 'adapt',
          title: '刚戴上会不适应吗？',
          desc: '通常 1~2 周可以适应；如果持续头晕、眼疲劳，应立即回店核对度数和点瞳。',
          lensTexts: lenses.map((l) =>
            l.clinicalRules.initialAdaptation?.trim() || '一般 1~2 周可适应，不适请及时复查',
          ),
          warnPerLens: lenses.map((l) => !l.clinicalRules.initialAdaptation),
        },
      ],
    },
    {
      section: '大概要花多少钱？',
      icon: 'wallet',
      items: [
        {
          key: 'price',
          title: '建议零售价（单副，不含验光服务）',
          desc: '价格仅做参考，最终以门店实际报价为准；一般包含一次免费复查。',
          lensTexts: lenses.map((l) => formatPrice(l.management.suggestedRetailPrice)),
          warnPerLens: lenses.map((l) => !l.management.suggestedRetailPrice),
          bestIdx: priceBestIdx,
        },
        {
          key: 'priceNote',
          title: '价格包含什么？',
          desc: '有的品牌包含镜片+常规膜层，有的需要额外加钱升级防蓝光 / 加硬膜等。',
          lensTexts: lenses.map((l) =>
            l.management.priceNote?.trim() || '请以门店套餐说明为准',
          ),
          warnPerLens: lenses.map((l) => !l.management.priceNote),
        },
      ],
    },
    {
      section: '还有哪些参考资料？',
      icon: 'book',
      items: [
        {
          key: 'sources',
          title: '品牌提供了几份参考资料？',
          desc: '资料越多越容易做客观比较；包含白皮书、临床报告、官方链接等。',
          lensTexts: lenses.map((l) =>
            l.management.sourceDocs.length === 0
              ? '暂无标注的参考资料'
              : l.management.sourceDocs
                  .map(
                    (d, i) =>
                      `${i + 1}. ${
                        d.type === 'whitepaper' ? '白皮书' : d.type === 'clinical' ? '临床研究' : '官方链接'
                      }：${d.name}`,
                  )
                  .join('\n'),
          ),
          warnPerLens: lenses.map((l) => l.management.sourceDocs.length === 0),
          bestIdx: (() => {
            const max = Math.max(...lenses.map((l) => l.management.sourceDocs.length));
            if (max === 0) return undefined;
            return lenses.findIndex((l) => l.management.sourceDocs.length === max);
          })(),
        },
      ],
    },
  ];
}

