import { KeyRound, LogIn, UserRound } from 'lucide-react'
import { Link } from 'react-router'

import {
  REWARDME_TEST_ACCOUNTS,
  REWARDME_TEST_PASSWORD,
  type RewardMeTestAccount,
  type RewardMeTestPortal,
} from '@/features/auth/rewardme-test-accounts'

type RewardMeTestCredentialsProps = {
  accounts?: readonly RewardMeTestAccount[]
  ariaLabel?: string
  currentPortal: RewardMeTestPortal
  description?: string
  onUse: (account: RewardMeTestAccount, password: string) => void
  password?: string
  testId?: string
  title?: string
}

export function RewardMeTestCredentials({
  accounts = REWARDME_TEST_ACCOUNTS,
  ariaLabel = 'RewardMe test accounts',
  currentPortal,
  description = 'Temporary testing access. Use only with non-production data.',
  onUse,
  password = REWARDME_TEST_PASSWORD,
  testId = 'rewardme-test-credentials',
  title = 'RewardMe test accounts',
}: RewardMeTestCredentialsProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="mt-6 rounded-[10px] border border-[#d1ad4a]/45 bg-[#d1ad4a]/[0.07] p-3.5"
      data-testid={testId}
    >
      <div className="flex items-start gap-2.5">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-[#d1ad4a]" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#d1ad4a]">
            {title}
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-[#8f8f8f]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[7px] border border-[#d1ad4a]/30 bg-black/15 px-3 py-2">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">
          Password for every test account
        </span>
        <code className="mt-1 block break-all text-[13px] font-bold text-[var(--foreground)]">
          {password}
        </code>
      </div>

      <div className="mt-3 grid gap-2">
        {accounts.map((account) => {
          const isCurrentPortal = account.portal === currentPortal

          return (
            <article
              className="grid min-w-0 gap-2 rounded-[7px] border border-[var(--border)] bg-[var(--background)]/45 px-3 py-2.5"
              key={account.email}
            >
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8f8f8f]">
                  <UserRound className="size-3" aria-hidden="true" />
                  {account.label}
                </span>
                <code className="mt-1 block break-words text-[12px] font-semibold text-[var(--foreground)] [overflow-wrap:anywhere]">
                  {account.email}
                </code>
              </div>

              {isCurrentPortal ? (
                <button
                  type="button"
                  className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[6px] border border-[#d1ad4a]/55 px-2.5 text-[11px] font-bold text-[#d1ad4a] transition hover:bg-[#d1ad4a] hover:text-[#080808]"
                  onClick={() => onUse(account, password)}
                >
                  <LogIn className="size-3.5" aria-hidden="true" />
                  Use account
                </button>
              ) : (
                <Link
                  to={account.portalPath}
                  className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[6px] border border-[var(--border)] px-2.5 text-[11px] font-bold text-[#8aa0bc] transition hover:border-[#d1ad4a]/55 hover:text-[#d1ad4a]"
                >
                  Open portal
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
