import { readStore, updateStore, readCart, clearCart } from '@/lib/mock-store'
import type { Order, OrderLineItem } from '@/types/domain'
import { delay } from './shared'

function toTierProgress(points: number, nextRewardPoints: number) {
  return Math.max(0, Math.min(100, Math.round((points / nextRewardPoints) * 100)))
}

export const ordersService = {
  async getOrders(profileId: string): Promise<Order[]> {
    await delay()
    return readStore()
      .orders.filter((o) => o.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    await delay()
    return readStore().orders.find((o) => o.id === orderId) ?? null
  },

  async placeOrder(profileId: string, businessId: string, paymentMethod: string): Promise<Order> {
    await delay(300)

    const store = readStore()
    const cartItems = readCart()
    const business = store.businesses.find((b) => b.id === businessId)

    if (cartItems.length === 0) {
      throw new Error('Your cart is empty.')
    }

    if (!business) {
      throw new Error('Business not found.')
    }

    const lineItems: OrderLineItem[] = cartItems.map((cartItem) => {
      const product = store.products.find((p) => p.id === cartItem.productId)
      if (!product) {
        throw new Error(`Product ${cartItem.productId} not found.`)
      }
      return {
        productId: product.id,
        productTitle: product.title,
        unitPrice: product.price,
        quantity: cartItem.quantity,
        subtotal: product.price * cartItem.quantity,
      }
    })

    const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0)
    const tax = +(subtotal * business.taxRate).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    const pointsEarned = Math.floor(total * business.earnRate)

    const order: Order = {
      id: crypto.randomUUID(),
      profileId,
      businessId,
      items: lineItems,
      subtotal,
      tax,
      total,
      pointsEarned,
      pointsStatus: 'pending',
      paymentMethod,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }

    updateStore((s) => {
      const balance = s.balances.find((b) => b.profileId === profileId)
      const currentPoints = balance?.points ?? 0
      const nextReward = balance?.nextRewardPoints ?? 300

      return {
        ...s,
        orders: [order, ...s.orders],
        balances: s.balances.map((b) =>
          b.profileId === profileId
            ? {
                ...b,
                points: currentPoints + pointsEarned,
                tierProgress: toTierProgress(currentPoints + pointsEarned, Math.max(nextReward, 1)),
              }
            : b,
        ),
        activities: [
          {
            id: crypto.randomUUID(),
            profileId,
            type: 'earned',
            title: `Purchase at ${business.name} — $${total.toFixed(2)}`,
            description: `${lineItems.length} item(s) ordered. ${pointsEarned} points earned (processing — available within 24 hours).`,
            points: pointsEarned,
            createdAt: order.createdAt,
            status: 'pending',
          },
          ...s.activities,
        ],
        products: s.products.map((p) => {
          const lineItem = lineItems.find((li) => li.productId === p.id)
          if (!lineItem) return p
          return { ...p, inventory: Math.max(0, p.inventory - lineItem.quantity) }
        }),
        adminLogs: [
          {
            id: crypto.randomUUID(),
            actorName: 'System',
            action: 'Order placed',
            details: `Order at ${business.name}. Total: $${total.toFixed(2)}. Points earned: ${pointsEarned}.`,
            createdAt: order.createdAt,
          },
          ...s.adminLogs,
        ],
      }
    })

    clearCart()
    return order
  },
}
