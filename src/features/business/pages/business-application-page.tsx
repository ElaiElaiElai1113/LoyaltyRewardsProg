import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'
import { isRewardMeExperience } from '@/lib/rewardme-experience'
import {
  rewardMeCommissionAgreement,
  rewardMeCreditAgreement,
} from '@/features/business/content/rewardme-business-agreements'

import './business-application-page.css'

type ApplicationModel = 'commission' | 'credit'
type SubmitState = 'idle' | 'submitting' | 'complete'

const rateOptions = ['20% back (minimum)', '30% back', '50% back', '100% back', 'Under 20% (high-ticket category)']

function clean(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim()
}

function BusinessApplicationPage({ model }: { model: ApplicationModel }) {
  const { program } = useTenant()
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [summary, setSummary] = useState({ business: '', representative: '', email: '' })
  const isRewardsFamily = isRewardMeExperience(program.slug)
  const isWondertown = program.slug === 'wondertown'
  const modelName = model === 'commission' ? 'Commission Model' : 'Credit Model'
  const agreement = model === 'commission' ? rewardMeCommissionAgreement : rewardMeCreditAgreement

  if (!isRewardsFamily) return <Navigate replace to="/business" />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const element = event.currentTarget
    if (!element.reportValidity()) return
    const form = new FormData(element)
    if (clean(form, 'companyWebsite')) return

    setState('submitting')
    setError('')
    const payload = {
      model,
      hostname: window.location.hostname,
      legalName: clean(form, 'legalName'),
      dba: clean(form, 'dba'),
      industry: clean(form, 'industry'),
      street: clean(form, 'street'),
      city: clean(form, 'city'),
      region: clean(form, 'region'),
      postal: clean(form, 'postal'),
      country: clean(form, 'country'),
      website: clean(form, 'website'),
      offPeak: clean(form, 'offPeak'),
      representativeName: clean(form, 'representativeName'),
      representativeTitle: clean(form, 'representativeTitle'),
      representativeEmail: clean(form, 'representativeEmail'),
      representativePhone: clean(form, 'representativePhone'),
      rewardRate: clean(form, 'rewardRate'),
      redemptionAccess: clean(form, 'redemptionAccess'),
      creditMethod: model === 'credit' ? clean(form, 'creditMethod') : '',
      disclosureVersion: 'business-application-v1',
      contactConsent: form.get('contactConsent') === 'on',
    }

    try {
      const response = await fetch('/api/business-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({})) as { reference?: string; error?: string }
      if (!response.ok || !result.reference) throw new Error(result.error || 'The application could not be submitted.')
      setReference(result.reference)
      setSummary({ business: payload.legalName, representative: payload.representativeName, email: payload.representativeEmail })
      setState('complete')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The application could not be submitted.')
      setState('idle')
    }
  }

  return (
    <main className="rewardme-application" data-business-application={model}>
      <header className="rewardme-application__header"><Link to="/" className="rewardme-application__logo"><span aria-hidden="true">✦</span>{program.name}</Link><Link to="/business">Back to business overview</Link></header>
      <section className="rewardme-application__hero">
        <h1>Join {program.name} — {modelName}.</h1>
        <span>Fill out your business details, review the terms, and click to agree below. No printing, no separate paperwork — this page is your complete application.{isWondertown ? ' Use fictional test information only; this sandbox submission creates no real offer or commercial relationship.' : ''}</span>
      </section>

      {state === 'complete' ? (
        <section className="rewardme-application__confirmation" aria-live="polite">
          <h2>You're in — application received.</h2><span>Thanks, {summary.representative}. We've recorded {summary.business}'s agreement and application on the {modelName}.</span><strong>Reference number: {reference}</strong><span>We'll follow up at {summary.email} with your onboarding details{model === 'commission' ? ' and commission invoicing schedule.' : ', credit-issuance setup, and commission invoicing schedule.'}</span><Link to="/business">Return to business overview</Link>
        </section>
      ) : (
        <form className="rewardme-application__form" onSubmit={submit}>
          <input className="rewardme-application__honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <fieldset><legend><span>1</span> Business information</legend><div className="rewardme-application__grid">
            <label className="is-full">Legal business name <b>*</b><input name="legalName" required maxLength={140} /></label>
            <label>Trade name / DBA (if different)<input name="dba" maxLength={140} /></label>
            <label>Industry / type of business <b>*</b><input name="industry" required maxLength={100} placeholder="e.g. Restaurant, Hotel, Salon" /></label>
            <label className="is-full">Business address <b>*</b><input name="street" required maxLength={180} placeholder="Street address" /></label>
            <label>City <b>*</b><input name="city" required maxLength={100} /></label><label>State / Province <b>*</b><input name="region" required maxLength={100} /></label>
            <label>Postal code <b>*</b><input name="postal" required maxLength={30} /></label><label>Country <b>*</b><input name="country" required maxLength={100} /></label>
            <label>Website / social page (optional)<input name="website" maxLength={200} placeholder="www.yourbusiness.com" /></label><label>Slow / off-peak times (optional)<input name="offPeak" maxLength={160} placeholder="e.g. Weekday afternoons" /></label>
          </div></fieldset>
          <fieldset><legend><span>2</span> Authorized representative</legend><div className="rewardme-application__grid">
            <label>Full name <b>*</b><input name="representativeName" required maxLength={100} /></label><label>Title / position <b>*</b><input name="representativeTitle" required maxLength={100} placeholder="e.g. Owner, General Manager" /></label>
            <label>Email <b>*</b><input name="representativeEmail" type="email" required maxLength={160} /></label><label>Phone <b>*</b><input name="representativePhone" type="tel" required maxLength={50} /></label>
          </div></fieldset>
          <fieldset><legend><span>3</span> Proposed reward offer</legend><div className="rewardme-application__grid">
            <label>Standard reward rate <b>*</b><select name="rewardRate" required defaultValue=""><option value="" disabled>Select one</option>{rateOptions.map((rate) => <option key={rate}>{rate}</option>)}</select></label>
            <label>Redemption access<select name="redemptionAccess" required defaultValue="earn-and-redeem"><option value="earn-and-redeem">Members can earn and redeem here</option><option value="earn-only">Earn-only (no redemption at my business)</option></select></label>
            {model === 'credit' ? <label className="is-full">How you'd like to issue credit (optional)<input name="creditMethod" maxLength={180} placeholder="e.g. in-store account credit or gift-card balance" /></label> : null}
          </div></fieldset>
          <fieldset><legend><span>4</span> RewardMe Business Agreement ({modelName})</legend>
            <div className="rewardme-application__disclosure" tabIndex={0}>
              {isWondertown ? <p>Wondertown is a fictional RewardMe test environment. Submit fictional test information only; no application submitted here can activate a real offer, payment, or business relationship.</p> : null}
              {agreement.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}
            </div>
            <label className="rewardme-application__agree"><input type="checkbox" name="contactConsent" required />I have read and agree to the RewardMe Business Agreement ({modelName}) above, on behalf of the business named in this form.</label>
          </fieldset>
          {error ? <p className="rewardme-application__error" role="alert">{error}</p> : null}
          <div className="rewardme-application__submit"><button disabled={state === 'submitting'} type="submit">{state === 'submitting' ? 'Submitting…' : 'Submit Application'}</button><span>Questions about the {modelName}? Contact your RewardMe representative before submitting. <a href={`mailto:${program.supportEmail}`}>{program.supportEmail}</a></span></div>
        </form>
      )}
    </main>
  )
}

export function CommissionBusinessApplicationPage() { return <BusinessApplicationPage model="commission" /> }
export function CreditBusinessApplicationPage() { return <BusinessApplicationPage model="credit" /> }
