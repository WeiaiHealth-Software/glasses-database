import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface SpecCardProps {
  title?: string;
  items: string[];
  className?: string;
}

export const SpecCard: React.FC<SpecCardProps> = ({
  title = '开发规范说明',
  items,
  className = '',
}) => (
  <div
    className={`rounded-3xl border border-brand-200 bg-brand-50/60 p-5 ${className}`}
  >
    <h3 className="text-sm font-bold text-brand-700 mb-3 flex items-center gap-2.5">
      <AlertCircle className="w-5 h-5" />
      {title}
    </h3>
    <ul className="list-disc pl-6 space-y-1.5 text-xs text-brand-700/90 leading-6">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  </div>
);

export interface ToolbarCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarCard: React.FC<ToolbarCardProps> = ({ children, className = '' }) => (
  <div
    className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-wrap items-center justify-between gap-4 ${className}`}
  >
    {children}
  </div>
);

export interface ToolbarDividerProps {
  className?: string;
}

export const ToolbarDivider: React.FC<ToolbarDividerProps> = ({ className = '' }) => (
  <div className={`h-9 w-px bg-slate-200 ${className}`} />
);
