import { RefreshCw, WifiOff } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import { isApiError } from '@/api/errors'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { IconBubble } from '@/components/ui/IconBubble'
import { PreviewNote } from '@/components/ui/PreviewNote'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { IssueBoard } from '@/features/board/IssueBoard'
import { DashboardHeader } from '@/features/dashboard/DashboardHeader'
import { DashboardTabs } from '@/features/dashboard/DashboardTabs'
import { GoalEditorDialog } from '@/features/goals/GoalEditorDialog'
import { GoalHistoryDialog } from '@/features/goals/GoalHistoryDialog'
import { GoalsPanel } from '@/features/goals/GoalsPanel'
import { GoalsStrip } from '@/features/goals/GoalsStrip'
import { useGoals, useRestoreGoals, useSaveGoals } from '@/features/goals/hooks'
import { useMembers } from '@/features/invites/hooks'
import { effectiveGroup } from '@/features/issues/board'
import { countForGoal, goalGroupId } from '@/features/issues/filters'
import { useClosedThisWeek, useLinkedIssues, useSyncIssues, useWeeklyIssues } from '@/features/issues/hooks'
import { useDashboardParams } from '@/features/issues/useDashboardParams'
import { WeeklyIssueList } from '@/features/issues/WeeklyIssueList'
import { LinkedIssuesView } from '@/features/links/LinkedIssuesView'
import { useProject } from '@/features/projects/hooks'
import { cn } from '@/lib/cn'
import { memberAsPerson } from '@/lib/people'
import { toast, usePreferencesStore, useUiStore } from '@/stores'
import type { IssuesView } from '@/stores/preferencesStore'
import { MAX_GOALS } from '@/types/domain'
import { NotAllowedView } from './NotAllowedView'
import styles from './DashboardPage.module.css'

const VIEW_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
] as const satisfies ReadonlyArray<{ value: IssuesView; label: string }>

function isAccessError(error: unknown): boolean {
  return isApiError(error) && (error.code === 'forbidden' || error.code === 'notFound')
}

export function DashboardPage() {
  const { projectId = '' } = useParams()
  const params = useDashboardParams()

  const layout = usePreferencesStore((s) => s.goalsLayout)
  const setLastProjectId = usePreferencesStore((s) => s.setLastProjectId)
  const editorOpen = useUiStore((s) => s.goalEditorOpen)
  const historyOpen = useUiStore((s) => s.goalHistoryOpen)
  const setEditorOpen = useUiStore((s) => s.setGoalEditorOpen)
  const setHistoryOpen = useUiStore((s) => s.setGoalHistoryOpen)
  const openInvite = useUiStore((s) => s.openInvite)

  const project = useProject(projectId)
  const members = useMembers(projectId)
  const weekly = useWeeklyIssues(projectId)
  const goals = useGoals(projectId)
  const linked = useLinkedIssues(projectId, project.data?.repo.url)

  const onBoard = params.tab === 'week' && params.view === 'board'
  // Closed issues are fetched only while the status board is on screen.
  const closed = useClosedThisWeek(projectId, onBoard && effectiveGroup(params.group, weekly.hasInsights) === 'status')

  const sync = useSyncIssues(projectId)
  const saveGoals = useSaveGoals(projectId)
  const restoreGoals = useRestoreGoals(projectId)

  const opened = project.isSuccess && !project.isPlaceholderData
  useEffect(() => {
    if (opened) setLastProjectId(projectId)
  }, [opened, projectId, setLastProjectId])

  // Goal popups belong to this project: close them when leaving it.
  useEffect(
    () => () => {
      setEditorOpen(false)
      setHistoryOpen(false)
    },
    [projectId, setEditorOpen, setHistoryOpen],
  )

  if (isAccessError(project.error) || isAccessError(weekly.error)) return <NotAllowedView />

  const current = goals.data?.current ?? null
  const issues = weekly.issues
  const unreachable = [project.error, weekly.error].some((e) => isApiError(e) && e.code === 'network')

  const onSyncNow = () =>
    sync.mutate(undefined, {
      onSuccess: ({ synced }) => toast.show(`Synced ${synced} issue${synced === 1 ? '' : 's'} from GitHub`),
      onError: (error) => toast.error(isApiError(error) && error.code !== 'unknown' ? error.message : "Couldn't sync with GitHub. Try again."),
    })

  const viewSwitch = (
    <SegmentedControl label="View" options={VIEW_OPTIONS} value={params.view} onChange={params.setView} />
  )
  // TODO(api): remove once goals are saved through the API.
  const goalsNote = (
    <PreviewNote className={styles.previewNote}>goals are kept in this browser tab and not saved to the server yet.</PreviewNote>
  )

  const onSelectGoal = (goalIndex: number) => {
    params.showGoal()
    requestAnimationFrame(() =>
      document.getElementById(goalGroupId(goalIndex))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  return (
    <div className={styles.page}>
      <DashboardHeader
        project={project.data}
        lastSyncedAt={weekly.lastSyncedAt}
        people={members.data?.map(memberAsPerson)}
        syncing={sync.isPending}
        onSyncNow={onSyncNow}
        onInvite={() =>
          project.data && openInvite({ projectId: project.data.id, projectName: project.data.name, mode: 'manage' })
        }
      />

      {unreachable && (
        <Banner
          tone="neutral"
          icon={
            <IconBubble tone="muted">
              <WifiOff />
            </IconBubble>
          }
          action={
            <Button
              icon={<RefreshCw size={15} />}
              onClick={() => {
                void project.refetch()
                weekly.refetch()
              }}
            >
              Retry
            </Button>
          }
        >
          <strong>Can't reach Trakr right now.</strong> Check your connection and try again.
        </Banner>
      )}

      {/* The board needs the width and height: goals shrink to one row above it. */}
      <div className={cn(styles.grid, layout === 'sidebar' && !onBoard && styles.withSidebar)}>
        {goals.data && onBoard && (
          <GoalsStrip
            current={current}
            onEdit={() => setEditorOpen(true)}
            onShowHistory={() => setHistoryOpen(true)}
            note={goalsNote}
          />
        )}
        {goals.data && !onBoard && (
          <GoalsPanel
            layout={layout}
            week={goals.data.week}
            current={current}
            issueCounts={
              weekly.hasInsights && issues
                ? Array.from({ length: MAX_GOALS }, (_, i) => countForGoal(issues, i))
                : undefined
            }
            onEdit={() => setEditorOpen(true)}
            onShowHistory={() => setHistoryOpen(true)}
            onSelectGoal={weekly.hasInsights ? onSelectGoal : undefined}
            note={goalsNote}
          />
        )}

        <div className={styles.main}>
          <DashboardTabs
            active={params.tab}
            onChange={params.setTab}
            weekCount={issues ? issues.length : null}
            linkedCount={linked.data ? linked.data.acrossDevelopers.length + linked.data.bundles.length : null}
          />

          <div role="tabpanel" id={`panel-${params.tab}`} aria-labelledby={`tab-${params.tab}`}>
            {onBoard ? (
              <IssueBoard
                issues={issues}
                closedThisWeek={closed.data?.issues}
                closedCapped={closed.data?.capped ?? false}
                goals={current?.goals ?? []}
                hasInsights={weekly.hasInsights}
                group={params.group}
                onGroupChange={params.setGroup}
                filters={params.filters}
                onFilterChange={params.setFilter}
                onClearFilters={params.clearFilters}
                toolbarEnd={viewSwitch}
              />
            ) : params.tab === 'week' ? (
              <WeeklyIssueList
                issues={issues}
                goals={current?.goals ?? []}
                hasInsights={weekly.hasInsights}
                filters={params.filters}
                onFilterChange={params.setFilter}
                onClearFilters={params.clearFilters}
                toolbarEnd={viewSwitch}
              />
            ) : (
              <>
                {/* TODO(api): remove once linked issues come from the API. */}
                <PreviewNote className={styles.linkedNote}>
                  sample data. Linked issues will be found from your repository once the API supports them.
                </PreviewNote>
                <LinkedIssuesView data={linked.data} />
              </>
            )}
          </div>
        </div>
      </div>

      <GoalEditorDialog
        open={editorOpen}
        initialGoals={current?.goals ?? []}
        saving={saveGoals.isPending}
        error={saveGoals.isError ? 'Goals could not be saved. Please try again.' : null}
        onClose={() => {
          setEditorOpen(false)
          saveGoals.reset()
        }}
        onSave={(next) =>
          saveGoals.mutate(next, {
            onSuccess: () => {
              setEditorOpen(false)
              params.setTab('week')
              toast.show('Goals saved')
            },
          })
        }
      />

      <GoalHistoryDialog
        open={historyOpen}
        versions={goals.data?.history ?? []}
        currentId={current?.id ?? null}
        restoringId={restoreGoals.isPending ? (restoreGoals.variables ?? null) : null}
        onClose={() => setHistoryOpen(false)}
        onRestore={(version) =>
          restoreGoals.mutate(version.id, {
            onSuccess: () => {
              setHistoryOpen(false)
              params.setTab('week')
              toast.show('Goals restored')
            },
          })
        }
      />
    </div>
  )
}
