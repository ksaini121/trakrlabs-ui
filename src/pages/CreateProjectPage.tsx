import { ChevronLeft, Lock } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { isApiError } from '@/api/errors'
import { paths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { Field, TextInput } from '@/components/ui/Field'
import { useCreateProject } from '@/features/projects/hooks'
import { useCreateProjectStore, useUiStore } from '@/stores'
import styles from './CreateProjectPage.module.css'

/** The backend's pattern for `github_repo_name`. */
const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/

/** "https://github.com/owner/repo(.git)" or "owner/repo" → "owner/repo". */
function repoFullName(input: string): string {
  const fromUrl = input.match(/github\.com[/:]([^/\s]+\/[^/\s#?]+)/)?.[1]
  return (fromUrl ?? input.trim()).replace(/\.git$/, '').replace(/\/$/, '')
}

interface FieldErrors {
  name?: string
  repo?: string
  form?: string
}

function errorsFrom(error: unknown): FieldErrors {
  if (!isApiError(error)) return { form: "We couldn't create the project. Please try again." }
  const { fieldErrors } = error
  const known: FieldErrors = { name: fieldErrors.title, repo: fieldErrors.github_repo_name }
  if (known.name || known.repo) return known
  if (error.code === 'network') return { form: "Can't reach Trakr right now. Check your connection and try again." }
  if (error.code === 'validation') return { form: error.message }
  return { form: "We couldn't create the project. Please try again." }
}

/** Step 1 of 3: name the project and connect a repository. Step 2 is the invite popup, step 3 the first sync. */
export function CreateProjectPage() {
  const draft = useCreateProjectStore((s) => s.draft)
  const updateDraft = useCreateProjectStore((s) => s.updateDraft)
  const step = useCreateProjectStore((s) => s.step)
  const created = useCreateProjectStore((s) => s.created)
  const projectCreated = useCreateProjectStore((s) => s.projectCreated)
  const resetDraft = useCreateProjectStore((s) => s.reset)
  const openInvite = useUiStore((s) => s.openInvite)
  const inviteOpen = useUiStore((s) => s.inviteDialog !== null)
  const create = useCreateProject()
  const [errors, setErrors] = useState<FieldErrors>({})

  // A refresh during step 2 comes back here: reopen the invite popup for the project already created.
  useEffect(() => {
    if (step === 'invite' && created && !inviteOpen) {
      openInvite({ projectId: created.id, projectName: created.name, mode: 'onboarding' })
    }
  }, [step, created, inviteOpen, openInvite])

  const repo = repoFullName(draft.repo)
  const canCreate = draft.name.trim() !== '' && draft.repo.trim() !== '' && !create.isPending && step === 'details'

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canCreate) return
    if (!REPO_PATTERN.test(repo)) {
      setErrors({ repo: 'Use the form owner/repo, or paste the repository URL.' })
      return
    }
    setErrors({})
    create.mutate(
      { name: draft.name, repo, description: draft.description },
      {
        onSuccess: (project) => {
          projectCreated({ id: project.id, name: project.name })
          openInvite({ projectId: project.id, projectName: project.name, mode: 'onboarding' })
        },
        onError: (error) => setErrors(errorsFrom(error)),
      },
    )
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Link to={paths.projects()} className={buttonClass('ghost', 'md', styles.back)}>
          <ChevronLeft />
          Projects
        </Link>
        <div>
          <div className="eyebrow">Step 1 of 3</div>
          <h1 className={styles.title}>Create a project</h1>
          <p className={styles.lead}>Connect one GitHub repository. Trakr only reads it; nothing in GitHub changes.</p>
        </div>

        <Field label="Project name" error={errors.name}>
          {({ inputId, describedBy }) => (
            <TextInput
              id={inputId}
              value={draft.name}
              onChange={(e) => {
                updateDraft({ name: e.target.value })
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy}
              maxLength={120}
              required
              autoFocus
            />
          )}
        </Field>

        <Field
          label="GitHub repository"
          error={errors.repo}
          hint={
            <span className={styles.hintText}>
              <Lock size={15} />
              Read-only access. Trakr reads issues; it never writes to GitHub.
            </span>
          }
        >
          {({ inputId, describedBy }) => (
            <TextInput
              id={inputId}
              value={draft.repo}
              onChange={(e) => {
                updateDraft({ repo: e.target.value })
                if (errors.repo) setErrors((prev) => ({ ...prev, repo: undefined }))
              }}
              placeholder="owner/repo or paste the repo URL"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(errors.repo)}
              aria-describedby={describedBy}
              required
            />
          )}
        </Field>

        {errors.form && (
          <p className={styles.createError} role="alert">
            {errors.form}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={!canCreate} loading={create.isPending}>
            Create project
          </Button>
          <Link to={paths.projects()} className={buttonClass('secondary')} onClick={resetDraft}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
