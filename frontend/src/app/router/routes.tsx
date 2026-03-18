import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageLayout } from '@widgets/layout'
import { TeacherDashboardPage, LoginPage } from '@pages/index'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Protected routes (with layout)
  {
    element: <PageLayout />,
    children: [
      {
        path: '/dashboard',
        element: <TeacherDashboardPage />,
      },
      {
        path: '/dashboard/class/:classId',
        element: <div>학급 대시보드 (준비 중)</div>,
      },
      {
        path: '/dashboard/class/:classId/student/:studentId',
        element: <div>학생 대시보드 (준비 중)</div>,
      },
      {
        path: '/assessment',
        element: <div>검사 관리 (준비 중)</div>,
      },
      {
        path: '/groups',
        element: <div>그룹 관리 (준비 중)</div>,
      },
      {
        path: '/schedule',
        element: <div>상담 일정 (준비 중)</div>,
      },
      {
        path: '/counseling',
        element: <div>상담 기록 (준비 중)</div>,
      },
      {
        path: '/resources',
        element: <div>학습 자료 (준비 중)</div>,
      },
      {
        path: '/ai-room',
        element: <div>AI 어시스턴트 (준비 중)</div>,
      },
    ],
  },

  // Redirects
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
