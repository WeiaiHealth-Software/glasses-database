import React from 'react';

export interface TableColumn<T> {
  key: string;
  title: React.ReactNode;
  dataIndex?: keyof T;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  className?: string;
  headClassName?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  emptyText?: React.ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  rowClassName?: (record: T, index: number) => string;
  onRowClick?: (record: T, index: number) => void;
  maxHeight?: number | string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  dataSource,
  rowKey,
  loading,
  emptyText = '暂无数据',
  hoverable = true,
  size = 'md',
  className = '',
  rowClassName,
  onRowClick,
  maxHeight,
}: TableProps<T>) {
  const getKey = (record: T, idx: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    const v = record[rowKey];
    return v != null ? String(v) : String(idx);
  };

  const cellPad = size === 'sm' ? 'px-4 py-3' : 'px-6 py-4';

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}
    >
      <div
        className="overflow-x-auto"
        style={maxHeight != null ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/90 backdrop-blur border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`${cellPad} font-semibold ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.headClassName ?? ''}`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`${cellPad} text-center text-slate-400`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    加载中...
                  </div>
                </td>
              </tr>
            ) : dataSource.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                      <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="text-sm">{emptyText}</div>
                  </div>
                </td>
              </tr>
            ) : (
              dataSource.map((record, idx) => {
                const key = getKey(record, idx);
                const extraCls = rowClassName?.(record, idx) ?? '';
                const clickable = !!onRowClick;
                return (
                  <tr
                    key={key}
                    onClick={clickable ? () => onRowClick(record, idx) : undefined}
                    className={`${
                      hoverable ? 'hover:bg-slate-50/80 transition-colors' : ''
                    } ${clickable ? 'cursor-pointer' : ''} ${extraCls}`}
                  >
                    {columns.map((col) => {
                      const raw = col.dataIndex != null ? record[col.dataIndex] : undefined;
                      const content = col.render
                        ? col.render(raw, record, idx)
                        : (raw as React.ReactNode);
                      return (
                        <td
                          key={col.key}
                          style={{ width: col.width }}
                          className={`${cellPad} ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left align-top'
                          } ${col.className ?? ''}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  className?: string;
  showSizeChanger?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  className = '',
  showSizeChanger = true,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  const go = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p));
    if (next !== current) onChange(next, pageSize);
  };

  const pages: (number | '...')[] = [];
  const add = (v: number | '...') => pages.push(v);
  const range = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= current - range && i <= current + range)
    ) {
      add(i);
    } else if (pages[pages.length - 1] !== '...') {
      add('...');
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white ${className}`}
    >
      <div className="text-sm text-slate-500">
        共 <span className="font-bold text-slate-700">{total}</span> 条，当前 {start}-{end}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => go(current - 1)}
          disabled={current === 1}
          className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          上一页
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={`h-8 min-w-[32px] px-2.5 rounded-lg text-sm font-bold transition-colors ${
                p === current
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-600'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => go(current + 1)}
          disabled={current === totalPages}
          className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          下一页
        </button>
        {showSizeChanger && (
          <select
            value={pageSize}
            onChange={(e) => onChange(1, Number(e.target.value))}
            className="h-8 ml-2 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-600 outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} 条/页
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export const ActionEditBtn: React.FC<{ onClick?: () => void; label?: string }> = ({
  onClick,
  label = '编辑',
}) => (
  <button
    onClick={onClick}
    className="cursor-pointer px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
  >
    {label}
  </button>
);

export const ActionDeleteBtn: React.FC<{ onClick?: () => void; label?: string }> = ({
  onClick,
  label = '删除',
}) => (
  <button
    onClick={onClick}
    className="cursor-pointer text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
  >
    {label}
  </button>
);
