import { useEffect, type ReactNode } from 'react'
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'

import { AdminPage } from '@/features/admin/pages/admin-page'
import { AmbassadorsPage } from '@/features/ambassadors/pages/ambassadors-page'
import { AuthPage, LandingPage } from '@/features/auth/pages/landing-page'
import { RequiredAgreementsPage } from '@/features/auth/pages/required-agreements-page'
import { StaffLoginPage } from '@/features/auth/pages/staff-login-page'
import { CostCalculatorPage } from '@/features/business/pages/cost-calculator-page'
import { ForBusinessesPage } from '@/features/business/pages/for-businesses-page'
import { ActivityPage } from '@/features/activity/pages/activity-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { EarlyAccessPage } from '@/features/early-access/pages/early-access-page'
import { ProfilePage } from '@/features/profile/pages/profile-page'
import { PromotionsPage } from '@/features/promotions/pages/promotions-page'
import { PromoPage } from '@/features/referrals/pages/promo-page'
import { ReferralRegisterPage } from '@/features/referrals/pages/referral-register-page'
import { AdminGiftCardsPage } from '@/features/gift-cards/pages/admin-gift-cards-page'
import { BusinessGiftCardsPage } from '@/features/gift-cards/pages/business-gift-cards-page'
import { GiftCardDetailPage } from '@/features/gift-cards/pages/gift-card-detail-page'
import { GiftCardsPage } from '@/features/gift-cards/pages/gift-cards-page'
import { PublicGiftCardPage } from '@/features/gift-cards/pages/public-gift-card-page'
import { RedemptionsPage } from '@/features/gift-cards/pages/redemptions-page'
import { WalletGiftCardsPage } from '@/features/gift-cards/pages/wallet-gift-cards-page'
import { JoinRewardsPage } from '@/features/join/pages/join-rewards-page'
import { LegalPage } from '@/features/legal/pages/legal-page'
import { MembershipPage } from '@/features/membership/pages/membership-page'
import { NotFoundPage } from '@/features/not-found/pages/not-found-page'
import { RedeemRewardPage } from '@/features/rewards/pages/redeem-reward-page'
import { RewardsPage } from '@/features/rewards/pages/rewards-page'
import { CartPage } from '@/features/shop/pages/cart-page'
import { CheckoutPage } from '@/features/shop/pages/checkout-page'
import { OrderConfirmationPage } from '@/features/shop/pages/order-confirmation-page'
import { OrdersPage } from '@/features/shop/pages/orders-page'
import { ShopPage } from '@/features/shop/pages/shop-page'
import {
  BusinessDashboardPage,
  MemberSalePage,
  MembersPage,
  PartnersPage,
  ProductsPage,
  PromotionsPage as BusinessPromotionsPage,
  RewardsPage as BusinessRewardsPage,
  SettingsPage,
} from '@/features/business-owner/pages'
import { LanguagePicker } from '@/components/language-picker'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/layouts/admin-layout'
import { BusinessOwnerLayout } from '@/layouts/business-owner-layout'
import { CustomerLayout } from '@/layouts/customer-layout'
import { PublicBrowseLayout } from '@/layouts/public-browse-layout'
import { useRequiredAgreements } from '@/hooks/use-legal-agreements'
import { LoadingState } from '@/components/ui/loading-state'
import { getAgreementGateDecision } from '@/lib/agreement-gate'
import { isBusinessOwnerRole } from '@/lib/business-role-policy'
import { useLanguage } from '@/lib/language'
import { getHomePathForRole } from '@/lib/role-routes'

const portalAccessErrorKey = 'portalAccessError'

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

function LandingRoute() {
  const { profile, isLoading, signOut } = useAuth()
  const requiredAgreements = useRequiredAgreements(profile)
  const agreementGate = getAgreementGateDecision({
    role: profile?.role ?? null,
    isAgreementLoading: requiredAgreements.isLoading,
    hasAgreementError: Boolean(requiredAgreements.error),
    isAgreementComplete: requiredAgreements.data?.isComplete,
  })

  useEffect(() => {
    if (!profile) return
    if (profile.role === 'customer') return

    sessionStorage.setItem(portalAccessErrorKey, 'This sign-in page is for customer accounts only.')
    void signOut()
  }, [profile, signOut])

  if (isLoading) {
    return <RouteLoading />
  }

  if (profile) {
    if (profile.role !== 'customer') {
      return <RouteLoading />
    }

    if (agreementGate === 'loading') {
      return <RouteLoading />
    }

    if (agreementGate === 'redirect-required-agreements') {
      return <Navigate replace to="/agreements/required" />
    }
    return <Navigate replace to="/dashboard" />
  }

  return <AuthPage />
}

function RootRoute() {
  return <EarlyAccessPage />
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

  if (profile && profile.role === 'platform-admin') {
    return <Navigate replace to="/admin/portal" />
  }

  if (profile && (profile.role === 'business-owner' || profile.role === 'business-staff')) {
    return <Navigate replace to="/business/dashboard" />
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
        to={profile ? getHomePathForRole(profile.role) : `/admin?redirect=${encodeURIComponent(location.pathname)}`}
      />
    )
  }

  return <AdminLayout />
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
        to={profile ? getHomePathForRole(profile.role) : `/business/login?redirect=${encodeURIComponent(location.pathname)}`}
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

function AdminEntryRoute() {
  const { profile, isLoading, signOut } = useAuth()

  useEffect(() => {
    if (!profile || profile.role === 'platform-admin') return

    sessionStorage.setItem(portalAccessErrorKey, 'This account does not have access to the admin portal.')
    void signOut()
  }, [profile, signOut])

  if (isLoading) {
    return <RouteLoading />
  }

  if (!profile) {
    return <StaffLoginPage portal="admin" />
  }

  if (profile.role !== 'platform-admin') {
    return <RouteLoading />
  }

  return <Navigate replace to="/admin/portal" />
}

function BusinessEntryRoute() {
  const { profile, isLoading, signOut } = useAuth()

  useEffect(() => {
    if (!profile) return
    if (profile.role === 'business-owner' || profile.role === 'business-staff') return

    sessionStorage.setItem(portalAccessErrorKey, 'This account does not have access to the business portal.')
    void signOut()
  }, [profile, signOut])

  if (isLoading) {
    return <RouteLoading />
  }

  if (!profile) {
    return <StaffLoginPage portal="business" />
  }

  if (profile.role === 'business-owner' || profile.role === 'business-staff') {
    return <Navigate replace to="/business/dashboard" />
  }

  return <RouteLoading />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />,
  },
  {
    path: '/signin',
    element: <LandingRoute />,
  },
  {
    path: '/business/login',
    element: <BusinessEntryRoute />,
  },
  {
    path: '/admin',
    element: <AdminEntryRoute />,
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
    path: '/early-access',
    element: <EarlyAccessPage />,
  },
  {
    path: '/landing-page',
    element: <LandingPage />,
  },
  {
    path: '/joinusearly',
    element: <Navigate replace to="/early-access" />,
  },
  {
    path: '/join-us-early',
    element: <Navigate replace to="/early-access" />,
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
      { path: '/g/:publicToken', element: <PublicGiftCardPage /> },
      { path: '/cost-calculator', element: <CostCalculatorPage /> },
      { path: '/business/cost-calculator', element: <Navigate replace to="/cost-calculator" /> },
    ],
  },
  {
    element: <PublicOrCustomerRoute />,
    children: [
      { path: '/shop', element: <ShopPage /> },
      { path: '/rewards', element: <RewardsPage /> },
      { path: '/promotions', element: <PromotionsPage /> },
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
      { path: '/membership', element: <MembershipPage /> },
      { path: '/redeem/:rewardId', element: <RedeemRewardPage /> },
      { path: '/activity', element: <ActivityPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  {
    element: <ProtectedAdminRoute />,
    children: [
      { path: '/admin/portal', element: <AdminPage /> },
      { path: '/admin/gift-cards', element: <AdminGiftCardsPage /> },
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
      { path: '/business/settings', element: <OwnerOnlyBusinessRoute><SettingsPage /></OwnerOnlyBusinessRoute> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
