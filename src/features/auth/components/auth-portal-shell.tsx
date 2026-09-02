import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { isRewardMeExperience } from '@/lib/rewardme-experience'

type AuthPortalShellProps = {
  activeTab?: 'signin' | 'signup'
  children: ReactNode
  showTabs?: boolean
  showUtilityControls?: boolean
}

function tabClass(isActive: boolean) {
  return [
    'flex h-10 flex-1 items-center justify-center rounded-[9px] text-[13px] font-semibold transition',
    isActive
      ? 'bg-[#d1ad4a] text-[#060606]'
      : 'text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--surface-container-highest)_34%,transparent)] hover:text-[#d1ad4a]',
  ].join(' ')
}

export function AuthPortalShell({
  activeTab,
  children,
  showTabs = true,
  showUtilityControls = true,
}: AuthPortalShellProps) {
  const { t } = useLanguage()
  const { program } = useTenant()
  const isRewardMe = isRewardMeExperience(program.slug)

  const utilityControls = showUtilityControls ? (
    <div className="product-auth-shell__utilities flex w-full items-center justify-between gap-3 text-[var(--foreground)]">
      <Link
        to="/landing-page"
        className="inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-[#d1ad4a]/35 bg-[color-mix(in_srgb,var(--surface-container-lowest)_82%,transparent)] px-3 text-[12px] font-semibold text-[#d1ad4a] transition hover:bg-[#d1ad4a] hover:text-[#060606]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('Back')}
      </Link>
      <div className="flex items-center gap-2">
        <LanguagePicker className="text-current" compact condenseOnNarrowScreens />
        <ThemeToggle className="border border-[#d1ad4a]/45 bg-[color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] text-[#d1ad4a] hover:bg-[#d1ad4a] hover:text-[#060606]" />
      </div>
    </div>
  ) : null

  const tabs = showTabs ? (
    <nav className="product-auth-shell__tabs grid h-[42px] w-full grid-cols-2 rounded-[10px] border border-[#d1ad4a] bg-[color-mix(in_srgb,var(--surface-container-lowest)_94%,var(--espresso))] p-0">
      <Link to="/signin" className={tabClass(activeTab === 'signin')}>
        {t('Sign in')}
      </Link>
      <Link to="/join" className={tabClass(activeTab === 'signup')}>
        {t('Create account')}
      </Link>
    </nav>
  ) : null

  if (isRewardMe) {
    const isJoining = activeTab === 'signup'

    return (
      <main
        className="auth-portal-shell product-auth-shell rewardme-auth-shell relative min-h-screen overflow-hidden"
        data-rewardme-auth-shell
        data-wondertown-rewardme-mirror={program.slug === 'wondertown' || undefined}
      >
        <div className="auth-portal-backdrop pointer-events-none absolute inset-0" />
        <div className="rewardme-auth-shell__page relative z-10 mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 sm:px-8">
          <header className="rewardme-auth-shell__header flex items-center justify-between gap-5 border-b py-5">
            <Link to="/landing-page" className="rewardme-auth-shell__brand" aria-label={t('{brand} homepage', { brand: program.name })}>
              <BrandLogo showText={false} markClassName="h-8 w-auto" />
              <span className="rewardme-auth-shell__brand-name">{program.name}</span>
            </Link>
            {utilityControls}
          </header>

          <div className="product-auth-shell__frame rewardme-auth-shell__frame grid w-full flex-1 items-center gap-0 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:py-14">
            <section className="rewardme-auth-shell__story flex min-h-[500px] flex-col justify-between p-8 sm:p-12 lg:p-14">
              <div>
                <p className="rewardme-auth-shell__eyebrow">
                  {t(isJoining ? 'Three months free to join' : 'Sign in')}
                </p>
                <h2>{t(isJoining ? 'Join with no card required' : 'One account. Clear offers. Local rewards.')}</h2>
                <p className="rewardme-auth-shell__lede">
                  {t(isJoining
                    ? 'Create your account with your name, email, and phone. Your first three months are free access while you explore the program.'
                    : 'Enter your email and password. We will open the workspace assigned to your account.')}
                </p>
              </div>

              <div className="rewardme-auth-shell__ledger" aria-hidden="true">
                <div><span>{t('Member account')}</span><strong>{program.name}</strong></div>
                <div><span>{t('Offer terms')}</span><strong>{t('Published')}</strong></div>
                <div><span>{t('Your account')}</span><strong>{t('Available now')}</strong></div>
              </div>
            </section>

            <div className="rewardme-auth-shell__form-column flex min-w-0 flex-col">
              {tabs}
              <section className={`product-auth-shell__card ${showTabs ? 'mt-5' : ''} w-full border px-6 py-8 sm:px-9 sm:py-10`}>
                {children}
              </section>
            </div>
          </div>

          <footer className="rewardme-auth-shell__footer border-t py-5 text-center text-xs">
            {t(program.slug === 'wondertown'
              ? 'Production-equivalent RewardMe flows with fictional test data.'
              : 'Join with your name, email, and phone. No payment card is collected online.')}
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-portal-shell product-auth-shell relative flex min-h-screen items-start justify-center overflow-hidden bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
      <div
        className="auth-portal-backdrop pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, color-mix(in srgb, var(--champagne) 30%, transparent) 0%, color-mix(in srgb, var(--surface-container-highest) 58%, transparent) 34%, color-mix(in srgb, var(--surface-container-lowest) 88%, transparent) 76%), linear-gradient(135deg, var(--surface-container-lowest) 0%, var(--background) 46%, var(--surface-container-low) 100%)',
        }}
      />
      <div className="product-auth-shell__frame relative z-10 flex w-full max-w-[420px] flex-col items-center">
        {showUtilityControls ? <div className="mb-4 w-full">{utilityControls}</div> : null}

        {tabs}

        <section className={`product-auth-shell__card ${showTabs ? 'mt-8' : 'mt-4'} w-full rounded-[12px] border border-[#d1ad4a] bg-[color-mix(in_srgb,var(--surface-container-lowest)_94%,var(--espresso))] px-8 pb-9 pt-9 text-[var(--foreground)] shadow-[0_18px_60px_rgba(0,0,0,0.25)] sm:px-8`}>
          {children}
        </section>
      </div>
    </main>
  )
}
