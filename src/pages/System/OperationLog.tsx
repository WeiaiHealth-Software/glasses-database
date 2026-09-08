import React, { useEffect, useState, useCallback } from 'react';
import {
  RotateCcw, Filter, ClipboardList, MonitorCog, RefreshCw,
  LogIn, Plus, Pencil, Trash2, Download,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, Pagination } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import type { OperationLog as IOperationLog, OperationAction } from '../../types/system';
import { ACTION_LABEL, OPERATION_MODULES } from '../../types/system';
import { OperationLogService } from '../../services/system.service';
import type { ListQuery } from '../../services/request';

const ACTION_ICON: Record<OperationAction, typeof LogIn> = {
  login: LogIn,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  export: Download,
};
const ACTION_COLOR: Record<OperationAction, 'brand' | 'emerald' | 'amber' | 'red' | 'violet'> = {
  login: 'brand',
  create: 'emerald',
  update: 'amber',
  delete: 'red',
  export: 'violet',
};

export default function OperationLogPage() {
  const [rows, setRows] = useState<IOperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<OperationAction | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [stats, setStats] = useState<{
    totalOps: number;
    uniqueOps: number;
    creates: number;
    updates: number;
    deletes: number;
    logins: number;
  }>({ totalOps: 0, uniqueOps: 0, creates: 0, updates: 0, deletes: 0, logins: 0 });

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: ListQuery & {
        module?: string;
        action?: OperationAction;
        dateFrom?: string;
        dateTo?: string;
      } = { page, pageSize, keyword };
      if (moduleFilter !== 'all') query.module = moduleFilter;
      if (actionFilter !== 'all') query.action = actionFilter as OperationAction;
      if (dateFrom) query.dateFrom = dateFrom;
      if (dateTo) query.dateTo = dateTo;
      const res = await OperationLogService.page(query);
      if (res.code === 0) {
        setRows(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, moduleFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadStats = useCallback(async () => {
    const res = await OperationLogService.page({ page: 1, pageSize: 500 });
    if (res.code === 0) {
      const l = res.data.list;
      const uniq = new Set(l.map((x) => x.operatorId)).size;
      setStats({
        totalOps: res.data.total,
        uniqueOps: uniq,
        creates: l.filter((x) => x.action === 'create').length,
        updates: l.filter((x) => x.action === 'update').length,
        deletes: l.filter((x) => x.action === 'delete').length,
        logins: l.filter((x) => x.action === 'login').length,
      });
    }
  }, []);
  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const reset = () => {
    setKeyword('');
    setModuleFilter('all');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const statCards = [
    { label: '总操作数', value: stats.totalOps, icon: ClipboardList, color: 'brand' as const },
    { label: '活跃操作人', value: stats.uniqueOps, icon: MonitorCog, color: 'violet' as const },
    { label: '新增', value: stats.creates, icon: Plus, color: 'emerald' as const },
    { label: '修改', value: stats.updates, icon: Pencil, color: 'amber' as const },
    { label: '删除', value: stats.deletes, icon: Trash2, color: 'red' as const },
    { label: '登录', value: stats.logins, icon: LogIn, color: 'brand' as const },
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
      <SpecCard
        title="操作日志 · 使用规范"
        items={[
          '日志为只读留痕，不可修改或删除；保留周期默认 90 天，超期自动归档。',
          '支持按模块、动作、操作人、操作对象、关键词及时间范围筛选；用于审计与追溯。',
          '删除、冻结、密码重置等关键动作均会写入日志，可结合 IP 与时间快速定位。',
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          const color = {
            brand: { bg: 'bg-brand-50', text: 'text-brand-600', icon: 'text-brand-600', border: 'border-brand-100' },
            violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-600', border: 'border-violet-100' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600', border: 'border-emerald-100' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-600', border: 'border-amber-100' },
            red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-600', border: 'border-red-100' },
          }[s.color];
          return (
            <div
              key={s.label}
              className={`rounded-2xl border ${color.border} ${color.bg} p-3 transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-semibold">{s.label}</span>
                <div className={`w-8 h-8 rounded-xl bg-white ${color.border} border flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-4 h-4 ${color.icon}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${color.text}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Filter className="w-4 h-4 text-brand-600" />
            筛选
          </div>
          <ToolbarDivider />
          <div className="w-64">
            <InputSearch
              placeholder="操作人 / 对象 / 详情关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => setPage(1)}
            />
          </div>
          <Select
            size="md"
            placeholder="模块"
            wrapperClassName="w-36"
            value={moduleFilter}
            onChange={(v) => {
              setModuleFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: '全部模块' },
              ...OPERATION_MODULES.map((m) => ({ value: m, label: m })),
            ]}
          />
          <Select
            size="md"
            placeholder="动作"
            wrapperClassName="w-32"
            value={actionFilter}
            onChange={(v) => {
              setActionFilter(v as OperationAction | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: '全部动作' },
              ...(Object.keys(ACTION_LABEL) as OperationAction[]).map((a) => ({
                value: a,
                label: ACTION_LABEL[a],
              })),
            ]}
          />
          <ToolbarDivider />
          <Input
            type="date"
            className="w-40 h-11 px-3"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-xs text-slate-400">至</span>
          <Input
            type="date"
            className="w-40 h-11 px-3"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
          <ToolbarDivider />
          <Button variant="icon" onClick={reset} title="重置筛选">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="icon" onClick={() => void load()} title="刷新">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-xs text-slate-500">
          共 <span className="font-bold text-brand-600 mx-1">{total}</span> 条记录
          · 只读不可修改
        </div>
      </ToolbarCard>

      <Table<IOperationLog>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        hoverable
        maxHeight={520}
        columns={[
          {
            key: 'createdAt',
            title: '时间',
            width: 170,
            render: (_v, l) => (
              <div className="font-mono text-xs text-slate-600">
                {l.createdAt?.slice(0, 19).replace('T', ' ') ?? '—'}
              </div>
            ),
          },
          {
            key: 'action',
            title: '动作',
            width: 110,
            align: 'center',
            render: (_v, l) => {
              const Icon = ACTION_ICON[l.action];
              return (
                <Tag color={ACTION_COLOR[l.action]} size="sm" className="inline-flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {ACTION_LABEL[l.action]}
                </Tag>
              );
            },
          },
          {
            key: 'module',
            title: '模块',
            width: 110,
            render: (_v, l) => (
              <Tag color="slate" size="sm">{l.module}</Tag>
            ),
          },
          {
            key: 'operator',
            title: '操作人',
            width: 200,
            render: (_v, l) => (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {l.operatorName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{l.operatorName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {l.operatorId}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'target',
            title: '操作对象',
            render: (_v, l) => (
              l.targetName ? (
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {l.targetName}
                  </div>
                  {l.targetId && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ID: {l.targetId}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )
            ),
          },
          {
            key: 'detail',
            title: '操作详情',
            render: (_v, l) => (
              <div className="text-xs text-slate-600 max-w-md truncate">
                {l.detail ?? '—'}
              </div>
            ),
          },
          {
            key: 'ip',
            title: 'IP',
            width: 130,
            align: 'center',
            render: (_v, l) => (
              <span className="text-xs text-slate-500 font-mono">
                {l.ip ?? '—'}
              </span>
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
