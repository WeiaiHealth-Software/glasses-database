import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';

const DashboardPage = lazy(() => import('../pages/Dashboard'));
const LensDatabasePage = lazy(() => import('../pages/LensDatabase'));
const BrandListPage = lazy(() => import('../pages/Dictionary/BrandList'));
const TechTagListPage = lazy(() => import('../pages/Dictionary/TechTagList'));
const RecommendListPage = lazy(() => import('../pages/Operation/RecommendList'));
const ExpertArticleListPage = lazy(() => import('../pages/Operation/ExpertArticleList'));
const PaperReferenceListPage = lazy(() => import('../pages/Operation/PaperReferenceList'));
const PermissionListPage = lazy(() => import('../pages/System/PermissionList'));
const UserListPage = lazy(() => import('../pages/System/UserList'));
const OperationLogPage = lazy(() => import('../pages/System/OperationLog'));
const MiniProgramPreviewPage = lazy(() => import('../pages/MiniProgram'));
const UIShowcasePage = lazy(() => import('../pages/UIShowcase'));
const ComparePage = lazy(() => import('../pages/Compare'));

const PageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400 text-sm">
        加载中...
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <PageSuspense>
            <DashboardPage />
          </PageSuspense>
        ),
      },
      {
        path: 'lens-database',
        element: (
          <PageSuspense>
            <LensDatabasePage />
          </PageSuspense>
        ),
      },
      {
        path: 'dictionary/brands',
        element: (
          <PageSuspense>
            <BrandListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'dictionary/tech-tags',
        element: (
          <PageSuspense>
            <TechTagListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'operation/recommend',
        element: (
          <PageSuspense>
            <RecommendListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'operation/expert-articles',
        element: (
          <PageSuspense>
            <ExpertArticleListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'operation/paper-references',
        element: (
          <PageSuspense>
            <PaperReferenceListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'system/permissions',
        element: (
          <PageSuspense>
            <PermissionListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'system/users',
        element: (
          <PageSuspense>
            <UserListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'system/logs',
        element: (
          <PageSuspense>
            <OperationLogPage />
          </PageSuspense>
        ),
      },
      {
        path: 'mini-program',
        element: (
          <PageSuspense>
            <MiniProgramPreviewPage />
          </PageSuspense>
        ),
      },
      {
        path: 'ui-showcase',
        element: (
          <PageSuspense>
            <UIShowcasePage />
          </PageSuspense>
        ),
      },
      {
        path: 'compare',
        element: (
          <PageSuspense>
            <ComparePage />
          </PageSuspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center h-screen text-slate-400">
        <div className="text-center">
          <div className="text-6xl font-bold mb-4">404</div>
          <div className="text-sm">页面不存在，返回首页</div>
        </div>
      </div>
    ),
  },
]);
