import { ChevronDown, LogOut } from 'lucide-react'
import { Link, useMatches, useNavigate } from 'react-router'
import { paths } from '@/app/paths'
import type { RouteHandle } from '@/app/routeHandle'
import { Avatar } from '@/components/ui/Avatar'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { useSession, useSignOut } from '@/features/auth/hooks'
import { useProject } from '@/features/projects/hooks'
import { Brand } from './Brand'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const matches = useMatches()
  const crumbMatch = matches.find((m) => (m.handle as RouteHandle | undefined)?.crumb === 'project')
  const projectId = crumbMatch?.params.projectId

  return (
    <header className={styles.header}>
      <Link to={paths.projects()} className={styles.home} aria-label="Trakr, all projects">
        <Brand />
      </Link>
      {projectId && <ProjectCrumb projectId={projectId} />}
      <div className={styles.end}>
        <AccountMenu />
      </div>
    </header>
  )
}

function ProjectCrumb({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId)
  if (!project) return null
  return (
    <>
      <span className={styles.slash} aria-hidden>
        /
      </span>
      <span className={styles.crumb}>{project.name}</span>
    </>
  )
}

function AccountMenu() {
  const { data: user } = useSession()
  const signOut = useSignOut()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <Menu
      width={240}
      trigger={(props) => (
        <button type="button" className={styles.account} aria-label="Account menu" {...props}>
          <Avatar person={user} size="md" />
          <ChevronDown size={14} className={styles.chevron} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className={styles.who}>
            <div className={styles.name}>{user.name}</div>
            <div className={styles.login}>{user.email ?? `@${user.login} on GitHub`}</div>
          </div>
          <MenuItem
            leading={<LogOut />}
            onSelect={() => {
              close()
              // Signed out locally even if the request fails, so always leave.
              signOut.mutate(undefined, { onSettled: () => navigate(paths.signIn(), { replace: true }) })
            }}
          >
            Sign out
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
