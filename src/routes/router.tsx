import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AdminPage } from '@/features/admin/pages/admin-page'
import { LandingPage } from '@/features/auth/pages/landing-page'
import { ActivityPage } from '@/features/activity/pages/activity-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { ProfilePage } from '@/features/profile/pages/profile-page'
import { PromotionsPage } from '@/features/promotions/pages/promotions-page'
import { RedeemRewardPage } from '@/features/rewards/pages/redeem-reward-page'
import { RewardsPage } from '@/features/rewards/pages/rewards-page'
import { CartPage } from '@/features/shop/pages/cart-page'
import { CheckoutPage } from '@/features/shop/pages/checkout-page'
import { OrderConfirmationPage } from '@/features/shop/pages/order-confirmation-page'
import { OrdersPage } from '@/features/shop/pages/orders-page'
import { ShopPage } from '@/features/shop/pages/shop-page'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/layouts/admin-layout'
import { CustomerLayout } from '@/layouts/customer-layout'

function LandingRoute() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (profile) {
    return <Navigate replace to={profile.role === 'admin' ? '/admin' : '/dashboard'} />
  }

  return <LandingPage />
}

function ProtectedCustomerRoute() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!profile) {
    return <Navigate replace to="/" />
  }

  return <CustomerLayout />
}

function ProtectedAdminRoute() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate replace to="/dashboard" />
  }

  return <AdminLayout />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingRoute />,
  },
  {
    element: <ProtectedCustomerRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order-confirmation', element: <OrderConfirmationPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/rewards', element: <RewardsPage /> },
      { path: '/redeem/:rewardId', element: <RedeemRewardPage /> },
      { path: '/promotions', element: <PromotionsPage /> },
      { path: '/activity', element: <ActivityPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  {
    element: <ProtectedAdminRoute />,
    children: [
      { path: '/admin', element: <AdminPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/" />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
