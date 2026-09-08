import React, { useState } from 'react';
import { Plus, Download, Search, Settings, Home, Filter, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Input, InputSearch, InputPassword } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select, MultiSelect, type SelectOption } from '../../components/ui/Select';
import { Tabs, TabItem } from '../../components/ui/Tabs';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { Table, Pagination, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Checkbox, Switch, RadioGroup } from '../../components/ui/Form';

interface DemoRow {
  id: string;
  lensName: string;
  brand: string;
  tech: string;
  defocus: string;
  status: 'online' | 'offline';
  updatedAt: string;
}

const techOptions: SelectOption[] = [
  { label: '多点离焦', value: 'multifocal_defocus' },
  { label: '环带微柱镜', value: 'annular_cylinder' },
  { label: '蜂窝点阵', value: 'honeycomb' },
  { label: '周边离焦', value: 'peripheral_defocus' },
  { label: '渐进多焦点', value: 'progressive' },
  { label: '双光棱镜', value: 'bifocal_prism' },
  { label: 'OK镜', value: 'ok_lens' },
  { label: '离焦软镜', value: 'defocus_soft' },
];

const demoRows: DemoRow[] = [
  { id: 'L001', lensName: '小乐圆 (MyoCare)', brand: '蔡司', tech: '环带微柱镜', defocus: '+3.50D', status: 'online', updatedAt: '2026-09-06 10:00' },
  { id: 'L002', lensName: '新乐学 (MiYOSMART)', brand: '豪雅', tech: '多点离焦', defocus: '+3.50D', status: 'online', updatedAt: '2026-09-05 14:30' },
  { id: 'L003', lensName: '星趣控 (Stellest)', brand: '依视路', tech: '微透镜星环', defocus: '+3.50D', status: 'online', updatedAt: '2026-09-04 09:15' },
  { id: 'L004', lensName: '轻松控 Pro', brand: '明月', tech: '多点离焦', defocus: '+3.00D', status: 'offline', updatedAt: '2026-09-03 16:45' },
  { id: 'L005', lensName: '蝶适 (DISC)', brand: '奥拉', tech: '同心环带离焦', defocus: '+4.00D', status: 'online', updatedAt: '2026-09-01 11:20' },
];

export default function UIShowcasePage() {
  const [formModal, setFormModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [tab, setTab] = useState('primary');
  const [techValue, setTechValue] = useState('');
  const [multiTech, setMultiTech] = useState<string[]>(['multifocal_defocus', 'annular_cylinder']);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [switchOn, setSwitchOn] = useState(true);
  const [checkAll, setCheckAll] = useState(false);
  const [radioValue, setRadioValue] = useState('stock');

  const columns = [
    {
      key: 'lensName',
      title: '镜片名称',
      dataIndex: 'lensName' as const,
      width: 220,
      render: (v: unknown) => <span className="font-bold text-slate-800">{v as string}</span>,
    },
    {
      key: 'brand',
      title: '品牌',
      dataIndex: 'brand' as const,
      render: (v: unknown) => <Tag color="brand" size="sm">{v as string}</Tag>,
    },
    { key: 'tech', title: '技术大类', dataIndex: 'tech' as const },
    { key: 'defocus', title: '离焦量', dataIndex: 'defocus' as const, render: (v: unknown) => <span className="font-medium text-slate-700">{v as string}</span> },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (v: unknown) =>
        v === 'online' ? (
          <Tag color="emerald">已上架</Tag>
        ) : (
          <Tag color="slate">已下架</Tag>
        ),
    },
    { key: 'updatedAt', title: '更新时间', dataIndex: 'updatedAt' as const, className: 'text-slate-500 text-xs' },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      width: 160,
      render: (_: unknown, r: DemoRow) => (
        <div className="flex items-center justify-end gap-3">
          <ActionEditBtn onClick={() => alert(`编辑 ${r.lensName}`)} />
          <ActionDeleteBtn onClick={() => setConfirmModal(true)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-8 bg-slate-50/50">
      <SpecCard
        title="UI 组件库示例 · 对齐 DESIGN.md 规范"
        items={[
          '所有组件严格遵循 DESIGN.md 的颜色令牌（brand-600 主色、slate 灰阶）、圆角（rounded-xl / rounded-2xl / rounded-3xl）与间距体系。',
          '业务开发优先复用本页组件，不允许在页面内联自定义样式。',
          '若发现组件缺少场景，先在此页添加示例，再提交修改。',
        ]}
      />

      {/* 1. Buttons */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          1. Button 按钮
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="default">普通按钮</Button>
            <Button variant="primary">主题按钮</Button>
            <Button variant="ghost">Ghost 按钮</Button>
            <Button variant="danger">危险按钮</Button>
            <Button variant="icon" aria-label="settings"><Settings className="w-4 h-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              新增
            </Button>
            <Button variant="default" rightIcon={<Download className="w-4 h-4" />}>
              导出数据
            </Button>
            <Button variant="primary" loading>
              加载中
            </Button>
            <Button variant="primary" disabled>
              已禁用
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Tags */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          2. Tag 标签
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Tag color="slate">Slate</Tag>
            <Tag color="brand">Brand</Tag>
            <Tag color="amber">Amber</Tag>
            <Tag color="orange">Orange</Tag>
            <Tag color="emerald">Emerald</Tag>
            <Tag color="violet">Violet</Tag>
            <Tag color="red">Red</Tag>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Tag color="brand" onClose={() => alert('removed')}>可关闭</Tag>
            <Tag color="emerald" size="xs">xs size</Tag>
            <Tag color="slate" size="sm">已上架</Tag>
            <Tag color="red" size="sm">已下架</Tag>
          </div>
        </div>
      </section>

      {/* 3. Input / Textarea */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          3. Input 输入框 / Textarea
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="基础输入" placeholder="请输入..." />
          <Input label="必填输入" required placeholder="必填字段" error="校验错误：字段不能为空" />
          <Input label="带图标" leftIcon={<Search className="w-4 h-4" />} placeholder="搜索关键词" />
          <InputSearch label="InputSearch 封装" placeholder="品牌/名称搜索..." />
          <InputPassword label="InputPassword 密码框" placeholder="请输入密码" />
          <Textarea label="备注" placeholder="请输入备注信息，默认 3 行..." rows={3} hint="最多支持 500 字" />
        </div>
      </section>

      {/* 4. Select */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          4. Select 选择器 / MultiSelect 多选
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="技术类型（单选）"
            options={techOptions}
            value={techValue}
            onChange={(v) => setTechValue(v)}
            placeholder="请选择技术类型"
            searchable
          />
          <MultiSelect
            label="技术类型（多选，最多3个标签回显）"
            options={techOptions}
            value={multiTech}
            onChange={(v) => setMultiTech(v)}
            searchable
            maxTagCount={3}
          />
        </div>
      </section>

      {/* 5. Form: Checkbox / Switch / Radio */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          5. Checkbox / Switch / Radio
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 mb-2">Checkbox</div>
            <Checkbox checked={checkAll} onChange={setCheckAll} label="全选" indeterminate />
            <Checkbox label="选项 A：临床数据完整" defaultChecked />
            <Checkbox label="选项 B：支持大散光定制" />
            <Checkbox label="已禁用" disabled />
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 mb-2">Switch</div>
            <Switch checked={switchOn} onChange={setSwitchOn} label="上架状态" />
            <Switch label="首页推荐（已关闭）" />
            <Switch label="已禁用" disabled />
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 mb-2">RadioGroup</div>
            <RadioGroup
              value={radioValue}
              onChange={setRadioValue}
              options={[
                { label: '现货镜片', value: 'stock', description: '常规库存，3天内可发' },
                { label: '定制镜片', value: 'custom', description: '按处方定制，7-15天' },
              ]}
            />
            <RadioGroup
              variant="button"
              defaultValue="all"
              options={[
                { label: '全部', value: 'all' },
                { label: '已上架', value: 'online' },
                { label: '已下架', value: 'offline' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 6. Tabs */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          6. Tabs 切换
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">Primary（分段按钮式）</div>
            <Tabs
              variant="primary"
              defaultValue="primary"
              value={tab}
              onChange={setTab}
              size="sm"
            >
              <TabItem label="基础信息" value="primary">
                <div className="text-sm text-slate-600 p-4 bg-brand-50/60 rounded-xl border border-brand-100">
                  基础信息面板内容：品牌、名称、系列、技术大类...
                </div>
              </TabItem>
              <TabItem label="核心参数" value="core">
                <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  核心参数面板：离焦量、中心光学区、离焦环数量...
                </div>
              </TabItem>
              <TabItem label="临床铁律" value="clinical" badge={<Tag color="red" size="xs">必填</Tag>}>
                <div className="text-sm text-slate-600 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  临床铁律：验光原则 / 双眼视 / 佩戴时长 / 适应期 / 复查周期...
                </div>
              </TabItem>
              <TabItem label="已禁用Tab" value="disabled" disabled />
            </Tabs>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">Secondary（线标式，轻量分区）</div>
            <Tabs variant="secondary" defaultValue="doctor">
              <TabItem label="医生专业版" value="doctor">
                <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                  参数规整严肃：离焦量 +3.50D | 中心光学区 φ=4mm | 离焦环 1024 点
                </div>
              </TabItem>
              <TabItem label="家长通俗版" value="parent">
                <div className="text-sm text-slate-600 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  通俗易懂：本镜片已被临床证实可帮助孩子有效延缓近视加深约 60%。
                </div>
              </TabItem>
            </Tabs>
          </div>
        </div>
      </section>

      {/* 7. Modal */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          7. Modal 弹窗
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setFormModal(true)}>
            新增/编辑弹窗
          </Button>
          <Button variant="danger" onClick={() => setConfirmModal(true)} leftIcon={<Trash2 className="w-4 h-4" />}>
            删除二次确认
          </Button>
          <Button variant="default" onClick={() => setSuccessModal(true)}>
            成功提示弹窗
          </Button>
        </div>
      </section>

      {/* 8. ToolbarCard + Table + Pagination */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-600 rounded-sm" />
          8. ToolbarCard / Table / Pagination（完整表格页）
        </h2>
        <div className="space-y-4">
          <ToolbarCard>
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-72">
                <InputSearch placeholder="搜索镜片/品牌/技术" />
              </div>
              <RadioGroup
                variant="button"
                defaultValue="all"
                options={[
                  { label: '全部', value: 'all' },
                  { label: '已上架', value: 'online' },
                  { label: '已下架', value: 'offline' },
                ]}
              />
              <Button variant="default" leftIcon={<Filter className="w-4 h-4" />}>高级筛选</Button>
              <Button variant="ghost">重置</Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="default" leftIcon={<Download className="w-4 h-4" />}>导出</Button>
              <ToolbarDivider />
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>录入新镜片</Button>
            </div>
          </ToolbarCard>
          <Table<DemoRow>
            columns={columns}
            dataSource={demoRows}
            rowKey="id"
            hoverable
          />
          <Pagination
            current={page}
            pageSize={pageSize}
            total={156}
            onChange={(p, s) => { setPage(p); setPageSize(s); }}
            className="rounded-2xl border border-slate-100 shadow-sm"
          />
        </div>
      </section>

      {/* Modals */}
      <Modal
        open={formModal}
        onClose={() => setFormModal(false)}
        title="录入新镜片"
        description="所有带 * 的字段为必填；近视控制有效率必须同步填写数据来源。"
        size="lg"
        confirmText="确认录入"
        onConfirm={() => {
          setFormModal(false);
          setSuccessModal(true);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="镜片完整名称" required placeholder="例如：星趣控 (Stellest)" wrapperClassName="md:col-span-2" />
          <Select
            label="品牌名称"
            required
            options={[
              { label: '蔡司', value: 'zeiss' },
              { label: '豪雅', value: 'hoya' },
              { label: '依视路', value: 'essilor' },
            ]}
            placeholder="请选择品牌"
          />
          <Input label="产品系列" placeholder="例如：星趣控 A+" />
          <Select
            label="技术大类"
            required
            options={techOptions}
            placeholder="请选择"
            searchable
          />
          <Input label="离焦量 (D值)" required placeholder="例如：+3.50D" hint="带符号填写" />
          <Textarea label="备注（临床数据摘要）" rows={3} wrapperClassName="md:col-span-2" />
        </div>
      </Modal>

      <ConfirmModal
        open={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={() => setConfirmModal(false)}
        title="确认删除这款镜片？"
        description="删除后镜片将被软删除，后台仍可追溯，但不会在小程序端展示。操作不可恢复。"
        confirmText="确认删除"
        danger
      />

      <Modal
        open={successModal}
        onClose={() => setSuccessModal(false)}
        type="success"
        title="操作成功"
        description="镜片数据已成功录入，当前状态为「已下架」，您可以随时调整状态上架。"
        size="sm"
        hideCancel
        confirmText="好的，知道了"
        onConfirm={() => setSuccessModal(false)}
      />
    </div>
  );
}
