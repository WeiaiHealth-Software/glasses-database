import React from 'react';
import { Bell, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-5">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors">
            <Bell className="w-5.5 h-5.5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors">
            <Settings className="w-5.5 h-5.5" />
          </button>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3.5 cursor-pointer group">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800 leading-tight">Admin</div>
            <div className="text-xs text-slate-500 leading-tight mt-0.5">超级管理员</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};
