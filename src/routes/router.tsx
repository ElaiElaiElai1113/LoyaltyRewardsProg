import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Navigate, Outlet, createBrowserRouter, useLocation, useNavigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { LanguagePicker } from '@/components/language-picker'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/layouts/admin-layout'
import { BusinessOwnerLayout } from '@/layouts/business-owner-layout'
import { CustomerLayout } from '@/layouts/customer-layout'
import { PublicBrowseLayout } from '@/layouts/public-browse-layout'
import { ProgramAdminLayout } from '@/layouts/program-admin-layout'
import { useRequiredAgreements } from '@/hooks/use-legal-agreements'
import { LoadingState } from '@/components/ui/loading-state'
import { getAgreementGateDecision } from '@/lib/agreement-gate'
import { isBusinessOwnerRole } from '@/lib/business-role-policy'
import { useLanguage } from '@/lib/language'
import { getHomePathForRole } from '@/lib/role-routes'
import { useCurrentProgramMembership } from '@/hooks/use-program-access'
import { canAccessProgramAdmin } from '@/lib/program-access'
import { getPasswordSetupRoute, getPasswordSetupType } from '@/lib/password-setup'
import { getUnifiedSignInPath, type SignInPortal } from '@/lib/sign-in-portals'

const AdminPage = lazy(() => import('@/features/admin/pages/admin-page').then((module) => ({ default: module.AdminPage })))
const MembershipOperationsPage = lazy(() => import('@/features/platform/pages/membership-operations-page').then((module) => ({ default: module.MembershipOperationsPage })))
const AmbassadorsPage = lazy(() => import('@/features/ambassadors/pages/ambassadors-page').then((module) => ({ default: module.AmbassadorsPage })))
const AuthPage = lazy(() => import('@/features/auth/pages/landing-page').then((module) => ({ default: module.AuthPage })))
const EmailConfirmationPage = lazy(() => import('@/features/auth/pages/email-confirmation-page').then((module) => ({ default: module.EmailConfirmationPage })))
const RequiredAgreementsPage = lazy(() => import('@/features/auth/pages/required-agreements-page').then((module) => ({ default: module.RequiredAgreementsPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/reset-password-page').then((module) => ({ default: module.ResetPasswordPage })))
const CostCalculatorPage = lazy(() => import('@/features/business/pages/cost-calculator-page').then((module) => ({ default: module.CostCalculatorPage })))
const ForBusinessesPage = lazy(() => import('@/features/business/pages/for-businesses-page').then((module) => ({ default: module.ForBusinessesPage })))
const ActivityPage = lazy(() => import('@/features/activity/pages/activity-page').then((module) => ({ default: module.ActivityPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page').then((module) => ({ default: module.DashboardPage })))
const EarlyAccessPage = lazy(() => import('@/features/early-access/pages/early-access-page').then((module) => ({ default: module.EarlyAccessPage })))
const HomePage = lazy(() => import('@/features/home/pages/home-page').then((module) => ({ default: module.HomePage })))
const ProfilePage = lazy(() => import('@/features/profile/pages/profile-page').then((module) => ({ default: module.ProfilePage })))
const PromotionsPage = lazy(() => import('@/features/promotions/pages/promotions-page').then((module) => ({ default: module.PromotionsPage })))
const PromoPage = lazy(() => import('@/features/referrals/pages/promo-page').then((module) => ({ default: module.PromoPage })))
const ReferralRegisterPage = lazy(() => import('@/features/referrals/pages/referral-register-page').then((module) => ({ default: module.ReferralRegisterPage })))
const AdminGiftCardsPage = lazy(() => import('@/features/gift-cards/pages/admin-gift-cards-page').then((module) => ({ default: module.AdminGiftCardsPage })))
const BusinessGiftCardsPage = lazy(() => import('@/features/gift-cards/pages/business-gift-cards-page').then((module) => ({ default: module.BusinessGiftCardsPage })))
const GiftCardDetailPage = lazy(() => import('@/features/gift-cards/pages/gift-card-detail-page').then((module) => ({ default: module.GiftCardDetailPage })))
const GiftCardsPage = lazy(() => import('@/features/gift-cards/pages/gift-cards-page').then((module) => ({ default: module.GiftCardsPage })))
const PublicGiftCardPage = lazy(() => import('@/features/gift-cards/pages/public-gift-card-page').then((module) => ({ default: module.PublicGiftCardPage })))
const RedemptionsPage = lazy(() => import('@/features/gift-cards/pages/redemptions-page').then((module) => ({ default: module.RedemptionsPage })))
const WalletGiftCardsPage = lazy(() => import('@/features/gift-cards/pages/wallet-gift-cards-page').then((module) => ({ default: module.WalletGiftCardsPage })))
const JoinRewardsPage = lazy(() => import('@/features/join/pages/join-rewards-page').then((module) => ({ default: module.JoinRewardsPage })))
const LegalPage = lazy(() => import('@/features/legal/pages/legal-page').then((module) => ({ default: module.LegalPage })))
const MembershipPage = lazy(() => import('@/features/membership/pages/membership-page').then((module) => ({ default: module.MembershipPage })))
const NotFoundPage = lazy(() => import('@/features/not-found/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })))
const PlatformGuidePage = lazy(() => import('@/features/platform-guide/pages/platform-guide-page').then((module) => ({ default: module.PlatformGuidePage })))
const PlatformProgramsPage = lazy(() => import('@/features/platform/pages/platform-programs-page').then((module) => ({ default: module.PlatformProgramsPage })))
const TenantImportPage = lazy(() => import('@/features/platform/pages/tenant-import-page').then((module) => ({ default: module.TenantImportPage })))
const LaunchReadinessPage = lazy(() => import('@/features/platform/pages/launch-readiness-page').then((module) => ({ default: module.LaunchReadinessPage })))
const ProgramSettingsPage = lazy(() => import('@/features/program/pages/program-settings-page').then((module) => ({ default: module.ProgramSettingsPage })))
const ProgramTeamPage = lazy(() => import('@/features/program/pages/program-team-page').then((module) => ({ default: module.ProgramTeamPage })))
const ProgramBillingPage = lazy(() => import('@/features/program/pages/program-billing-page').then((module) => ({ default: module.ProgramBillingPage })))
const ProgramOnboardingPage = lazy(() => import('@/features/program/pages/program-onboarding-page').then((module) => ({ default: module.ProgramOnboardingPage })))
const ProgramReportsPage = lazy(() => import('@/features/program/pages/program-reports-page').then((module) => ({ default: module.ProgramReportsPage })))
const CartPage = lazy(() => import('@/features/shop/pages/cart-page').then((module) => ({ default: module.CartPage })))
const CheckoutPage = lazy(() => import('@/features/shop/pages/checkout-page').then((module) => ({ default: module.CheckoutPage })))
const OrderConfirmationPage = lazy(() => import('@/features/shop/pages/order-confirmation-page').then((module) => ({ default: module.OrderConfirmationPage })))
const OrdersPage = lazy(() => import('@/features/shop/pages/orders-page').then((module) => ({ default: module.OrdersPage })))
const ShopPage = lazy(() => import('@/features/shop/pages/shop-page').then((module) => ({ default: module.ShopPage })))
const BusinessDashboardPage = lazy(() => import('@/features/business-owner/pages/business-dashboard-page').then((module) => ({ default: module.BusinessDashboardPage })))
const MemberSalePage = lazy(() => import('@/features/business-owner/pages/member-sale-page').then((module) => ({ default: module.MemberSalePage })))
const MembersPage = lazy(() => import('@/features/business-owner/pages/members-page').then((module) => ({ default: module.MembersPage })))
const PartnersPage = lazy(() => import('@/features/business-owner/pages/partners-page').then((module) => ({ default: module.PartnersPage })))
const ProductsPage = lazy(() => import('@/features/business-owner/pages/products-page').then((module) => ({ default: module.ProductsPage })))
const BusinessPromotionsPage = lazy(() => import('@/features/business-owner/pages/promotions-page').then((module) => ({ default: module.PromotionsPage })))
const BusinessRewardsPage = lazy(() => import('@/features/business-owner/pages/rewards-page').then((module) => ({ default: module.RewardsPage })))
const SettingsPage = lazy(() => import('@/features/business-owner/pages/settings-page').then((module) => ({ default: module.SettingsPage })))

function getSignInPath() {
  const tenant = new URLSearchParams(window.location.search).get('tenant')
  const tenantQuery = tenant ? `&tenant=${encodeURIComponent(tenant)}` : ''
  return `/signin?redirect=${encodeURIComponent(window.location.pathname)}${tenantQuery}`
}

function RouteLoading() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="absolute right-6 top-6">
        <LanguagePicker className="text-on-surface-variant" />
      </div>
      <LoadingState title={t('Loading')} description={t('Preparing your workspace.')} />
    </div>
  )
}

function RouteEffects() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    const setupType = getPasswordSetupType(location.search, location.hash)
    if (!setupType) return

    const setupPath = getPasswordSetupRoute(setupType)
    if (location.pathname === setupPath) return

    navigate(
      {
        pathname: setupPath,
        search: location.search,
        hash: location.hash,
      },
      { replace: true },
    )
  }, [location.hash, location.pathname, location.search, navigate])

  useEffect(() => {
    let isMounted = true
    const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
      try {
        const url = new URL(event.url)
        const path =
          url.protocol === 'rewardme:' || url.protocol === 'medellinrewards:' || url.protocol === 'rewardsplatform:'
            ? `/${url.host}${url.pathname}`
            : `${url.pathname}${url.search}${url.hash}`

        if (path.startsWith('/')) {
          navigate(path)
        }
      } catch {
        // Ignore malformed external URLs.
      }
    })

    return () => {
      isMounted = false
      void listener.then((handle) => {
        if (!isMounted) handle.remove()
      })
    }
  }, [navigate])

  return <Outlet />
}

function LandingRoute() {
  const { profile, isLoading } = useAuth()
  const requiredAgreements = useRequiredAgreements(profile)
  const agreementGate = getAgreementGateDecision({
    role: profile?.role ?? null,
    isAgreementLoading: requiredAgreements.isLoading,
    hasAgreementError: Boolean(requiredAgreements.error),
    isAgreementComplete: requiredAgreements.data?.isComplete,
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (profile) {
    if (agreementGate === 'loading') {
      return <RouteLoading />
    }

    if (agreementGate === 'redirect-required-agreements') {
      return <Navigate replace to="/agreements/required" />
    }
    return <Navigate replace to={getHomePathForRole(profile.role)} />
  }

  return <AuthPage />
}

function RootRoute() {
  return <HomePage />
}

function ProtectedCustomerRoute() {
  const { profile, isLoading } = useAuth()
  const requiredAgreements = useRequiredAgreements(profile)
  const agreementGate = getAgreementGateDecision({
    role: profile?.role ?? null,
    isAgreementLoading: requiredAgreements.isLoading,
    hasAgreementError: Boolean(requiredAgreements.error),
    isAgreementComplete: requiredAgreements.data?.isComplete,
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (!profile) {
    return <Navigate replace to="/" />
  }

  if (profile.role !== 'customer') {
    return <Navigate replace to={getHomePathForRole(profile.role)} />
  }

  if (agreementGate === 'loading') {
    return <RouteLoading />
  }

  if (agreementGate === 'redirect-required-agreements') {
    return <Navigate replace to="/agreements/required" />
  }

  return <CustomerLayout />
}

function PublicOrCustomerRoute() {
  const { profile, isLoading } = useAuth()
  const requiredAgreements = useRequiredAgreements(profile)
  const agreementGate = getAgreementGateDecision({
    role: profile?.role ?? null,
    isAgreementLoading: requiredAgreements.isLoading,
    hasAgreementError: Boolean(requiredAgreements.error),
    isAgreementComplete: requiredAgreements.data?.isComplete,
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (profile?.role === 'customer') {
    if (agreementGate === 'loading') {
      return <RouteLoading />
    }

    if (agreementGate === 'redirect-required-agreements') {
      return <Navigate replace to="/agreements/required" />
    }

    return <CustomerLayout />
  }

  return <PublicBrowseLayout />
}

function HiddenCustomerCommerceRoute() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return <RouteLoading />
  }

  if (profile?.role === 'customer') {
    return <Navigate replace to="/dashboard" />
  }

  if (profile) {
    return <Navigate replace to={getHomePathForRole(profile.role)} />
  }

  return <Navigate replace to="/signin" />
}

function ProtectedAdminRoute() {
  const { profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <RouteLoading />
  }

  if (!profile || profile.role !== 'platform-admin') {
    return (
      <Navigate
        replace
        to={profile ? getHomePathForRole(profile.role) : getUnifiedSignInPath('admin', location.pathname)}
      />
    )
  }

  return <AdminLayout />
}

function ProtectedProgramAdminRoute() {
  const { profile, isLoading } = useAuth()
  const membership = useCurrentProgramMembership()
  if (isLoading || membership.isLoading) return <RouteLoading />
  if (!profile) return <Navigate replace to={getSignInPath()} />
  if (!canAccessProgramAdmin(profile.role, membership.data)) return <Navigate replace to={getHomePathForRole(profile.role)} />
  return <ProgramAdminLayout />
}

function ProtectedAuthenticatedRoute() {
  const { profile, isLoading } = useAuth()
  if (isLoading) return <RouteLoading />
  if (!profile) return <Navigate replace to={getSignInPath()} />
  return <Outlet />
}

function ProtectedBusinessOwnerRoute() {
  const { profile, isLoading } = useAuth()
  const location = useLocation()
  const requiredAgreements = useRequiredAgreements(profile)
  const agreementGate = getAgreementGateDecision({
    role: profile?.role ?? null,
    isAgreementLoading: requiredAgreements.isLoading,
    hasAgreementError: Boolean(requiredAgreements.error),
    isAgreementComplete: requiredAgreements.data?.isComplete,
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (!profile || (profile.role !== 'business-owner' && profile.role !== 'business-staff')) {
    return (
      <Navigate
        replace
        to={profile ? getHomePathForRole(profile.role) : getUnifiedSignInPath('business', location.pathname)}
      />
    )
  }

  if (agreementGate === 'loading') {
    return <RouteLoading />
  }

  if (agreementGate === 'redirect-required-agreements') {
    return <Navigate replace to="/agreements/required" />
  }

  return <BusinessOwnerLayout />
}

function OwnerOnlyBusinessRoute({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return <RouteLoading />
  }

  if (!isBusinessOwnerRole(profile?.role)) {
    return <Navigate replace to="/business/dashboard" />
  }

  return <>{children}</>
}

function LegacyPortalEntryRoute({ portal }: { portal: Exclude<SignInPortal, 'customer'> }) {
  const { profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <RouteLoading />
  }

  if (profile) return <Navigate replace to={getHomePathForRole(profile.role)} />

  const search = new URLSearchParams(location.search)
  search.set('portal', portal)
  return <Navigate replace to={`/signin?${search.toString()}`} />
}

const router = createBrowserRouter([
  {
    element: <RouteEffects />,
    children: [
      {
        path: '/',
        element: <RootRoute />,
      },
      {
        path: '/signin',
        element: <LandingRoute />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: '/auth/confirm',
        element: <EmailConfirmationPage />,
      },
      {
        path: '/accept-invitation',
        element: <ResetPasswordPage flow="invite" />,
      },
      {
        path: '/business/login',
        element: <LegacyPortalEntryRoute portal="business" />,
      },
      {
        path: '/admin',
        element: <LegacyPortalEntryRoute portal="admin" />,
      },
      {
        path: '/agreements/required',
        element: <RequiredAgreementsPage />,
      },
      {
        path: '/promo',
        element: <PromoPage />,
      },
      {
        path: '/promo/register',
        element: <ReferralRegisterPage />,
      },
      {
        path: '/ambassadors',
        element: <AmbassadorsPage />,
      },
      {
        path: '/join',
        element: <JoinRewardsPage />,
      },
      {
        path: '/invitation',
        element: <EarlyAccessPage />,
      },
      {
        path: '/early-access',
        element: <Navigate replace to="/invitation" />,
      },
      {
        path: '/landing-page',
        element: <HomePage />,
      },
      {
        path: '/joinusearly',
        element: <Navigate replace to="/invitation" />,
      },
      {
        path: '/join-us-early',
        element: <Navigate replace to="/invitation" />,
      },
      {
        path: '/terms',
        element: <LegalPage kind="terms" />,
      },
      {
        path: '/privacy',
        element: <LegalPage kind="privacy" />,
      },
      {
        path: '/reward-terms',
        element: <LegalPage kind="reward-terms" />,
      },
      {
        path: '/verification-policy',
        element: <LegalPage kind="verification-policy" />,
      },
      {
        element: <PublicBrowseLayout />,
        children: [
          { path: '/guide', element: <PlatformGuidePage /> },
          { path: '/g/:publicToken', element: <PublicGiftCardPage /> },
          { path: '/cost-calculator', element: <CostCalculatorPage /> },
          { path: '/business/cost-calculator', element: <Navigate replace to="/cost-calculator" /> },
        ],
      },
      {
        element: <PublicOrCustomerRoute />,
        children: [
          { path: '/shop', element: <ShopPage /> },
          { path: '/rewards', element: <HiddenCustomerCommerceRoute /> },
          { path: '/promotions', element: <PromotionsPage /> },
          { path: '/membership', element: <MembershipPage /> },
          { path: '/business', element: <ForBusinessesPage /> },
          { path: '/for-businesses', element: <Navigate replace to="/business" /> },
        ],
      },
      {
        element: <ProtectedCustomerRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/gift-cards', element: <GiftCardsPage /> },
          { path: '/wallet/gift-cards', element: <WalletGiftCardsPage /> },
          { path: '/wallet/gift-cards/:id', element: <GiftCardDetailPage /> },
          { path: '/cart', element: <CartPage /> },
          { path: '/checkout', element: <CheckoutPage /> },
          { path: '/order-confirmation', element: <OrderConfirmationPage /> },
          { path: '/orders', element: <OrdersPage /> },
          { path: '/redeem/:rewardId', element: <HiddenCustomerCommerceRoute /> },
          { path: '/activity', element: <ActivityPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
      {
        element: <ProtectedAuthenticatedRoute />,
        children: [
          { path: '/onboarding/program', element: <ProgramOnboardingPage /> },
        ],
      },
      {
        element: <ProtectedAdminRoute />,
        children: [
          { path: '/admin/portal', element: <AdminPage /> },
          { path: '/admin/programs', element: <PlatformProgramsPage /> },
          { path: '/admin/readiness', element: <LaunchReadinessPage /> },
          { path: '/admin/memberships', element: <MembershipOperationsPage /> },
          { path: '/admin/import', element: <TenantImportPage /> },
          { path: '/admin/gift-cards', element: <AdminGiftCardsPage /> },
          { path: '/admin/guide', element: <PlatformGuidePage /> },
        ],
      },
      {
        element: <ProtectedProgramAdminRoute />,
        children: [
          { path: '/program', element: <Navigate replace to="/program/settings" /> },
          { path: '/program/settings', element: <ProgramSettingsPage /> },
          { path: '/program/team', element: <ProgramTeamPage /> },
          { path: '/program/reports', element: <ProgramReportsPage /> },
          { path: '/program/billing', element: <ProgramBillingPage /> },
        ],
      },
      {
        element: <ProtectedBusinessOwnerRoute />,
        children: [
          { path: '/business/dashboard', element: <BusinessDashboardPage /> },
          { path: '/business/member-sale/:token', element: <MemberSalePage /> },
          { path: '/business/products', element: <OwnerOnlyBusinessRoute><ProductsPage /></OwnerOnlyBusinessRoute> },
          { path: '/business/rewards', element: <OwnerOnlyBusinessRoute><BusinessRewardsPage /></OwnerOnlyBusinessRoute> },
          { path: '/business/gift-cards', element: <OwnerOnlyBusinessRoute><BusinessGiftCardsPage /></OwnerOnlyBusinessRoute> },
          { path: '/business/redemptions', element: <RedemptionsPage /> },
          { path: '/business/promotions', element: <OwnerOnlyBusinessRoute><BusinessPromotionsPage /></OwnerOnlyBusinessRoute> },
          { path: '/business/members', element: <MembersPage /> },
          { path: '/business/partners', element: <PartnersPage /> },
          { path: '/business/guide', element: <PlatformGuidePage /> },
          { path: '/business/settings', element: <OwnerOnlyBusinessRoute><SettingsPage /></OwnerOnlyBusinessRoute> },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
