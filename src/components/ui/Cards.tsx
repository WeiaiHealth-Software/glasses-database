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
    className={`rounded-2xl border border-brand-200 bg-brand-50/60 p-4 ${className}`}
  >
    <h3 className="text-sm font-bold text-brand-700 mb-2 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      {title}
    </h3>
    <ul className="list-disc pl-5 space-y-1 text-xs text-brand-700/90 leading-5">
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
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3 ${className}`}
  >
    {children}
  </div>
);

export interface ToolbarDividerProps {
  className?: string;
}

export const ToolbarDivider: React.FC<ToolbarDividerProps> = ({ className = '' }) => (
  <div className={`h-8 w-px bg-slate-200 ${className}`} />
);
