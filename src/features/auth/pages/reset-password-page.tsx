import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { PASSWORD_MIN_LENGTH, type PasswordSetupType } from '@/lib/password-setup'
import { getHomePathForRole } from '@/lib/role-routes'

const resetPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
    confirmPassword: z.string().min(PASSWORD_MIN_LENGTH, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage({ flow = 'recovery' }: { flow?: PasswordSetupType }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const isInvitation = flow === 'invite'
  const linkLabel = isInvitation ? 'invitation' : 'reset'
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let isMounted = true

    void authService
      .ensurePasswordSetupSession(flow)
      .then((hasSession) => {
        if (!isMounted) return

        if (!hasSession) {
          setSessionError('Auth session missing. Open the latest {link} link again.')
          return
        }

        setSessionError(null)
        setIsSessionReady(true)
      })
      .catch((error) => {
        if (!isMounted) return

        setSessionError(
          error instanceof Error
            ? error.message
            : 'Auth session missing. Open the latest {link} link again.',
        )
      })

    return () => {
      isMounted = false
    }
  }, [flow, linkLabel])

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root')

    if (!isSessionReady) {
      form.setError('root', {
        message: sessionError ?? 'Auth session missing. Open the latest {link} link again.',
      })
      return
    }

    try {
      await authService.updatePassword(values.password)
      form.reset()
      if (isInvitation) {
        const profile = await authService.getSessionProfile()
        navigate(profile ? getHomePathForRole(profile.role) : '/signin', { replace: true })
      }
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Password could not be updated.',
      })
    }
  })

  return (
    <AuthPortalShell activeTab="signin">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#d1ad4a]">
            {isInvitation ? t('Accept Invitation') : t('Reset Password')}
          </p>
          <h1 className="font-serif text-3xl text-[var(--foreground)]">
            {isInvitation ? t('Create your password') : t('Set a new password')}
          </h1>
          <p className="text-sm font-medium leading-6 text-[var(--muted-foreground)]">
            {isInvitation
              ? t('Set a password to finish accepting your customer invitation.')
              : t('Use at least {count} characters for your new password.', { count: PASSWORD_MIN_LENGTH })}
          </p>
        </div>

        {!isSessionReady && !sessionError ? (
          <p className="text-center text-sm font-medium text-[var(--muted-foreground)]">
            {t('Preparing secure {link} session...', { link: t(linkLabel) })}
          </p>
        ) : null}

        {sessionError ? (
          <p className="text-center text-sm font-bold text-red-500">{t(sessionError, { link: t(linkLabel) })}</p>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="new-password">{t('New password')}</Label>
          <Input id="new-password" type="password" autoComplete="new-password" {...form.register('password')} />
          {form.formState.errors.password ? (
            <p className="text-xs font-bold text-red-500">{t(form.formState.errors.password.message ?? '')}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirm-password">{t('Confirm password')}</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs font-bold text-red-500">{t(form.formState.errors.confirmPassword.message ?? '')}</p>
          ) : null}
        </div>

        {form.formState.isSubmitSuccessful ? (
          <p className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-center text-sm font-bold text-success">
            {isInvitation
              ? t('Invitation accepted. Opening your account...')
              : t('Password updated. You can sign in with your new password.')}
          </p>
        ) : null}

        {form.formState.errors.root ? (
          <p className="text-center text-sm font-bold text-red-500">{t(form.formState.errors.root.message ?? '', { link: t(linkLabel) })}</p>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting || !isSessionReady}>
            {form.formState.isSubmitting ? t('Saving...') : t('Update password')}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/signin">{t('Back to sign in')}</Link>
          </Button>
        </div>
      </form>
    </AuthPortalShell>
  )
}
