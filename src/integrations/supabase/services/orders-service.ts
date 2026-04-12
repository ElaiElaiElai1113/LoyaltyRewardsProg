import { readCart, clearCart } from '@/lib/mock-store'
import type { Order, OrderLineItem } from '@/types/domain'
import { requireSupabase, camelCaseRow } from './shared'

export const ordersService = {
  async getOrders(profileId: string): Promise<Order[]> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('orders')
      .select('*, order_line_items(*)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to load orders.')

    return (data as Record<string, unknown>[]).map((orderRow) => {
      const o = camelCaseRow(orderRow)
      const lineItems = ((orderRow as Record<string, unknown>).order_line_items ?? []) as Record<string, unknown>[]
      const items: OrderLineItem[] = lineItems.map((li) => {
        const l = camelCaseRow(li)
        return {
          productId: l.productId as string,
          productTitle: l.productTitle as string,
          unitPrice: Number(l.unitPrice),
          quantity: l.quantity as number,
          subtotal: Number(l.subtotal),
        }
      })
      return {
        id: o.id as string,
        profileId: o.profileId as string,
        businessId: o.businessId as string,
        items,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        total: Number(o.total),
        pointsEarned: o.pointsEarned as number,
        pointsStatus: o.pointsStatus as Order['pointsStatus'],
        paymentMethod: o.paymentMethod as string,
        status: o.status as Order['status'],
        createdAt: o.createdAt as string,
      }
    })
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('orders')
      .select('*, order_line_items(*)')
      .eq('id', orderId)
      .single()

    if (error || !data) return null

    const o = camelCaseRow(data as Record<string, unknown>)
    const lineItems = ((data as Record<string, unknown>).order_line_items ?? []) as Record<string, unknown>[]
    const items: OrderLineItem[] = lineItems.map((li) => {
      const l = camelCaseRow(li)
      return {
        productId: l.productId as string,
        productTitle: l.productTitle as string,
        unitPrice: Number(l.unitPrice),
        quantity: l.quantity as number,
        subtotal: Number(l.subtotal),
      }
    })

    return {
      id: o.id as string,
      profileId: o.profileId as string,
      businessId: o.businessId as string,
      items,
      subtotal: Number(o.subtotal),
      tax: Number(o.tax),
      total: Number(o.total),
      pointsEarned: o.pointsEarned as number,
      pointsStatus: o.pointsStatus as Order['pointsStatus'],
      paymentMethod: o.paymentMethod as string,
      status: o.status as Order['status'],
      createdAt: o.createdAt as string,
    }
  },

  async placeOrder(profileId: string, businessId: string, paymentMethod: string): Promise<Order> {
    const sb = requireSupabase()

    const cartItems = readCart()
    if (cartItems.length === 0) throw new Error('Your cart is empty.')

    // Fetch business for tax/earn rates
    const { data: biz, error: bizError } = await sb
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (bizError || !biz) throw new Error('Business not found.')

    // Fetch products for cart items
    const productIds = cartItems.map((c) => c.productId)
    const { data: productRows, error: prodError } = await sb
      .from('products')
      .select('*')
      .in('id', productIds)

    if (prodError) throw new Error('Failed to load products.')

    const lineItems: OrderLineItem[] = cartItems.map((cartItem) => {
      const product = productRows.find((p) => p.id === cartItem.productId)
      if (!product) throw new Error(`Product ${cartItem.productId} not found.`)
      return {
        productId: product.id,
        productTitle: product.title,
        unitPrice: Number(product.price),
        quantity: cartItem.quantity,
        subtotal: Number(product.price) * cartItem.quantity,
      }
    })

    const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0)
    const tax = +(subtotal * Number(biz.tax_rate)).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    const pointsEarned = Math.floor(total * Number(biz.earn_rate))

    // Create order
    const { data: orderRow, error: orderError } = await sb
      .from('orders')
      .insert({
        profile_id: profileId,
        business_id: businessId,
        subtotal,
        tax,
        total,
        points_earned: pointsEarned,
        points_status: 'pending',
        payment_method: paymentMethod,
        status: 'confirmed',
      })
      .select('*')
      .single()

    if (orderError || !orderRow) {
      throw new Error('Failed to create order.')
    }

    // Create line items
    const lineItemsInsert = lineItems.map((li) => ({
      order_id: orderRow.id,
      product_id: li.productId,
      product_title: li.productTitle,
      unit_price: li.unitPrice,
      quantity: li.quantity,
      subtotal: li.subtotal,
    }))

    await sb.from('order_line_items').insert(lineItemsInsert)

    // Update product inventory
    for (const li of lineItems) {
      const { data: p } = await sb.from('products').select('inventory').eq('id', li.productId).single()
      if (p) {
        await sb.from('products').update({ inventory: Math.max(0, p.inventory - li.quantity) }).eq('id', li.productId)
      }
    }

    // Add points to balance
    const { data: currentBalance } = await sb
      .from('reward_balances')
      .select('points, next_reward_points')
      .eq('profile_id', profileId)
      .single()

    if (currentBalance) {
      const newPoints = currentBalance.points + pointsEarned
      await sb
        .from('reward_balances')
        .update({ points: newPoints })
        .eq('profile_id', profileId)
    }

    // Log activity
    await sb.from('activities').insert({
      profile_id: profileId,
      business_id: businessId,
      type: 'earned',
      title: `Purchase at ${biz.name} — $${total.toFixed(2)}`,
      description: `${lineItems.length} item(s) ordered. ${pointsEarned} points earned (processing — available within 24 hours).`,
      points: pointsEarned,
      status: 'pending',
    })

    // Log admin action
    await sb.from('admin_logs').insert({
      actor_name: 'System',
      action: 'Order placed',
      details: `Order at ${biz.name}. Total: $${total.toFixed(2)}. Points earned: ${pointsEarned}.`,
    })

    clearCart()

    const o = camelCaseRow(orderRow as Record<string, unknown>)
    return {
      id: o.id as string,
      profileId: o.profileId as string,
      businessId: o.businessId as string,
      items: lineItems,
      subtotal: Number(o.subtotal),
      tax: Number(o.tax),
      total: Number(o.total),
      pointsEarned: o.pointsEarned as number,
      pointsStatus: o.pointsStatus as Order['pointsStatus'],
      paymentMethod: o.paymentMethod as string,
      status: o.status as Order['status'],
      createdAt: o.createdAt as string,
    }
  },
}
