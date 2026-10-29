import { useLanguage } from '@/lib/language'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'
import { isRewardMeExperience } from '@/lib/rewardme-experience'
import { beginApplicationRequest, readApplicationRequest, type ApplicationRequest } from '@/features/business/business-application-request'

import './business-application-page.css'

type ApplicationModel = 'commission' | 'credit'
type SubmitState = 'idle' | 'submitting' | 'complete'

const rateOptions = ['20% back', '30% back', '50% back', '100% back', 'Other — discuss with the team']

function clean(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim()
}

function BusinessApplicationPage({ model }: { model: ApplicationModel }) {
  const { program } = useTenant()
  const { t } = useLanguage()
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [summary, setSummary] = useState({ business: '', representative: '', email: '' })
  const isRewardsFamily = isRewardMeExperience(program.slug)
  const isWondertown = program.slug === 'wondertown'
  const modelName = model === 'commission' ? 'Commission Model' : 'Credit Model'
  const formRef = useRef<HTMLFormElement>(null)
  const inFlight = useRef(false)
  const key = 'rewards:business-application:' + window.location.hostname + ':' + model
  const [pending, setPending] = useState<ApplicationRequest|null>(null)
  useEffect(() => {
    try {
      const saved = readApplicationRequest(localStorage,key)
      setPending(saved)
      if(saved) for(const [name,value] of Object.entries(saved.payload)) {
        const input=formRef.current?.elements.namedItem(name)
        if(input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
          if(input instanceof HTMLInputElement && input.type==='checkbox') input.checked=value===true
          else input.value=String(value ?? '')
        }
      }
    } catch(error) {setError(error instanceof Error ? error.message : 'Saved application unavailable.')}
  },[key])

  if (!isRewardsFamily) return <Navigate replace to="/business" />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const element = event.currentTarget
    if (inFlight.current || (!pending && !element.reportValidity())) return
    const form = new FormData(element)
    if (clean(form, 'companyWebsite')) return

    inFlight.current = true
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
      disclosureVersion: 'application-review-v1',
      contactConsent: form.get('contactConsent') === 'on',
    }

    try {
      if(!navigator.locks) throw new Error('This browser cannot safely coordinate applications. Please use a supported browser.')
      await navigator.locks.request(key,{ifAvailable:true},async lock => {
      if(!lock) throw new Error('This application is being submitted in another tab.')
      const intent=beginApplicationRequest(localStorage,key,pending?.payload ?? payload)
      setPending(intent)
      const response = await fetch('/api/business-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...intent.payload,requestId:intent.requestId}),
      })
      const result = await response.json().catch(() => ({})) as { reference?: string; error?: string; noCommit?: boolean }
      if (!response.ok || !result.reference) {
        if(result.noCommit === true) {localStorage.removeItem(key);setPending(null)}
        throw new Error(result.error || 'The application could not be submitted.')
      }
      localStorage.removeItem(key)
      setPending(null)
      setReference(result.reference)
      setSummary({ business: String(intent.payload.legalName), representative: String(intent.payload.representativeName), email: String(intent.payload.representativeEmail) })
      setState('complete')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The application could not be submitted.')
      setState('idle')
    } finally { inFlight.current=false }
  }

  return (
    <main className="rewardme-application" data-business-application={model}>
      <header className="rewardme-application__header"><Link to="/" className="rewardme-application__logo">{program.slug === 'pinas' ? <img className="rewardme-application__client-logo" src="/rewardme-client-logo-132.webp" width="33" height="27" alt="" aria-hidden="true" /> : <span aria-hidden="true">✦</span>}{program.name}</Link><Link to="/business">{t("Back to business overview")}</Link></header>
      <section className="rewardme-application__hero">
        <h1>{t('Join {brand} — {model}.',{brand:program.name,model:t(modelName)})}</h1>
        <span>{t("Share your business details and proposed offer for review. Any commercial terms will require separate approval and acceptance.")}{isWondertown ? ' Use fictional test information only; this sandbox submission creates no real offer or commercial relationship.' : ''}</span>
      </section>

      {state === 'complete' ? (
        <section className="rewardme-application__confirmation" aria-live="polite">
          <h2>{t('Application received.')}</h2><span>{t('Thanks, {name}. We received the application for {business}. No activation or commercial agreement has been approved.',{name:summary.representative,business:summary.business})}</span><strong>{t('Reference number:')} {reference}</strong><span>{t('We will follow up at {email} about the review and next steps.',{email:summary.email})}</span><Link to="/business">{t("Return to business overview")}</Link>
        </section>
      ) : (
        <form className="rewardme-application__form" ref={formRef} onSubmit={submit}>
          <input className="rewardme-application__honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <fieldset disabled={pending !== null}><legend><span>1</span>{t("Business information")}</legend><div className="rewardme-application__grid">
            <label className="is-full"><span>{t("Legal business name")}<b>*</b></span><input name="legalName" required maxLength={140} /></label>
            <label><span>{t("Trade name / DBA (if different)")}</span><input name="dba" maxLength={140} /></label>
            <label><span>{t("Industry / type of business")}<b>*</b></span><input name="industry" required maxLength={100} placeholder={t("e.g. Restaurant, Hotel, Salon")} /></label>
            <label className="is-full"><span>{t("Business address")}<b>*</b></span><input name="street" required maxLength={180} placeholder={t("Street address")} /></label>
            <label><span>{t("City")}<b>*</b></span><input name="city" required maxLength={100} /></label><label><span>{t("State / Province")}<b>*</b></span><input name="region" required maxLength={100} /></label>
            <label><span>{t("Postal code")}<b>*</b></span><input name="postal" required maxLength={30} /></label><label><span>{t("Country")}<b>*</b></span><input name="country" required maxLength={100} /></label>
            <label><span>{t("Website / social page (optional)")}</span><input name="website" maxLength={200} placeholder={t("www.yourbusiness.com")} /></label><label><span>{t("Slow / off-peak times (optional)")}</span><input name="offPeak" maxLength={160} placeholder={t("e.g. Weekday afternoons")} /></label>
          </div></fieldset>
          <fieldset disabled={pending !== null}><legend><span>2</span>{t("Authorized representative")}</legend><div className="rewardme-application__grid">
            <label><span>{t("Full name")}<b>*</b></span><input name="representativeName" required maxLength={100} /></label><label><span>{t("Title / position")}<b>*</b></span><input name="representativeTitle" required maxLength={100} placeholder={t("e.g. Owner, General Manager")} /></label>
            <label><span>{t("Email")}<b>*</b></span><input name="representativeEmail" type="email" required maxLength={160} /></label><label><span>{t("Phone")}<b>*</b></span><input name="representativePhone" type="tel" required maxLength={50} /></label>
          </div></fieldset>
          <fieldset disabled={pending !== null}><legend><span>3</span>{t("Proposed reward offer")}</legend><div className="rewardme-application__grid">
            <label><span>{t("Standard reward rate")}<b>*</b></span><select name="rewardRate" required defaultValue=""><option value="" disabled>{t("Select one")}</option>{rateOptions.map((rate) => <option key={rate}>{t(rate)}</option>)}</select></label>
            <label><span>{t("Redemption access")}</span><select name="redemptionAccess" required defaultValue="earn-and-redeem"><option value="earn-and-redeem">{t("Members can earn and redeem here")}</option><option value="earn-only">{t("Earn-only (no redemption at my business)")}</option></select></label>
            {model === 'credit' ? <label className="is-full"><span>{t("How you'd like to issue credit (optional)")}</span><input name="creditMethod" maxLength={180} placeholder={t("e.g. in-store account credit or gift-card balance")} /></label> : null}
          </div></fieldset>
          <fieldset disabled={pending !== null}><legend><span>4</span>{t("Application review acknowledgement")}</legend>
            <div className="rewardme-application__disclosure" tabIndex={0}>
              {isWondertown ? <p>{t("Wondertown is a fictional RewardMe test environment. Submit fictional test information only; no application submitted here can activate a real offer, payment, or business relationship.")}</p> : null}
              <p>{t("This is an application for review. Contact consent permits follow-up about this application. Submission does not accept commercial terms, approve membership, activate a business, or authorize payment.")}</p>
            </div>
            <label className="rewardme-application__agree"><input type="checkbox" name="contactConsent" required />{t("I consent to being contacted about this application and understand that submission is for review only.")}</label>
          </fieldset>
          {pending ? <p role="status">{t("Your application is awaiting confirmation. Retry sends the same saved details without creating another application.")}</p> : null}
          {error ? <p className="rewardme-application__error" role="alert">{error}</p> : null}
          <div className="rewardme-application__submit"><button disabled={state === 'submitting'} type="submit">{t(state === 'submitting' ? 'Submitting…' : pending ? 'Retry application' : 'Submit Application')}</button><span>{t('Questions about {model}? Contact your representative before submitting.',{model:t(modelName)})} <a href={`mailto:${program.supportEmail}`}>{program.supportEmail}</a></span></div>
        </form>
      )}
    </main>
  )
}

export function CommissionBusinessApplicationPage() { return <BusinessApplicationPage model="commission" /> }
export function CreditBusinessApplicationPage() { return <BusinessApplicationPage model="credit" /> }
