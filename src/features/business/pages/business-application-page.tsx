import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'
import { isRewardMeExperience } from '@/lib/rewardme-experience'

import './business-application-page.css'

type ApplicationModel = 'commission' | 'credit'
type SubmitState = 'idle' | 'submitting' | 'complete'

const rateOptions = ['20% back', '30% back', '50% back', '100% back', 'Other — discuss with the team']

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
  const modelName = model === 'commission' ? 'Commission Model' : 'Business-credit Model'

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
        <p>{isWondertown ? 'Sandbox business application' : 'Business application'}</p>
        <h1>Join {program.name} — {modelName}.</h1>
        <span>{model === 'commission' ? `${program.name} administers eligible member rewards under the signed commercial terms.` : 'Your business proposes how it will issue and honor eligible business credit.'}{isWondertown ? ' Use fictional test information only; this sandbox submission creates no real offer or commercial relationship.' : ''}</span>
      </section>

      {state === 'complete' ? (
        <section className="rewardme-application__confirmation" aria-live="polite">
          <p>● Application received</p><h2>Thank you, {summary.representative}.</h2><span>{summary.business}’s {modelName} application was recorded. The team will follow up at {summary.email}; no offer or commercial terms are active until review and a final agreement are complete.</span><strong>Reference: {reference}</strong><Link to="/business">Return to business overview</Link>
        </section>
      ) : (
        <form className="rewardme-application__form" onSubmit={submit}>
          <input className="rewardme-application__honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <fieldset><legend><span>1</span> Business information</legend><div className="rewardme-application__grid">
            <label className="is-full">Legal business name <b>*</b><input name="legalName" required maxLength={140} /></label>
            <label>Trade name / DBA <i>optional</i><input name="dba" maxLength={140} /></label>
            <label>Industry / type of business <b>*</b><input name="industry" required maxLength={100} placeholder="e.g. Restaurant, Hotel, Salon" /></label>
            <label className="is-full">Business address <b>*</b><input name="street" required maxLength={180} placeholder="Street address" /></label>
            <label>City <b>*</b><input name="city" required maxLength={100} /></label><label>State / Province <b>*</b><input name="region" required maxLength={100} /></label>
            <label>Postal code <b>*</b><input name="postal" required maxLength={30} /></label><label>Country <b>*</b><input name="country" required maxLength={100} /></label>
            <label>Website / social page <i>optional</i><input name="website" maxLength={200} placeholder="www.yourbusiness.com" /></label><label>Slow / off-peak times <i>optional</i><input name="offPeak" maxLength={160} placeholder="e.g. Weekday afternoons" /></label>
          </div></fieldset>
          <fieldset><legend><span>2</span> Authorized representative</legend><div className="rewardme-application__grid">
            <label>Full name <b>*</b><input name="representativeName" required maxLength={100} /></label><label>Title / position <b>*</b><input name="representativeTitle" required maxLength={100} placeholder="e.g. Owner, General Manager" /></label>
            <label>Email <b>*</b><input name="representativeEmail" type="email" required maxLength={160} /></label><label>Phone <b>*</b><input name="representativePhone" type="tel" required maxLength={50} /></label>
          </div></fieldset>
          <fieldset><legend><span>3</span> Proposed reward offer</legend><div className="rewardme-application__grid">
            <label>Standard reward rate <b>*</b><select name="rewardRate" required defaultValue=""><option value="" disabled>Select one</option>{rateOptions.map((rate) => <option key={rate}>{rate}</option>)}</select></label>
            <label>Member access <b>*</b><select name="redemptionAccess" required defaultValue="earn-and-redeem"><option value="earn-and-redeem">Members can earn and redeem here</option><option value="earn-only">Members can earn here only</option></select></label>
            {model === 'credit' ? <label className="is-full">How would you issue business credit? <i>optional</i><input name="creditMethod" maxLength={180} placeholder="e.g. in-store account credit or gift-card balance" /></label> : null}
          </div></fieldset>
          <fieldset><legend><span>4</span> Application disclosures</legend>
            <div className="rewardme-application__disclosure" tabIndex={0}>
              <h2>Important: this is an application, not the final commercial agreement.</h2>
              {isWondertown ? <p>Wondertown is a fictional RewardMe test environment. Submit fictional test information only; no application submitted here can activate a real offer, payment, or business relationship.</p> : null}
              <p>The information above lets {program.name} evaluate fit and prepare proposed commercial terms. Submitting does not activate a reward offer, create a payment obligation, or guarantee acceptance.</p>
              <p>The reward rate and access settings are proposals. Final rates, eligible purchases, caps, settlement timing, credit liability, reversals, disputes, termination, tax treatment, and other legal terms must be documented in a separate final agreement before launch.</p>
              <p>The representative confirms they are authorized to submit this application and that the supplied information is accurate. The program may contact the representative about evaluation and onboarding.</p>
            </div>
            <label className="rewardme-application__agree"><input type="checkbox" name="contactConsent" required />I confirm I am authorized to submit this application, acknowledge the disclosures above, and agree that {program.name} may contact me about this application.</label>
          </fieldset>
          {error ? <p className="rewardme-application__error" role="alert">{error}</p> : null}
          <div className="rewardme-application__submit"><button disabled={state === 'submitting'} type="submit">{state === 'submitting' ? 'Submitting…' : 'Submit application'}</button><span>Questions? <a href={`mailto:${program.supportEmail}`}>{program.supportEmail}</a></span></div>
        </form>
      )}
    </main>
  )
}

export function CommissionBusinessApplicationPage() { return <BusinessApplicationPage model="commission" /> }
export function CreditBusinessApplicationPage() { return <BusinessApplicationPage model="credit" /> }
