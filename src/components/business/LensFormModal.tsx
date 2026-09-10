/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Tabs, TabItem } from '../ui/Tabs';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, MultiSelect, type SelectOption } from '../ui/Select';
import { Tag } from '../ui/Tag';
import { Checkbox, Switch, RadioGroup } from '../ui/Form';
import { Button } from '../ui/Button';
import type { Lens, LensBaseInfo, LensCoreParams, LensSupplyProfile, LensClinicalRules, LensManagement, SourceDoc } from '../../types/lens';
import type { Brand, TechTag } from '../../types/dictionary';
import { BrandService, TechTagService } from '../../services/dictionary.service';
import { mockLensList } from '../../mocks/lens.mock';

interface LensFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<Lens, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void> | void;
  lens?: Lens | null;
}

interface FormErrors {
  [key: string]: string;
}

const emptyBaseInfo: LensBaseInfo = {
  fullName: '',
  brandId: '',
  series: '',
  launchYear: undefined,
  techCategoryId: '',
  techStructure: '',
  material: '',
  refractiveIndex: '',
  standardCoating: '',
  upgradeCoatings: [],
};

const emptyCore: LensCoreParams = {
  myopiaControlRate: '',
  myopiaControlSource: '',
  defocusValue: '',
  centerOpticDiameter: undefined,
  defocusRingCount: undefined,
  astigmatismMax: undefined,
  recommendedAgeMin: undefined,
  recommendedAgeMax: undefined,
  myopiaRangeMin: undefined,
  myopiaRangeMax: undefined,
};

const emptySupply: LensSupplyProfile = {
  type: 'stock',
  standardLeadTime: '',
  highAstigmatismSupport: false,
  highMyopiaSupport: false,
  fitCharacteristics: '',
  absoluteContraindications: '',
  cautionConditions: '',
};

const emptyClinical: LensClinicalRules = {
  refractionPrinciple: '',
  binocularVisionReq: '',
  wearingDuration: '',
  initialAdaptation: '',
  processingTolerance: '',
  reviewCycle: '',
};

const emptyMgmt: LensManagement = {
  suggestedRetailPrice: undefined,
  priceNote: '市场浮动，仅供参考，具体以门店为准',
  sourceDocs: [],
  isHomepageRecommended: false,
  sortWeight: 50,
  status: 'offline',
  softDeleted: false,
};

export const LensFormModal: React.FC<LensFormModalProps> = ({ open, onClose, onSubmit, lens }) => {
  const isEdit = !!lens;
  const [baseInfo, setBaseInfo] = useState<LensBaseInfo>(emptyBaseInfo);
  const [coreParams, setCoreParams] = useState<LensCoreParams>(emptyCore);
  const [supplyProfile, setSupplyProfile] = useState<LensSupplyProfile>(emptySupply);
  const [clinicalRules, setClinicalRules] = useState<LensClinicalRules>(emptyClinical);
  const [management, setManagement] = useState<LensManagement>(emptyMgmt);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [techCats, setTechCats] = useState<SelectOption[]>([]);
  const [techStructs, setTechStructs] = useState<SelectOption[]>([]);
  const [coatings, setCoatings] = useState<SelectOption[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [docDraft, setDocDraft] = useState<{ name: string; type: SourceDoc['type']; url?: string }>({
    name: '',
    type: 'whitepaper',
    url: '',
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitting(false);
    if (lens) {
      setBaseInfo(lens.baseInfo);
      setCoreParams(lens.coreParams);
      setSupplyProfile(lens.supplyProfile);
      setClinicalRules(lens.clinicalRules);
      setManagement(lens.management);
    } else {
      setBaseInfo(emptyBaseInfo);
      setCoreParams(emptyCore);
      setSupplyProfile(emptySupply);
      setClinicalRules(emptyClinical);
      setManagement({ ...emptyMgmt });
    }
    void (async () => {
      const [b, tc, ts, c] = await Promise.all([
        BrandService.all(),
        TechTagService.allByCategory('tech_category'),
        TechTagService.allByCategory('tech_structure'),
        TechTagService.allByCategory('coating'),
      ]);
      if (b.code === 0) setBrands(b.data.map((x: Brand) => ({ label: x.fullName ? `${x.name}（${x.fullName}）` : x.name, value: x.id })));
      if (tc.code === 0) setTechCats(tc.data.map((x: TechTag) => ({ label: x.name, value: x.id })));
      if (ts.code === 0) setTechStructs(ts.data.map((x: TechTag) => ({ label: x.name, value: x.id })));
      if (c.code === 0) setCoatings(c.data.map((x: TechTag) => ({ label: x.name, value: x.name })));
    })();
  }, [open, lens]);

  const setField =
    <K extends keyof LensBaseInfo>(key: K, v: LensBaseInfo[K]) =>
      setBaseInfo((p) => ({ ...p, [key]: v }));
  const setCore =
    <K extends keyof LensCoreParams>(key: K, v: LensCoreParams[K]) =>
      setCoreParams((p) => ({ ...p, [key]: v }));
  const setSupply =
    <K extends keyof LensSupplyProfile>(key: K, v: LensSupplyProfile[K]) =>
      setSupplyProfile((p) => ({ ...p, [key]: v }));
  const setClinical =
    <K extends keyof LensClinicalRules>(key: K, v: LensClinicalRules[K]) =>
      setClinicalRules((p) => ({ ...p, [key]: v }));
  const setMgmt =
    <K extends keyof LensManagement>(key: K, v: LensManagement[K]) =>
      setManagement((p) => ({ ...p, [key]: v }));

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!baseInfo.fullName.trim()) e['baseInfo.fullName'] = '请输入镜片完整名称';
    if (!baseInfo.brandId) e['baseInfo.brandId'] = '请选择品牌';
    if (!baseInfo.techCategoryId) e['baseInfo.techCategoryId'] = '请选择技术大类';
    if (coreParams.myopiaControlRate && !coreParams.myopiaControlSource?.trim()) {
      e['coreParams.myopiaControlSource'] = '填写了近视控制有效率必须同步标注数据来源';
    }
    return e;
  };

  const addDoc = () => {
    if (!docDraft.name.trim()) return;
    setManagement((p) => ({
      ...p,
      sourceDocs: [...p.sourceDocs, { ...docDraft }],
    }));
    setDocDraft({ name: '', type: 'whitepaper', url: '' });
  };

  const removeDoc = (idx: number) => {
    setManagement((p) => ({ ...p, sourceDocs: p.sourceDocs.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit(
        { baseInfo, coreParams, supplyProfile, clinicalRules, management },
        lens?.id
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillMock = () => {
    const sample = mockLensList[Math.floor(Math.random() * mockLensList.length)];
    setBaseInfo({ ...sample.baseInfo });
    setCoreParams({ ...sample.coreParams });
    setSupplyProfile({ ...sample.supplyProfile });
    setClinicalRules({ ...sample.clinicalRules });
    setManagement({ ...sample.management });
    setErrors({});
  };

  const grid = 'grid grid-cols-1 md:grid-cols-2 gap-4';

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      {!isEdit && (
        <Button variant="ghost" size="md" onClick={fillMock}>
          ✨ 一键 Mock 数据
        </Button>
      )}
      <div className="ml-auto flex gap-2">
        <Button variant="default" onClick={onClose} size="md">
          取消
        </Button>
        <Button variant="primary" loading={submitting} onClick={handleSubmit} size="md">
          {isEdit ? '保存修改' : '确认录入'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `编辑镜片：${lens?.baseInfo.fullName ?? ''}` : '录入新镜片'}
      description={
        !isEdit ? (
          <span className="text-xs">
            <AlertTriangle className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-amber-500" />
            所有带 <span className="text-red-500 font-bold">*</span> 的字段为必填；近视控制有效率必须同步填写数据来源
          </span>
        ) : undefined
      }
      size="xl"
      footer={renderFooter}
      hideFooter={false}
    >
      <div className="max-h-[70vh] overflow-y-auto -mx-7 -my-6 px-7 py-6">
        <Tabs variant="secondary" defaultValue="base">
          <TabItem label="① 基础信息" value="base">
            <div className="px-1 space-y-4">
              <Input
                label="镜片完整名称"
                required
                placeholder="例如：星趣控 (Stellest)"
                value={baseInfo.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
                error={errors['baseInfo.fullName']}
                wrapperClassName="md:col-span-2"
              />
              <div className={grid}>
                <Select
                  label="品牌名称"
                  options={brands}
                  value={baseInfo.brandId}
                  onChange={(v) => setField('brandId', v)}
                  placeholder="请选择品牌"
                  error={errors['baseInfo.brandId']}
                  searchable
                />
                <Input
                  label="产品系列"
                  placeholder="例如：星趣控 A+ 膜岩系列"
                  value={baseInfo.series ?? ''}
                  onChange={(e) => setField('series', e.target.value)}
                />
                <Input
                  label="上市年份"
                  type="number"
                  placeholder="例如：2022"
                  value={baseInfo.launchYear ?? ''}
                  onChange={(e) =>
                    setField('launchYear', e.target.value ? Number(e.target.value) : undefined)
                  }
                />
                <Select
                  label="技术大类 <span className='text-red-500'>*</span>"
                  options={techCats}
                  value={baseInfo.techCategoryId}
                  onChange={(v) => setField('techCategoryId', v)}
                  placeholder="请选择"
                  error={errors['baseInfo.techCategoryId']}
                  searchable
                />
                <Select
                  label="技术结构"
                  options={techStructs}
                  value={baseInfo.techStructure ?? ''}
                  onChange={(v) => setField('techStructure', v)}
                  placeholder="请选择技术结构"
                  searchable
                />
                <Input
                  label="镜片基材"
                  placeholder="例如：聚碳酸酯 / MR-8"
                  value={baseInfo.material ?? ''}
                  onChange={(e) => setField('material', e.target.value)}
                />
                <Input
                  label="标准折射率"
                  placeholder="例如：1.591 或 1.60"
                  value={baseInfo.refractiveIndex ?? ''}
                  onChange={(e) => setField('refractiveIndex', e.target.value)}
                />
                <Select
                  label="标配膜层"
                  options={coatings}
                  value={baseInfo.standardCoating ?? ''}
                  onChange={(v) => setField('standardCoating', v)}
                  placeholder="请选择"
                  searchable
                />
                <div className="md:col-span-2">
                  <MultiSelect
                    label="可选升级膜层"
                    options={coatings}
                    value={baseInfo.upgradeCoatings ?? []}
                    onChange={(v) => setField('upgradeCoatings', v)}
                    placeholder="可多选"
                  />
                </div>
              </div>
            </div>
          </TabItem>

          <TabItem label="② 核心参数" value="core">
            <div className={`px-1 ${grid}`}>
              <Input
                label="近视控制有效率"
                placeholder="例如：约 60% 或 ~67%"
                value={coreParams.myopiaControlRate ?? ''}
                onChange={(e) => setCore('myopiaControlRate', e.target.value)}
                hint="若填写则数据来源必填"
              />
              <Input
                label="数据来源"
                placeholder="例如：XX医院 RCT 2024"
                value={coreParams.myopiaControlSource ?? ''}
                onChange={(e) => setCore('myopiaControlSource', e.target.value)}
                error={errors['coreParams.myopiaControlSource']}
              />
              <Input
                label="离焦量 (D值)"
                placeholder="例如：+3.50D"
                value={coreParams.defocusValue ?? ''}
                onChange={(e) => setCore('defocusValue', e.target.value)}
              />
              <Input
                label="中心光学区直径 (mm)"
                type="number"
                step="0.1"
                placeholder="例如：4"
                value={coreParams.centerOpticDiameter ?? ''}
                onChange={(e) =>
                  setCore('centerOpticDiameter', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="离焦环/点位数量"
                type="number"
                placeholder="例如：1024"
                value={coreParams.defocusRingCount ?? ''}
                onChange={(e) =>
                  setCore('defocusRingCount', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="适配最大散光 (度)"
                type="number"
                placeholder="例如：400"
                value={coreParams.astigmatismMax ?? ''}
                onChange={(e) =>
                  setCore('astigmatismMax', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="适配年龄下限 (岁)"
                type="number"
                placeholder="例如：6"
                value={coreParams.recommendedAgeMin ?? ''}
                onChange={(e) =>
                  setCore('recommendedAgeMin', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="适配年龄上限 (岁)"
                type="number"
                placeholder="例如：18"
                value={coreParams.recommendedAgeMax ?? ''}
                onChange={(e) =>
                  setCore('recommendedAgeMax', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="最佳近视下限 (度)"
                type="number"
                placeholder="例如：-50"
                value={coreParams.myopiaRangeMin ?? ''}
                onChange={(e) =>
                  setCore('myopiaRangeMin', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="最佳近视上限 (度)"
                type="number"
                placeholder="例如：-600"
                value={coreParams.myopiaRangeMax ?? ''}
                onChange={(e) =>
                  setCore('myopiaRangeMax', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </TabItem>

          <TabItem label="③ 供货与适配" value="supply">
            <div className={`px-1 ${grid}`}>
              <div className="md:col-span-2">
                <div className="block text-xs font-bold text-slate-700 mb-1.5">
                  供货属性 <span className="text-red-500">*</span>
                </div>
                <RadioGroup
                  variant="button"
                  value={supplyProfile.type}
                  onChange={(v) => setSupply('type', v as 'stock' | 'custom')}
                  options={[
                    { label: '现货镜片', value: 'stock' },
                    { label: '定制镜片', value: 'custom' },
                  ]}
                />
              </div>
              <Input
                label="常规订货周期"
                placeholder="例如：现货 3 天内 / 定制 7-10 个工作日"
                value={supplyProfile.standardLeadTime ?? ''}
                onChange={(e) => setSupply('standardLeadTime', e.target.value)}
                wrapperClassName="md:col-span-2"
              />
              <Checkbox
                label="支持大散光定制"
                checked={supplyProfile.highAstigmatismSupport}
                onChange={(v) => setSupply('highAstigmatismSupport', v)}
              />
              <Checkbox
                label="支持高度数定制"
                checked={supplyProfile.highMyopiaSupport}
                onChange={(v) => setSupply('highMyopiaSupport', v)}
              />
              <Textarea
                label="适配人群特征"
                rows={2}
                wrapperClassName="md:col-span-2"
                value={supplyProfile.fitCharacteristics ?? ''}
                onChange={(e) => setSupply('fitCharacteristics', e.target.value)}
              />
              <Textarea
                label="绝对禁忌症"
                rows={2}
                wrapperClassName="md:col-span-2"
                value={supplyProfile.absoluteContraindications ?? ''}
                onChange={(e) => setSupply('absoluteContraindications', e.target.value)}
              />
              <Textarea
                label="谨慎适配人群"
                rows={2}
                wrapperClassName="md:col-span-2"
                value={supplyProfile.cautionConditions ?? ''}
                onChange={(e) => setSupply('cautionConditions', e.target.value)}
              />
            </div>
          </TabItem>

          <TabItem label="④ 临床验配铁律" value="clinical">
            <div className="px-1 space-y-3">
              <Textarea
                label="验光原则"
                rows={2}
                placeholder="足矫 / 常规足矫 / 特殊欠矫说明"
                value={clinicalRules.refractionPrinciple ?? ''}
                onChange={(e) => setClinical('refractionPrinciple', e.target.value)}
              />
              <Textarea
                label="双眼视功能要求"
                rows={2}
                placeholder="需满足的双眼视功能基线条件"
                value={clinicalRules.binocularVisionReq ?? ''}
                onChange={(e) => setClinical('binocularVisionReq', e.target.value)}
              />
              <Textarea
                label="佩戴时长要求"
                rows={2}
                placeholder="建议全天/日间/夜间佩戴的小时数"
                value={clinicalRules.wearingDuration ?? ''}
                onChange={(e) => setClinical('wearingDuration', e.target.value)}
              />
              <Textarea
                label="初次适应期"
                rows={2}
                placeholder="列明初次佩戴常见症状与持续时间"
                value={clinicalRules.initialAdaptation ?? ''}
                onChange={(e) => setClinical('initialAdaptation', e.target.value)}
              />
              <Textarea
                label="加工装配误差"
                rows={2}
                placeholder="明确瞳高/瞳距/轴位等误差范围"
                value={clinicalRules.processingTolerance ?? ''}
                onChange={(e) => setClinical('processingTolerance', e.target.value)}
              />
              <Textarea
                label="建议复查周期"
                rows={2}
                placeholder="首次复查 / 常规复查间隔"
                value={clinicalRules.reviewCycle ?? ''}
                onChange={(e) => setClinical('reviewCycle', e.target.value)}
              />
            </div>
          </TabItem>

          <TabItem label="⑤ 价格与管理" value="mgmt">
            <div className={`px-1 ${grid}`}>
              <Input
                label="官方建议零售价 (¥)"
                type="number"
                placeholder="例如：3980"
                value={management.suggestedRetailPrice ?? ''}
                onChange={(e) =>
                  setMgmt('suggestedRetailPrice', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <Input
                label="排序权重 (0-100)"
                type="number"
                placeholder="数值越大越靠前，默认 50"
                value={management.sortWeight}
                onChange={(e) =>
                  setMgmt('sortWeight', e.target.value ? Number(e.target.value) : 0)
                }
              />
              <Input
                label="价格备注"
                wrapperClassName="md:col-span-2"
                placeholder="市场浮动，仅供参考..."
                value={management.priceNote ?? ''}
                onChange={(e) => setMgmt('priceNote', e.target.value)}
              />
              <div className="md:col-span-2">
                <div className="block text-xs font-bold text-slate-700 mb-1.5">管理开关</div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Switch
                    label="上架状态（打开=已上架）"
                    checked={management.status === 'online'}
                    onChange={(v) => setMgmt('status', v ? 'online' : 'offline')}
                  />
                  <Switch
                    label="首页推荐"
                    checked={management.isHomepageRecommended}
                    onChange={(v) => setMgmt('isHomepageRecommended', v)}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="block text-xs font-bold text-slate-700 mb-2">资料来源（白皮书 / 临床文献 / 链接）</div>
                {management.sourceDocs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {management.sourceDocs.map((d, i) => (
                      <Tag key={i} color="brand" onClose={() => removeDoc(i)}>
                        <span className="opacity-70 mr-1">
                          {d.type === 'whitepaper' ? '白皮书' : d.type === 'clinical' ? '临床' : '链接'}
                        </span>
                        {d.name}
                      </Tag>
                    ))}
                  </div>
                )}
                <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-3 bg-slate-50/60">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="资料名称（如：星趣控白皮书）"
                      size="sm"
                      value={docDraft.name}
                      onChange={(e) => setDocDraft((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Select
                      size="sm"
                      options={[
                        { label: '品牌白皮书', value: 'whitepaper' },
                        { label: '临床文献', value: 'clinical' },
                        { label: '外部链接', value: 'link' },
                      ]}
                      value={docDraft.type}
                      onChange={(v) => setDocDraft((p) => ({ ...p, type: v as SourceDoc['type'] }))}
                    />
                    <Input
                      placeholder="URL（链接资料必填）"
                      size="sm"
                      value={docDraft.url ?? ''}
                      onChange={(e) => setDocDraft((p) => ({ ...p, url: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="primary" onClick={addDoc}>
                      + 添加资料
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabItem>
        </Tabs>
      </div>
    </Modal>
  );
};
