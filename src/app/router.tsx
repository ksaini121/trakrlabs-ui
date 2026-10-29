import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { CreateProjectPage } from '@/pages/CreateProjectPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FirstSyncPage } from '@/pages/FirstSyncPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { SignInPage } from '@/pages/SignInPage'
import { paths } from './paths'
import type { RouteHandle } from './routeHandle'

const projectCrumb: RouteHandle = { crumb: 'project' }

export const router = createBrowserRouter([
  { path: '/sign-in', element: <SignInPage /> },
  {
    // Everything below needs a signed-in user.
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={paths.projects()} replace /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/new', element: <CreateProjectPage /> },
          { path: 'projects/:projectId', element: <DashboardPage />, handle: projectCrumb },
          { path: 'projects/:projectId/sync', element: <FirstSyncPage /> },
          // Adding someone makes them a member straight away, so old invite links just open their projects.
          // TODO(api): bring back AcceptInvitePage (in _parked/) if invites become accept/decline.
          { path: 'invites/:inviteId', element: <Navigate to={paths.projects()} replace /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
