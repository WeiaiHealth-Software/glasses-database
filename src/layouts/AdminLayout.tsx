import React, { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/business/Sidebar';
import { Header } from '../components/business/Header';

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard 仪表盘',
  '/lens-database': '镜片数据库',
  '/dictionary/brands': '品牌管理',
  '/dictionary/tech-tags': '技术标签',
  '/operation/recommend': '首页推荐位',
  '/system/permissions': '权限管理',
  '/system/users': '用户管理',
  '/system/logs': '日志管理',
  '/mini-program': '小程序 Demo 预览',
  '/ui-showcase': 'UI 组件库示例',
  '/compare': '镜片横向对比工具',
};

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    dict: true,
    operation: false,
    sys: true,
  });

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const headerTitle = useMemo(() => {
    return titleMap[location.pathname] ?? '镜片查询管理系统';
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar openMenus={openMenus} toggleMenu={toggleMenu} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={headerTitle} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
