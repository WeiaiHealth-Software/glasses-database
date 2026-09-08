import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Download, Filter, Eye, Star, StarOff } from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { RadioGroup, Switch } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { LensDrawer } from '../../components/business/LensDrawer';
import { LensFormModal } from '../../components/business/LensFormModal';
import { ConfirmModal } from '../../components/ui/Modal';
import type { Lens } from '../../types/lens';
import type { SelectOption } from '../../components/ui/Select';
import { LensService, nameOfBrand, nameOfTech } from '../../services/lens.service';
import { BrandService, TechTagService } from '../../services/dictionary.service';
import type { ListQuery } from '../../services/request';

export default function LensDatabasePage() {
  const [rows, setRows] = useState<Lens[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [techOptions, setTechOptions] = useState<SelectOption[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLens, setFormLens] = useState<Lens | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lens | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: ListQuery = { page, pageSize, keyword, brandId: brandFilter, techId: techFilter, status: statusTab };
      if (onlyRecommended) query.recommended = true;
      const res = await LensService.page(query);
      if (res.code === 0) {
        setRows(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, brandFilter, techFilter, statusTab, onlyRecommended]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const [b, t] = await Promise.all([BrandService.all(), TechTagService.allByCategory('tech_category')]);
      if (b.code === 0) setBrandOptions([{ label: '全部品牌', value: 'all' }, ...b.data.map((x) => ({ label: x.name, value: x.id }))]);
      if (t.code === 0) setTechOptions([{ label: '全部技术', value: 'all' }, ...t.data.map((x) => ({ label: x.name, value: x.id }))]);
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const ok = (msg: string) => setToast({ type: 'success', msg });
  const err = (msg: string) => setToast({ type: 'error', msg });

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const openAdd = () => {
    setFormLens(null);
    setFormOpen(true);
  };
  const openEdit = (lens: Lens) => {
    setFormLens(lens);
    setFormOpen(true);
  };
  const confirmDelete = (lens: Lens) => {
    setDeleteTarget(lens);
    setDeleteOpen(true);
  };

  const handleSubmit = async (payload: Omit<Lens, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
    if (id) {
      const res = await LensService.update(id, payload);
      if (res.code === 0) ok(`已更新镜片「${res.data.baseInfo.fullName}」`);
      else err(res.message);
    } else {
      const res = await LensService.create(payload);
      if (res.code === 0) ok(`已成功录入「${res.data.baseInfo.fullName}」`);
      else err(res.message);
    }
    setFormOpen(false);
    void load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await LensService.remove(deleteTarget.id);
    if (res.code === 0) ok(`已软删除「${deleteTarget.baseInfo.fullName}」`);
    else err(res.message);
    setDeleteOpen(false);
    setDeleteTarget(null);
    void load();
  };

  const toggleStatus = async (lens: Lens) => {
    const res = await LensService.toggleStatus(lens.id);
    if (res.code === 0) ok(`已${res.data.management.status === 'online' ? '上架' : '下架'}「${lens.baseInfo.fullName}」`);
    else err(res.message);
    void load();
  };
  const toggleRecommend = async (lens: Lens) => {
    const res = await LensService.toggleRecommended(lens.id);
    if (res.code === 0) ok(lens.management.isHomepageRecommended ? '已取消首页推荐' : '已加入首页推荐');
    else err(res.message);
    void load();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-full relative">
      <SpecCard
        title="镜片数据库 · 业务规范"
        items={[
          '所有镜片采用「软删除」机制（softDeleted），删除后保留底层数据；列表页默认不展示软删除记录。',
          '近视控制有效率与数据来源为强绑定字段：填写有效率则必须同步标注数据来源，表单校验不通过无法保存。',
          '「上下架」与「首页推荐」可在列表行与详情抽屉中快速操作，变更会实时同步到小程序端。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-72">
            <InputSearch placeholder="镜片/品牌/技术/系列搜索..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <RadioGroup
            variant="button"
            value={statusTab}
            onChange={setStatusTab}
            options={[
              { label: `全部 (${total})`, value: 'all' },
              { label: '已上架', value: 'online' },
              { label: '已下架', value: 'offline' },
            ]}
          />
          <Select size="sm" options={brandOptions} value={brandFilter} onChange={setBrandFilter} placeholder="品牌" />
          <Select size="sm" options={techOptions} value={techFilter} onChange={setTechFilter} placeholder="技术大类" />
          <Switch label="仅看首页推荐" checked={onlyRecommended} onChange={setOnlyRecommended} />
          <Button size="sm" variant="ghost" leftIcon={<Filter className="w-4 h-4" />} onClick={() => {
            setKeyword(''); setBrandFilter('all'); setTechFilter('all'); setOnlyRecommended(false); setStatusTab('all'); setPage(1);
          }}>重置</Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" leftIcon={<Download className="w-4 h-4" />}>
            导出数据
          </Button>
          <ToolbarDivider />
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
            录入新镜片
          </Button>
        </div>
      </ToolbarCard>

      <div className="space-y-0">
        <Table<Lens>
          loading={loading}
          columns={[
            {
              key: 'name',
              title: '镜片名称',
              width: 260,
              render: (_v, r) => (
                <div className="min-w-[200px]">
                  <div
                    className="font-bold text-slate-800 leading-snug cursor-pointer hover:text-brand-600 transition-colors inline-flex items-center gap-1.5"
                    onClick={() => openDetail(r.id)}
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {r.baseInfo.fullName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">
                    {r.baseInfo.series} · ID {r.id}
                  </div>
                </div>
              ),
            },
            {
              key: 'brand',
              title: '品牌',
              dataIndex: 'id',
              render: (_v, r) => (
                <Tag color="brand" size="sm">
                  {nameOfBrand(r.baseInfo.brandId)}
                </Tag>
              ),
            },
            {
              key: 'tech',
              title: '技术大类',
              render: (_v, r) => (
                <div className="text-sm text-slate-600">{nameOfTech(r.baseInfo.techCategoryId)}</div>
              ),
            },
            {
              key: 'defocus',
              title: '离焦量',
              render: (_v, r) => (
                <span className="font-bold text-slate-700">{r.coreParams.defocusValue ?? '-'}</span>
              ),
            },
            {
              key: 'supply',
              title: '供货属性',
              render: (_v, r) =>
                r.supplyProfile.type === 'stock' ? (
                  <Tag color="emerald" size="sm">现货</Tag>
                ) : (
                  <Tag color="brand" size="sm">定制</Tag>
                ),
            },
            {
              key: 'price',
              title: '指导价',
              align: 'right',
              render: (_v, r) =>
                r.management.suggestedRetailPrice != null ? (
                  <span className="text-slate-700 font-bold text-right block">
                    ¥ {r.management.suggestedRetailPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-slate-300">-</span>
                ),
            },
            {
              key: 'status',
              title: '状态',
              render: (_v, r) => (
                <div className="flex flex-col gap-1.5">
                  {r.management.status === 'online' ? (
                    <Tag color="emerald" size="sm">已上架</Tag>
                  ) : (
                    <Tag color="slate" size="sm">已下架</Tag>
                  )}
                  {r.management.isHomepageRecommended && (
                    <Tag color="amber" size="xs">
                      <Star className="w-3 h-3 fill-amber-500 mr-0.5" />
                      首页推荐
                    </Tag>
                  )}
                </div>
              ),
            },
            {
              key: 'updatedAt',
              title: '更新时间',
              className: 'text-slate-500 text-xs',
              render: (_v, r) => r.management.updatedAt,
            },
            {
              key: 'actions',
              title: '操作',
              align: 'right',
              width: 260,
              render: (_v, r) => (
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <button
                    onClick={() => openDetail(r.id)}
                    className="cursor-pointer px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    详情
                  </button>
                  <button
                    onClick={() => toggleRecommend(r)}
                    title={r.management.isHomepageRecommended ? '取消首页推荐' : '加入首页推荐'}
                    className={`cursor-pointer w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                      r.management.isHomepageRecommended
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    {r.management.isHomepageRecommended ? (
                      <Star className="w-4 h-4 fill-amber-500" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </button>
                  <ActionEditBtn onClick={() => openEdit(r)} />
                  <ActionDeleteBtn onClick={() => confirmDelete(r)} />
                </div>
              ),
            },
          ]}
          dataSource={rows}
          rowKey="id"
          hoverable
          className="rounded-none border-t-0"
        />
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={(p, s) => {
            setPage(p);
            setPageSize(s);
          }}
          className="rounded-b-2xl border border-slate-100 border-t-0 shadow-sm"
        />
      </div>

      <LensDrawer
        open={detailOpen}
        lensId={detailId}
        onClose={() => setDetailOpen(false)}
        onEdit={(l) => {
          setDetailOpen(false);
          openEdit(l);
        }}
        onToggleStatus={async (l) => {
          await toggleStatus(l);
          setDetailId(l.id);
        }}
        onToggleRecommend={async (l) => {
          await toggleRecommend(l);
          setDetailId(l.id);
        }}
      />

      <LensFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        lens={formLens}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        danger
        title="确认删除这款镜片？"
        description={
          deleteTarget ? (
            <span>
              镜片「<span className="font-bold text-slate-700">{deleteTarget.baseInfo.fullName}</span>
              」将被<strong>软删除</strong>（保留底层数据），小程序端不再展示；如需彻底删除请执行数据库清理脚本。
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
