import { Clock, Info, Lock, Plug, Sparkles, Target, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { safeNext, type SignInReason } from '@/app/paths'
import { Brand } from '@/components/layout/Brand'
import { PageLoader } from '@/components/layout/PageLoader'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { GitHubIcon } from '@/components/ui/GitHubIcon'
import { IconBubble } from '@/components/ui/IconBubble'
import { useSession, useSignIn } from '@/features/auth/hooks'
import { ProductPreview } from '@/features/auth/ProductPreview'
import styles from './SignInPage.module.css'

const REASON_NOTICE: Record<SignInReason, { tone: 'soft' | 'danger'; icon: ReactNode; text: string }> = {
  expired: { tone: 'soft', icon: <Clock />, text: "Your session expired. Sign in again and we'll take you back to where you were." },
  cancelled: { tone: 'soft', icon: <Info />, text: "Sign-in was cancelled on GitHub. You can try again whenever you're ready." },
  failed: { tone: 'danger', icon: <TriangleAlert />, text: 'Something went wrong while signing you in. Please try again.' },
}

const STEPS: Array<{ icon: ReactNode; title: string; body: string }> = [
  { icon: <Plug size={18} />, title: 'Connect a repo', body: 'Read-only. Nothing in GitHub changes.' },
  { icon: <Target size={18} />, title: 'Write 3 goals', body: 'What matters this week, in plain words.' },
  { icon: <Sparkles size={18} />, title: 'See what matters', body: 'Open issues, who has them, and what is stuck.' },
]

function parseReason(value: string | null): SignInReason | null {
  return value === 'expired' || value === 'cancelled' || value === 'failed' ? value : null
}

/**
 * Why the user is here: `?auth_error=cancelled|failed` comes from the backend's
 * GitHub callback; `?reason=expired` from our own 401 handling.
 */
function reasonFrom(params: URLSearchParams): SignInReason | null {
  return parseReason(params.get('auth_error')) ?? parseReason(params.get('reason'))
}

export function SignInPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data: user, isPending: sessionPending } = useSession()
  const signIn = useSignIn()

  const reason = signIn.isError ? 'failed' : reasonFrom(params)
  const next = safeNext(params.get('next'))

  if (sessionPending) return <PageLoader />
  if (user && !signIn.isPending) return <Navigate to={next} replace />

  const notice = reason ? REASON_NOTICE[reason] : null
  const retry = reason === 'cancelled' || reason === 'failed'

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.content}>
          <Brand size="lg" />
          <h1 className={styles.title}>Know what to work on this week.</h1>
          <p className={styles.lead}>
            Connect your GitHub repository, write this week's top 3 goals, and Trakr shows which issues matter for
            them and which ones belong together.
          </p>

          {notice && (
            <Banner tone={notice.tone} icon={notice.icon} urgent={reason === 'failed'}>
              {notice.text}
            </Banner>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              className={styles.cta}
              icon={<GitHubIcon size={18} />}
              loading={signIn.isPending}
              onClick={() => signIn.mutate(next, { onSuccess: () => navigate(next, { replace: true }) })}
            >
              {signIn.isPending ? 'Redirecting to GitHub…' : retry ? 'Try again' : 'Sign in with GitHub'}
            </Button>
            <div className={styles.privacy}>
              <Lock size={15} />
              Trakr only reads your public GitHub profile to sign you in.
            </div>
          </div>

          <ol className={styles.steps} aria-label="How Trakr works">
            {STEPS.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <IconBubble tone="sageSoft" size="md">
                  {step.icon}
                </IconBubble>
                <div>
                  <div className={styles.stepTitle}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    {step.title}
                  </div>
                  <div className={styles.stepBody}>{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.visual}>
          <ProductPreview />
        </div>
      </div>
    </main>
  )
}
