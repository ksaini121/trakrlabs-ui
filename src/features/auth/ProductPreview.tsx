import type { ReactNode } from 'react'
import { CircleDot, GitPullRequest, Link2, Pause, Sparkles, TriangleAlert, UserRound } from 'lucide-react'
import { Avatar, UnassignedAvatar } from '@/components/ui/Avatar'
import { IconBubble } from '@/components/ui/IconBubble'
import { Tag } from '@/components/ui/Tag'
import type { Person } from '@/types/domain'
import styles from './ProductPreview.module.css'

/** Sample people for the illustration only. */
const priya: Person = { id: 'gh:demo1', login: 'priya', name: 'Priya Shah', avatarUrl: null }
const dan: Person = { id: 'gh:demo2', login: 'dan', name: 'Dan Okafor', avatarUrl: null }
const mei: Person = { id: 'gh:demo3', login: 'mei', name: 'Mei Lin', avatarUrl: null }
const sam: Person = { id: 'gh:demo4', login: 'sam', name: 'Sam Ruiz', avatarUrl: null }

/**
 * Decorative product illustration for the sign-in page: the week's goals,
 * the ranked issue list and a linked-issues card, built from real UI pieces.
 */
export function ProductPreview() {
  return (
    <div className={styles.stage} aria-hidden>
      <div className={styles.blobSage} />
      <div className={styles.blobClay} />

      {/* Ranked list */}
      <div className={`${styles.card} ${styles.list}`}>
        <div className={styles.listHeader}>
          <span className={styles.openCount}>
            <CircleDot className={styles.sage} />
            12 open
          </span>
          <span className={styles.attnCount}>4 need attention</span>
        </div>
        <div className={`${styles.band} ${styles.attention}`}>
          <TriangleAlert className={styles.alertIcon} />
          <strong>Needs attention</strong>
        </div>
        <Row
          title="SSO login fails for workspace invites" reason="Pilot customers sign in with SSO, and invites break for them."
          badge={
            <span className={`${styles.badge} ${styles.unassigned}`}>
            <UserRound size={12} />
            Unassigned
          </span>
          }
          assignee={<UnassignedAvatar />}
        />
        <Row
          title="Seed demo data for new workspaces" reason="Pilots need sample data in their first session."
          badge={
            <span className={`${styles.badge} ${styles.stalled}`}>
            <Pause size={10} />
            Stalled
          </span>
          }
          assignee={<Avatar person={dan} size="sm" />}
        />
        <div className={styles.band}>
          <IconBubble tone="number" size="xs">
            1
          </IconBubble>
          <strong>Onboard 3 pilot customers</strong>
          <span className={styles.bandSub}>3 pilot users onboarded</span>
        </div>
        <Row
          title="Onboarding checklist for workspace admins" reason="The first thing a pilot admin sees after signing up."
          badge={
            <span className={`${styles.badge} ${styles.pr}`}>
            <GitPullRequest size={12} />
            Open PR
          </span>
          }
          assignee={<Avatar person={priya} size="sm" />}
        />
      </div>

      {/* Goals */}
      <div className={`${styles.card} ${styles.goals}`}>
        <div className="eyebrow">This week's goals</div>
        {[
          ['Onboard 3 pilot customers', 'Fri, Oct 30'],
          ['Ship invoice export', 'Thu, Oct 29'],
          ['Reduce sign-up drop-off', 'Under 30% at step 2'],
        ].map(([goal, meta], i) => (
          <div key={goal} className={styles.goal}>
            <IconBubble tone="number" size="xs">
              {i + 1}
            </IconBubble>
            <div>
              <div className={styles.goalText}>{goal}</div>
              <div className={styles.goalMeta}>{meta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Linked issues */}
      <div className={`${styles.card} ${styles.linked}`}>
        <Tag tone="sage" bold icon={<Link2 size={13} />}>
          Same root cause
        </Tag>
        <div className={styles.linkedRow}>
          <span>Email verification link expires too fast</span>
          <Avatar person={sam} size="xs" />
        </div>
        <div className={styles.linkedRow}>
          <span>Magic-link sign-in fails on Safari</span>
          <Avatar person={mei} size="xs" />
        </div>
        <div className={styles.linkedNote}>Sam &amp; Mei: worth a quick conversation.</div>
      </div>
    </div>
  )
}

interface RowProps {
  title: string
  reason: string
  badge: ReactNode
  assignee: ReactNode
}

function Row({ title, reason, badge, assignee }: RowProps) {
  return (
    <div className={styles.row}>
      <CircleDot className={styles.sage} />
      <div className={styles.rowMain}>
        <div className={styles.rowTitle}>
          {title}
          {badge}
        </div>
        <div className={styles.reason}>
          <Sparkles size={13} className={styles.sage} />
          {reason}
        </div>
      </div>
      {assignee}
    </div>
  )
}
