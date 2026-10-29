import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { Issue } from '@/types/domain'
import { FilterMenu, type FilterOption } from './FilterMenu'
import {
  assigneesIn,
  hasActiveFilters,
  labelsIn,
  SORT_OPTIONS,
  statusOptions,
  type IssueFilters,
  type SortOrder,
  type StatusFilter,
} from './filters'
import styles from './IssueToolbar.module.css'

export type FilterChange = <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => void

interface IssueSearchRowProps {
  filters: IssueFilters
  onFilterChange: FilterChange
  onClearFilters: () => void
  /** Controls at the end of the row, e.g. the List | Board switch. */
  end?: ReactNode
}

/** Search box + Clear filters, shared by the list and the board. */
export function IssueSearchRow({ filters, onFilterChange, onClearFilters, end }: IssueSearchRowProps) {
  return (
    <div className={styles.searchRow}>
      <label className={styles.search}>
        <Search className={styles.searchIcon} />
        <span className="sr-only">Search issues</span>
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onFilterChange('q', e.target.value)}
          placeholder="Search issues by title or number"
        />
      </label>
      {hasActiveFilters(filters) && (
        <Button variant="ghost" icon={<X />} onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
      {end}
    </div>
  )
}

interface IssueFilterMenusProps {
  /** All issues, so the Assignee and Labels menus list everyone and every label. */
  issues: Issue[] | undefined
  filters: IssueFilters
  onFilterChange: FilterChange
  hasInsights: boolean
  /** Hidden on the board grouped by status, where the columns are the statuses. */
  showStatus?: boolean
  /** Sorting only means something for the list with AI ranking. */
  showSort?: boolean
}

/** The Status, Assignee, Labels (and Sort) pill menus. */
export function IssueFilterMenus({ issues, filters, onFilterChange, hasInsights, showStatus = true, showSort = false }: IssueFilterMenusProps) {
  const statusMenu: FilterOption<StatusFilter>[] = [{ value: null, label: 'Any status' }, ...statusOptions(hasInsights)]
  const assigneeMenu: FilterOption<string>[] = [
    { value: null, label: 'Anyone' },
    { value: 'none', label: 'Unassigned' },
    ...assigneesIn(issues ?? []).map((p) => ({ value: p.login, label: p.name, leading: <Avatar person={p} size="xs" /> })),
  ]
  const labelMenu: FilterOption<string>[] = [
    { value: null, label: 'Any label' },
    ...labelsIn(issues ?? []).map((l) => ({ value: l.name, label: l.name })),
  ]

  return (
    <div className={styles.filters}>
      {showStatus && (
        <FilterMenu name="Status" title="Filter by status" options={statusMenu} value={filters.status} onChange={(v) => onFilterChange('status', v)} />
      )}
      <FilterMenu name="Assignee" title="Filter by assignee" options={assigneeMenu} value={filters.assignee} onChange={(v) => onFilterChange('assignee', v)} />
      <FilterMenu name="Labels" title="Filter by label" options={labelMenu} value={filters.label} onChange={(v) => onFilterChange('label', v)} />
      {showSort && (
        <FilterMenu<SortOrder>
          name="Sort"
          title="Sort by"
          options={SORT_OPTIONS}
          value={filters.sort}
          showValue={false}
          onChange={(v) => onFilterChange('sort', v ?? 'importance')}
        />
      )}
    </div>
  )
}
