import React from 'react';
import { Settings } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  desc: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, desc }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/50 p-12">
    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
      <Settings className="w-8 h-8 text-slate-300" />
    </div>
    <div className="text-center">
      <h2 className="text-lg font-bold text-slate-700 mb-1">{title}</h2>
      <p className="text-sm">{desc}</p>
    </div>
  </div>
);
