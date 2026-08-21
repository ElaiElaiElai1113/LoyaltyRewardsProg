/* eslint-disable react-refresh/only-export-components -- browser-only Playwright fixture exports its mount helper. */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CompactRecordList, CompactRecordRow } from '../../../src/components/ui/compact-record-list'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../src/components/ui/select'

const catalogItems = [
  'Workflow Gift Card wondertown-1787144783546 - USD 50.00',
  'A deliberately long catalog item name that must never widen a phone viewport - USD 100.00',
]

function SelectField({ label, items }: { label: string; items: string[] }) {
  const [value, setValue] = useState('')

  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-sm font-bold">{label}</span>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={`Choose ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function ResponsivePortalHarness() {
  return (
    <section className="mx-auto min-w-0 max-w-6xl space-y-6 px-4 py-6" data-testid="responsive-portal-harness">
      <article className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
        <h2 className="break-words font-serif text-3xl">Give a customer a gift card</h2>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2" data-testid="issue-selectors">
          <SelectField label="Gift card" items={catalogItems} />
          <SelectField
            label="Customer"
            items={['A Customer With A Very Long Name - customer-with-a-long-email-address@wondertown.test']}
          />
        </div>
        <div className="mt-5 flex justify-end">
          <button className="h-12 w-full rounded-full border px-6 text-sm font-semibold sm:w-auto" data-testid="issue-card-action">
            Issue Card
          </button>
        </div>
      </article>

      <CompactRecordList aria-label="Responsive members">
        <CompactRecordRow className="flex min-w-0 flex-col gap-3 overflow-hidden lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 lg:items-center">
            <div className="size-10 shrink-0 rounded-xl bg-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg">E2E Agreement Pending Customer</p>
              <p className="truncate text-sm">agreement-pending-customer-with-long-address@wondertown.test</p>
              <p className="block min-w-0 max-w-full truncate text-xs">ID: 60C1574B-E484-470C-A7C1-91B1E81BC21E</p>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 pl-0 sm:pl-[3.25rem] lg:w-auto lg:justify-end lg:pl-0">
            {['CUSTOMER', 'ID MISSING', 'UNDER REVIEW', '0 POINTS', '0 REWARD CREDITS'].map((label) => (
              <span className="max-w-full rounded-full border px-2.5 py-1 text-xs font-bold" key={label}>{label}</span>
            ))}
            <button className="rounded-full border px-3 py-2 text-sm">View Profile</button>
            <button className="rounded-full border px-3 py-2 text-sm">Remove</button>
          </div>
        </CompactRecordRow>
      </CompactRecordList>
    </section>
  )
}

export function mountResponsivePortalHarness(host: HTMLElement) {
  const root = createRoot(host)
  root.render(<ResponsivePortalHarness />)
  return root
}
