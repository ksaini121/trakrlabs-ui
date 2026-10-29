import { useSearchParams } from 'react-router'
import { usePreferencesStore, type IssuesView } from '@/stores/preferencesStore'
import { isBoardGroup, type BoardGroup } from './board'
import { DEFAULT_FILTERS, isStatusFilter, type IssueFilters } from './filters'

export type DashboardTab = 'week' | 'linked'

/** URL keys that are removed when set to these values, to keep links short. */
const URL_DEFAULTS: Record<string, string> = { ...DEFAULT_FILTERS, group: 'status' } as Record<string, string>

/**
 * Dashboard tab, view, grouping and filters live in the URL
 * (?tab=linked, ?view=board&group=person, ?status=stalled…), so a view can be
 * bookmarked or shared and survives a refresh.
 *
 * The view falls back to the person's last choice when the URL doesn't say.
 */
export function useDashboardParams() {
  const [params, setParams] = useSearchParams()
  const storedView = usePreferencesStore((s) => s.issuesView)
  const setStoredView = usePreferencesStore((s) => s.setIssuesView)

  const tab: DashboardTab = params.get('tab') === 'linked' ? 'linked' : 'week'
  const urlView = params.get('view')
  const view: IssuesView = urlView === 'board' || urlView === 'list' ? urlView : storedView
  const urlGroup = params.get('group')
  const group: BoardGroup = isBoardGroup(urlGroup) ? urlGroup : 'status'
  const status = params.get('status')
  const filters: IssueFilters = {
    q: params.get('q') ?? '',
    status: isStatusFilter(status) ? status : null,
    assignee: params.get('assignee'),
    label: params.get('label'),
    sort: params.get('sort') === 'updated' ? 'updated' : 'importance',
  }

  const update = (changes: Record<string, string | null>, replace = true) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '' || value === URL_DEFAULTS[key]) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace },
    )

  return {
    tab,
    view,
    group,
    filters,
    setTab: (next: DashboardTab) => update({ tab: next === 'week' ? null : next }, false),
    /** Switching view keeps every filter, and is remembered for next time. */
    setView: (next: IssuesView) => {
      setStoredView(next)
      update({ view: next === 'list' ? null : next }, false)
    },
    setGroup: (next: BoardGroup) => update({ group: next }),
    setFilter: <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => update({ [key]: value }),
    clearFilters: () => update({ q: null, status: null, assignee: null, label: null }),
    /** Jump to a goal's group in the list. */
    showGoal: () => update({ tab: null, sort: null }),
  }
}
