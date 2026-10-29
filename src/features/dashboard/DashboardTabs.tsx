import { Link2, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { DashboardTab } from '@/features/issues/useDashboardParams'
import styles from './DashboardTabs.module.css'

interface DashboardTabsProps {
  active: DashboardTab
  onChange: (tab: DashboardTab) => void
  weekCount: number | null
  linkedCount: number | null
  /** Right-aligned note, e.g. which goals the list came from. */
  meta?: ReactNode
}

export function DashboardTabs({ active, onChange, weekCount, linkedCount, meta }: DashboardTabsProps) {
  const tabs: Array<{ key: DashboardTab; label: string; icon: ReactNode; count: number | null }> = [
    { key: 'week', label: 'This week', icon: <Target size={14} />, count: weekCount },
    { key: 'linked', label: 'Linked issues', icon: <Link2 size={14} />, count: linkedCount },
  ]
  return (
    <div className={styles.bar}>
      <div role="tablist" aria-label="Dashboard views" className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={active === tab.key}
            aria-controls={`panel-${tab.key}`}
            className={cn(styles.tab, active === tab.key && styles.active)}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== null && <span className={styles.count}>{tab.count}</span>}
          </button>
        ))}
      </div>
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  )
}
