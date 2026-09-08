import React from 'react';
import { X } from 'lucide-react';

export type TagColor = 'slate' | 'brand' | 'amber' | 'orange' | 'emerald' | 'violet' | 'red' | 'blue' | 'purple' | 'yellow';

interface TagClasses {
  bg: string;
  text: string;
  border: string;
}

const colorMap: Record<TagColor, TagClasses> = {
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200' },
  brand:   { bg: 'bg-brand-50',   text: 'text-brand-700',   border: 'border-brand-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  yellow:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200' },
};

export interface TagProps {
  color?: TagColor;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  size?: 'xs' | 'sm';
}

export const Tag: React.FC<TagProps> = ({
  color = 'slate',
  children,
  onClose,
  className = '',
  size = 'sm',
}) => {
  const cls = colorMap[color];
  const pad = size === 'xs' ? 'px-2 py-1 text-[11px] rounded-lg leading-none' : 'px-3 py-1.5 text-xs rounded-xl font-semibold leading-tight';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${pad} ${cls.bg} ${cls.text} ${cls.border} ${className}`}
    >
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-0.5 -mr-0.5 rounded-md hover:bg-black/10 p-0.5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
};
