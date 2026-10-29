import { CircleDot, Link2, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { IconBubble } from '@/components/ui/IconBubble'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { cn } from '@/lib/cn'
import { firstName } from '@/lib/people'
import type { Bundle, IssueRef, IssueSize, LinkedIssues, LinkSet, LinkType } from '@/types/domain'
import styles from './LinkedIssuesView.module.css'

const LINK_TYPE_LABEL: Record<LinkType, string> = {
  duplicate: 'Duplicate',
  sameRootCause: 'Same root cause',
  blocks: 'Blocks',
  sameArea: 'Same area',
}

const SIZE_LABEL: Record<IssueSize, string> = { S: 'Small', M: 'Medium', L: 'Large' }

interface LinkedIssuesViewProps {
  /** `undefined` while loading. */
  data: LinkedIssues | undefined
  dimmed?: boolean
}

export function LinkedIssuesView({ data, dimmed }: LinkedIssuesViewProps) {
  if (!data) return <LinkedSkeleton />

  if (!data.acrossDevelopers.length && !data.bundles.length) {
    return (
      <div className={styles.empty}>
        <IconBubble tone="neutral" size="xl" className={styles.emptyArt}>
          <Link2 size={22} />
        </IconBubble>
        <div>
          <h3 className={styles.emptyTitle}>No linked issues this week</h3>
          <p className={styles.emptyBody}>
            Trakr didn't find related issues across people, or small issues that could ship together. It checks again
            whenever the list is regenerated.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(styles.root, dimmed && styles.dimmed)}>
      {data.acrossDevelopers.length > 0 && (
        <section className={styles.section}>
          <div>
            <h3 className={styles.sectionTitle}>Across developers</h3>
            <p className={styles.sectionSub}>Related issues held by different people. Worth a quick conversation.</p>
          </div>
          {data.acrossDevelopers.map((set) => (
            <LinkSetCard key={set.id} set={set} />
          ))}
        </section>
      )}
      {data.bundles.length > 0 && (
        <section className={styles.section}>
          <div>
            <h3 className={styles.sectionTitle}>Bundles</h3>
            <p className={styles.sectionSub}>Small issues with the same person that can ship together.</p>
          </div>
          {data.bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </section>
      )}
    </div>
  )
}

function Reason({ children }: { children: string }) {
  return (
    <span className={styles.reason}>
      <Sparkles size={14} className={styles.spark} aria-hidden />
      {children}
    </span>
  )
}

function IssueLink({ issue }: { issue: IssueRef }) {
  return (
    <a href={issue.url} target="_blank" rel="noopener noreferrer" className={styles.issueLink}>
      {issue.title} <span className={styles.number}>#{issue.number}</span>
    </a>
  )
}

function LinkSetCard({ set }: { set: LinkSet }) {
  const people = [...new Set(set.issues.map((i) => firstName(i.assignee)))].join(' & ')
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <Tag tone="sage" bold icon={<Link2 size={14} />}>
          {LINK_TYPE_LABEL[set.type]}
        </Tag>
        <Reason>{set.reason}</Reason>
        <span className={styles.people}>{people}</span>
      </header>
      <ul className={styles.rows}>
        {set.issues.map((issue) => (
          <li key={issue.number} className={styles.row}>
            <CircleDot className={styles.openIcon} aria-hidden />
            <IssueLink issue={issue} />
            <span className={styles.who}>{issue.assignee.name}</span>
            <Avatar person={issue.assignee} size="sm" />
          </li>
        ))}
      </ul>
    </article>
  )
}

function BundleCard({ bundle }: { bundle: Bundle }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <Avatar person={bundle.assignee} size="sm" />
        <span className={styles.owner}>{bundle.assignee.name}</span>
        <Reason>{bundle.reason}</Reason>
      </header>
      <ul className={styles.rows}>
        {bundle.issues.map((issue) => (
          <li key={issue.number} className={styles.row}>
            <CircleDot className={styles.openIcon} aria-hidden />
            <IssueLink issue={issue} />
            <span className={styles.size} title={SIZE_LABEL[issue.size]} aria-label={`Size: ${SIZE_LABEL[issue.size]}`}>
              {issue.size}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function LinkedSkeleton() {
  return (
    <div className={styles.root} aria-busy aria-label="Loading linked issues">
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton width="30%" />
          <Skeleton width="70%" height={12} />
          <Skeleton width="60%" height={12} />
        </div>
      ))}
    </div>
  )
}
