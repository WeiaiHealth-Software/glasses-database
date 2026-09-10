import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { Tag } from './Tag';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string, option: SelectOption) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  size?: 'sm' | 'md';
}

interface DropdownRect {
  top: number;
  left: number;
  width: number;
  placeAbove: boolean;
}

function useDropdownRect(triggerRef: React.RefObject<HTMLElement>, open: boolean) {
  const [rect, setRect] = useState<DropdownRect | null>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const spaceBelow = viewportH - r.bottom;
      const spaceAbove = r.top;
      const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
      setRect({ top: placeAbove ? r.top : r.bottom, left: r.left, width: r.width, placeAbove });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, triggerRef]);

  return rect;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择',
  label,
  error,
  searchable,
  disabled,
  className = '',
  wrapperClassName = '',
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rect = useDropdownRect(triggerRef as React.RefObject<HTMLElement>, open);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setKeyword('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const filtered = useMemo(
    () =>
      searchable
        ? options.filter((o) => o.label.toLowerCase().includes(keyword.toLowerCase()))
        : options,
    [searchable, options, keyword]
  );

  const h = size === 'sm' ? 'h-9' : 'h-10';

  const dropdown = open && rect && typeof document !== 'undefined' ? (
    createPortal(
      <div
        style={{
          position: 'fixed',
          top: rect.placeAbove ? undefined : rect.top + 6,
          bottom: rect.placeAbove ? window.innerHeight - rect.top + 6 : undefined,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        }}
        className={`bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150 ${
          rect.placeAbove ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
        }`}
      >
        {searchable && (
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索..."
                className="w-full h-9 rounded-lg border border-slate-200 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
              />
            </div>
          </div>
        )}
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">暂无匹配项</div>
          ) : (
            filtered.map((opt) => {
              const active = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange?.(opt.value, opt);
                    setOpen(false);
                    setKeyword('');
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    opt.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : active
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-slate-400 mt-0.5">{opt.description}</div>
                    )}
                  </div>
                  {active && <Check className="w-4 h-4" />}
                </div>
              );
            })
          )}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`w-full ${wrapperClassName}`} ref={wrapRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      )}
      <div className={`relative ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full ${h} rounded-xl border bg-slate-50 px-4 pr-9 text-left text-sm outline-none transition-all flex items-center gap-2 ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-500'
              : 'border-slate-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {selectedOption ? (
            <span className="text-slate-800 font-medium">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 absolute right-3 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
      {dropdown}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  onChange?: (value: string[], options: SelectOption[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
  maxTagCount?: number;
  className?: string;
  wrapperClassName?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = '请选择（可多选）',
  label,
  error,
  searchable,
  disabled,
  maxTagCount = 3,
  className = '',
  wrapperClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rect = useDropdownRect(triggerRef as React.RefObject<HTMLElement>, open);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setKeyword('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOpts = options.filter((o) => value.includes(o.value));
  const filtered = useMemo(
    () =>
      searchable
        ? options.filter((o) => o.label.toLowerCase().includes(keyword.toLowerCase()))
        : options,
    [searchable, options, keyword]
  );

  const toggle = (opt: SelectOption) => {
    if (opt.disabled) return;
    const exist = value.includes(opt.value);
    const next = exist ? value.filter((v) => v !== opt.value) : [...value, opt.value];
    const nextOpts = options.filter((o) => next.includes(o.value));
    onChange?.(next, nextOpts);
  };

  const removeOne = (v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = value.filter((x) => x !== v);
    const nextOpts = options.filter((o) => next.includes(o.value));
    onChange?.(next, nextOpts);
  };

  const dropdown = open && rect && typeof document !== 'undefined' ? (
    createPortal(
      <div
        style={{
          position: 'fixed',
          top: rect.placeAbove ? undefined : rect.top + 6,
          bottom: rect.placeAbove ? window.innerHeight - rect.top + 6 : undefined,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        }}
        className={`bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150 ${
          rect.placeAbove ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
        }`}
      >
        {searchable && (
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索..."
                className="w-full h-9 rounded-lg border border-slate-200 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
              />
            </div>
          </div>
        )}
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">暂无匹配项</div>
          ) : (
            filtered.map((opt) => {
              const active = value.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggle(opt)}
                  className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    opt.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : active
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      active ? 'bg-brand-600 border-brand-600' : 'border-slate-300'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`w-full ${wrapperClassName}`} ref={wrapRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      )}
      <div className={`relative ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full min-h-[44px] rounded-xl border bg-slate-50 px-3 pr-9 py-2 text-left outline-none transition-all flex flex-wrap items-center gap-1.5 ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-500'
              : 'border-slate-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {selectedOpts.length === 0 ? (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          ) : (
            <>
              {(maxTagCount > 0 && selectedOpts.length > maxTagCount
                ? selectedOpts.slice(0, maxTagCount)
                : selectedOpts
              ).map((opt) => (
                <Tag key={opt.value} color="brand" size="sm" onClose={(e) => removeOne(opt.value, e as unknown as React.MouseEvent)}>
                  {opt.label}
                </Tag>
              ))}
              {maxTagCount > 0 && selectedOpts.length > maxTagCount && (
                <Tag color="slate" size="sm">
                  +{selectedOpts.length - maxTagCount}
                </Tag>
              )}
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
      {dropdown}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
