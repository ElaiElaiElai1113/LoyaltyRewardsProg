import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'
import { isRewardMeExperience } from '@/lib/rewardme-experience'
import { useLanguage } from '@/lib/language'
import {
  rewardMeCommissionAgreement,
  rewardMeCreditAgreement,
} from '@/features/business/content/rewardme-business-agreements'

import './business-application-page.css'

type ApplicationModel = 'commission' | 'credit'
type SubmitState = 'idle' | 'submitting' | 'complete'

// Keep submitted values in the API's canonical language when labels are translated.
const rateOptions = [
  { value: '20% back', label: '20% back (minimum)' },
  { value: '30% back', label: '30% back' },
  { value: '50% back', label: '50% back' },
  { value: '100% back', label: '100% back' },
  { value: 'Other — discuss with the team', label: 'Under 20% (high-ticket category)' },
]

function clean(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim()
}

function clearValidation(event: FormEvent<HTMLFormElement>) {
  const field = event.target
  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.setCustomValidity('')
}

function BusinessApplicationPage({ model }: { model: ApplicationModel }) {
  const { program } = useTenant()
  const { t, language } = useLanguage()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [summary, setSummary] = useState({ business: '', representative: '', email: '' })
  const isRewardsFamily = isRewardMeExperience(program.slug)
  const isWondertown = program.slug === 'wondertown'
  const modelName = t(model === 'commission' ? 'Commission Model' : 'Credit Model')
  const agreement = model === 'commission' ? rewardMeCommissionAgreement : rewardMeCreditAgreement

  useEffect(() => {
    // Native validation messages must be recalculated in the newly selected language.
    formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
      .forEach((field) => field.setCustomValidity(''))
  }, [language])

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
      <header className="rewardme-application__header"><Link to="/" className="rewardme-application__logo"><span aria-hidden="true">✦</span>{program.name}</Link><Link to="/business">{t('Back to business overview')}</Link></header>
      <section className="rewardme-application__hero">
        <h1>{t('Join {program} — {model}.', { program: program.name, model: modelName })}</h1>
        <span>{t('Fill out your business details, review the terms, and click to agree below. No printing, no separate paperwork — this page is your complete application.')}{isWondertown ? <> {t('Use fictional test information only; this sandbox submission creates no real offer or commercial relationship.')}</> : null}</span>
      </section>

      {state === 'complete' ? (
        <section className="rewardme-application__confirmation" aria-live="polite">
          <h2>{t("You're in — application received.")}</h2>
          <span>{t("Thanks, {representative}. We've recorded {business}'s agreement and application on the {model}.", { ...summary, model: modelName })}</span>
          <strong>{t('Reference number: {reference}', { reference })}</strong>
          <span>{model === 'commission'
            ? t("We'll follow up at {email} with your onboarding details and commission invoicing schedule.", { email: summary.email })
            : t("We'll follow up at {email} with your onboarding details, credit-issuance setup, and commission invoicing schedule.", { email: summary.email })}</span>
          <Link to="/business">{t('Return to business overview')}</Link>
        </section>
      ) : (
        <form
          ref={formRef}
          className="rewardme-application__form"
          onSubmit={submit}
          onInvalid={(event) => {
            const field = event.target
            if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return
            field.setCustomValidity(field.validity.valueMissing
              ? t(field.type === 'checkbox' ? 'Accept the agreement to continue.' : 'Please fill out this field.')
              : t('Enter a valid email'))
          }}
          onInput={clearValidation}
          onChange={clearValidation}
        >
          <input className="rewardme-application__honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <fieldset><legend><span>1</span> {t('Business information')}</legend><div className="rewardme-application__grid">
            <label className="is-full">{t('Legal business name')} <b>*</b><input name="legalName" required maxLength={140} /></label>
            <label>{t('Trade name / DBA (if different)')}<input name="dba" maxLength={140} /></label>
            <label>{t('Industry / type of business')} <b>*</b><input name="industry" required maxLength={100} placeholder={t('e.g. Restaurant, Hotel, Salon')} /></label>
            <label className="is-full">{t('Business address')} <b>*</b><input name="street" required maxLength={180} placeholder={t('Street address')} /></label>
            <label>{t('City')} <b>*</b><input name="city" required maxLength={100} /></label><label>{t('State / Province')} <b>*</b><input name="region" required maxLength={100} /></label>
            <label>{t('Postal code')} <b>*</b><input name="postal" required maxLength={30} /></label><label>{t('Country')} <b>*</b><input name="country" required maxLength={100} /></label>
            <label>{t('Website / social page (optional)')}<input name="website" maxLength={200} placeholder="www.yourbusiness.com" /></label><label>{t('Slow / off-peak times (optional)')}<input name="offPeak" maxLength={160} placeholder={t('e.g. Weekday afternoons')} /></label>
          </div></fieldset>
          <fieldset><legend><span>2</span> {t('Authorized representative')}</legend><div className="rewardme-application__grid">
            <label>{t('Full name')} <b>*</b><input name="representativeName" required maxLength={100} /></label><label>{t('Title / position')} <b>*</b><input name="representativeTitle" required maxLength={100} placeholder={t('e.g. Owner, General Manager')} /></label>
            <label>{t('Email')} <b>*</b><input name="representativeEmail" type="email" required maxLength={160} /></label><label>{t('Phone')} <b>*</b><input name="representativePhone" type="tel" required maxLength={50} /></label>
          </div></fieldset>
          <fieldset><legend><span>3</span> {t('Proposed reward offer')}</legend><div className="rewardme-application__grid">
            <label>{t('Standard reward rate')} <b>*</b><select name="rewardRate" required defaultValue=""><option value="" disabled>{t('Select one')}</option>{rateOptions.map((rate) => <option key={rate.value} value={rate.value}>{t(rate.label)}</option>)}</select></label>
            <label>{t('Redemption access')}<select name="redemptionAccess" required defaultValue="earn-and-redeem"><option value="earn-and-redeem">{t('Members can earn and redeem here')}</option><option value="earn-only">{t('Earn-only (no redemption at my business)')}</option></select></label>
            {model === 'credit' ? <label className="is-full">{t("How you'd like to issue credit (optional)")}<input name="creditMethod" maxLength={180} placeholder={t('e.g. in-store account credit or gift-card balance')} /></label> : null}
          </div></fieldset>
          <fieldset><legend><span>4</span> {t('RewardMe Business Agreement ({model})', { model: modelName })}</legend>
            <div className="rewardme-application__disclosure" tabIndex={0}>
              {isWondertown ? <p>{t('Wondertown is a fictional RewardMe test environment. Submit fictional test information only; no application submitted here can activate a real offer, payment, or business relationship.')}</p> : null}
              {agreement.map((section) => <section key={section.title}><h2>{t(section.title)}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{t(paragraph)}</p>)}{section.items ? <ul>{section.items.map((item) => <li key={item}>{t(item)}</li>)}</ul> : null}</section>)}
            </div>
            <label className="rewardme-application__agree"><input type="checkbox" name="contactConsent" required />{t('I have read and agree to the RewardMe Business Agreement ({model}) above, on behalf of the business named in this form.', { model: modelName })}</label>
          </fieldset>
          {error ? <p className="rewardme-application__error" role="alert">{language === 'es' && t(error) === error ? t('The application could not be submitted.') : t(error)}</p> : null}
          <div className="rewardme-application__submit"><button disabled={state === 'submitting'} type="submit">{state === 'submitting' ? t('Submitting…') : t('Submit Application')}</button><span>{t('Questions about the {model}? Contact your RewardMe representative before submitting.', { model: modelName })} <a href={`mailto:${program.supportEmail}`}>{program.supportEmail}</a></span></div>
        </form>
      )}
    </main>
  )
}

export function CommissionBusinessApplicationPage() { return <BusinessApplicationPage model="commission" /> }
export function CreditBusinessApplicationPage() { return <BusinessApplicationPage model="credit" /> }
