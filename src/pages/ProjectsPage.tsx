import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { ProjectCard, ProjectCardSkeleton } from '@/features/projects/ProjectCard'
import { useProjectsOverview } from '@/features/projects/hooks'
import type { Project } from '@/types/domain'
import styles from './ProjectsPage.module.css'

function CreateProjectLink() {
  return (
    <Link to={paths.createProject()} className={buttonClass('primary')}>
      <Plus />
      Create project
    </Link>
  )
}

export function ProjectsPage() {
  const { data, isPending, isError, refetch } = useProjectsOverview()
  const isEmpty = data && !data.mine.length && !data.shared.length

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Projects</h1>
        {!isEmpty && <CreateProjectLink />}
      </div>

      {isPending && (
        <div className={styles.grid} aria-busy>
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      )}

      {isError && (
        <Banner tone="neutral" action={<Button onClick={() => void refetch()}>Retry</Button>}>
          <strong>Couldn't load your projects.</strong> Check your connection and try again.
        </Banner>
      )}

      {isEmpty && <EmptyProjects />}

      {data && !isEmpty && (
        <>
          <ProjectSection title="My projects" projects={data.mine} empty="You haven't created a project yet." />
          <ProjectSection title="Shared with me" projects={data.shared} empty="Projects someone adds you to will appear here." />
        </>
      )}
    </div>
  )
}

function ProjectSection({ title, projects, empty }: { title: string; projects: Project[]; empty: string }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {projects.length ? (
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  )
}

function EmptyProjects() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyArt} aria-hidden>
        <span />
      </div>
      <div className={styles.emptyText}>
        <h2>Start your first project</h2>
        <p>
          A project connects one GitHub repository to your team's weekly goals. Trakr reads its open issues so the
          team can see what matters this week.
        </p>
        <CreateProjectLink />
        <div className={styles.emptyHint}>Projects someone adds you to will appear here too.</div>
      </div>
    </div>
  )
}
