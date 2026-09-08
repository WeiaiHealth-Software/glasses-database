import React from 'react';
import { LayoutDashboard, Database, Tags, Settings, Smartphone, ChevronDown, ChevronRight, Glasses, Shield, UserCog, FileText, TrendingUp, Layers3, ArrowLeftRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface SubMenuGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: (MenuItem & { subIcon?: React.ComponentType<{ className?: string }> })[];
}

const singleMenus: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard 仪表盘', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'lens-db', label: '镜片数据库', icon: Database, path: '/lens-database' },
];

const subMenuGroups: SubMenuGroup[] = [
  {
    key: 'dict',
    label: '字典与标签管理',
    icon: Tags,
    defaultOpen: true,
    children: [
      { key: 'dict-brand', label: '品牌管理', icon: FileText, path: '/dictionary/brands' },
      { key: 'dict-tech', label: '技术标签', icon: FileText, path: '/dictionary/tech-tags' },
    ],
  },
  {
    key: 'operation',
    label: '运营与推荐管理',
    icon: TrendingUp,
    defaultOpen: false,
    children: [
      { key: 'op-recommend', label: '首页推荐位', icon: FileText, path: '/operation/recommend' },
    ],
  },
  {
    key: 'sys',
    label: '系统与权限管理',
    icon: Settings,
    defaultOpen: true,
    children: [
      { key: 'sys-auth', label: '权限管理', subIcon: Shield, icon: Shield, path: '/system/permissions' },
      { key: 'sys-user', label: '用户管理', subIcon: UserCog, icon: UserCog, path: '/system/users' },
      { key: 'sys-log', label: '日志管理', subIcon: FileText, icon: FileText, path: '/system/logs' },
    ],
  },
];

const specialMenu: MenuItem = {
  key: 'mp',
  label: '小程序 Demo 预览',
  icon: Smartphone,
  path: '/mini-program',
};

const showcaseMenu: MenuItem = {
  key: 'ui',
  label: 'UI 组件库示例',
  icon: Layers3,
  path: '/ui-showcase',
};

const compareMenu: MenuItem = {
  key: 'compare',
  label: '镜片横向对比工具',
  icon: ArrowLeftRight,
  path: '/compare',
};

interface SidebarProps {
  openMenus: Record<string, boolean>;
  toggleMenu: (key: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ openMenus, toggleMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const groupHasActive = (group: SubMenuGroup) =>
    group.children.some((child) => currentPath === child.path);

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          <Glasses className="w-5 h-5" />
        </div>
        <span className="font-bold text-slate-800 tracking-wide text-sm">镜片查询管理系统</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {singleMenus.map((menu) => {
          const Icon = menu.icon;
          const active = isActive(menu.path);
          return (
            <div
              key={menu.key}
              onClick={() => navigate(menu.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{menu.label}</span>
            </div>
          );
        })}

        {subMenuGroups.map((group) => {
          const GroupIcon = group.icon;
          const open = openMenus[group.key] ?? group.defaultOpen ?? false;
          const hasActiveChild = groupHasActive(group);
          return (
            <div className="space-y-1 mt-2" key={group.key}>
              <div
                onClick={() => toggleMenu(group.key)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  hasActiveChild && !open
                    ? 'text-brand-600 font-bold hover:bg-brand-50/60'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GroupIcon className="w-5 h-5" />
                  <span className="font-medium text-sm">{group.label}</span>
                </div>
                {open ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
              {open && (
                <div className="pl-11 pr-3 space-y-1">
                  {group.children.map((child) => {
                    const SubIcon = child.subIcon;
                    const active = isActive(child.path);
                    return (
                      <div
                        key={child.key}
                        onClick={() => navigate(child.path)}
                        className={`py-2 px-3 rounded-lg text-sm cursor-pointer flex items-center gap-2 ${
                          active
                            ? 'bg-brand-50 text-brand-600 font-bold'
                            : 'text-slate-600 font-medium hover:bg-slate-50'
                        }`}
                      >
                        {SubIcon ? <SubIcon className="w-3.5 h-3.5" /> : null}
                        {child.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {(() => {
          const Icon = specialMenu.icon;
          const active = isActive(specialMenu.path);
          return (
            <div
              onClick={() => navigate(specialMenu.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mt-6 border border-transparent transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-600 border-brand-100 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 font-medium bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{specialMenu.label}</span>
            </div>
          );
        })()}

        {(() => {
          const Icon = showcaseMenu.icon;
          const active = isActive(showcaseMenu.path);
          return (
            <div
              onClick={() => navigate(showcaseMenu.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mt-2 border border-dashed transition-colors ${
                active
                  ? 'bg-violet-50 text-violet-700 border-violet-200 font-bold'
                  : 'text-violet-600 hover:bg-violet-50 font-medium border-violet-200 bg-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{showcaseMenu.label}</span>
            </div>
          );
        })()}

        {(() => {
          const Icon = compareMenu.icon;
          const active = isActive(compareMenu.path);
          return (
            <div
              onClick={() => navigate(compareMenu.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mt-2 border transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                  : 'text-emerald-700 hover:bg-emerald-50 font-medium border-emerald-200 bg-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{compareMenu.label}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
