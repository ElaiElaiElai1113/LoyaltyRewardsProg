import { BusinessApplicationsPage } from '@/features/platform/pages/business-applications-page'
import { businessApplicationsService } from '@/integrations/supabase/services/business-applications-service'
// Local browser fixture: render the actual pages, replacing only backend dependencies.
// This file is outside src and is never imported by the production application.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context'
import { TenantContext } from '@/features/tenant/tenant-context'
import { getFallbackProgram, setActiveProgram } from '@/features/tenant/tenant-service'
import { LanguageProvider } from '@/lib/language'
import { LoyalityAuthPage } from '@/features/loyality/pages/loyality-auth-page'
import { LoyalityJoinPage } from '@/features/loyality/pages/loyality-join-page'
import { LoyalityOfferPage } from '@/features/loyality/pages/loyality-offer-page'
import { LoyalityCustomerDashboard } from '@/features/loyality/pages/loyality-customer-dashboard'
import { LoyalityBusinessGrowthPage } from '@/features/loyality/pages/loyality-business-growth-page'
import { loyalityService } from '@/features/loyality/loyality-service'
import { profileService } from '@/integrations/supabase/services/profile-service'
import type { Profile } from '@/types/domain'
import '@/index.css'

const program = { ...getFallbackProgram('loyality.localhost'), ...(localStorage.getItem('review-program-name') ? {name:localStorage.getItem('review-program-name')!} : {}), ...(localStorage.getItem('review-program-id') ? {id:localStorage.getItem('review-program-id')!} : {}) }
setActiveProgram(program)
const customer = { id: localStorage.getItem('review-customer-id') || 'customer-one', role: 'customer', fullName: 'Test Member', referralCode: 'MEMBER', email: 'member@example.test' } as Profile
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

async function api(method: string, ...args: unknown[]) {
  const response = await fetch(`/__loyality-api/${method}`, { method: 'POST', body: JSON.stringify(args) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  return result
}

for (const method of ['getPublicOffer', 'claimOffer', 'getCustomerSnapshot', 'findCatalogRedemption', 'getBusinessSnapshot', 'createVisitRule']) {
  Object.assign(loyalityService, { [method]: (...args: unknown[]) => api(method, ...args) })
}
profileService.getRewardBalance = () => api('getRewardBalance')
businessApplicationsService.list = (page,search) => api('listApplications',page,search)
businessApplicationsService.history = id => api('applicationHistory',id)
businessApplicationsService.review = (app,next,reason) => api('reviewApplication',app,next,reason)

export function Harness() {
  const [profile, setProfile] = useState<Profile | null>(() => localStorage.getItem('review-signed-in') ? customer : null)
  const auth = {
    profile, session: null, isLoading: false,
    signInAutomatically: async () => { await api('signIn'); localStorage.setItem('review-signed-in', 'true'); setProfile(customer); return customer },
    signUp: async () => { const result = await api('signUp'); if (result.autoSession) { localStorage.setItem('review-signed-in', 'true'); setProfile(customer) }; return { profile: customer } },
  } as AuthContextValue
  return <QueryClientProvider client={queryClient}><TenantContext.Provider value={{ program, isLoading: false, error: null, refresh: async () => {} }}><AuthContext.Provider value={auth}><LanguageProvider><BrowserRouter>
    <nav><Link to="/dashboard">Wallet</Link> <Link to="/away">Leave wallet</Link></nav>
    <Routes>
      <Route path="/signin" element={<LoyalityAuthPage />} />
      <Route path="/join" element={<LoyalityJoinPage />} />
      <Route path="/offer/:publicToken" element={<LoyalityOfferPage />} />
      <Route path="/dashboard" element={<LoyalityCustomerDashboard />} />
      <Route path="/business/growth" element={<LoyalityBusinessGrowthPage />} />
      <Route path="/admin/applications" element={<BusinessApplicationsPage />} />
      <Route path="/away" element={<p>Another page</p>} />
    </Routes><Toaster /></BrowserRouter></LanguageProvider></AuthContext.Provider></TenantContext.Provider></QueryClientProvider>
}

createRoot(document.getElementById('root')!).render(<Harness />)
