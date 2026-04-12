export type OrderItem = {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export const OrderStatusCode = {
  Pending: 0,
  Confirmed: 1,
  Paid: 2,
  Packed: 3,
  Shipped: 4,
  Delivered: 5,
  Cancelled: 6,
  Refunded: 7,
} as const

export function getOrderStatusLabel(status: number): string {
  switch (status) {
    case OrderStatusCode.Pending:
      return 'Pending'
    case OrderStatusCode.Confirmed:
      return 'Confirmed'
    case OrderStatusCode.Paid:
      return 'Paid'
    case OrderStatusCode.Packed:
      return 'Packed'
    case OrderStatusCode.Shipped:
      return 'Shipped'
    case OrderStatusCode.Delivered:
      return 'Delivered'
    case OrderStatusCode.Cancelled:
      return 'Cancelled'
    case OrderStatusCode.Refunded:
      return 'Refunded'
    default:
      return `Unknown (${status})`
  }
}

export function parseOrderStatusCode(status: number | string | null | undefined): number {
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status
  }

  if (typeof status !== 'string') {
    return -1
  }

  const normalized = status.trim().toLowerCase()
  if (normalized === 'pending') {
    return OrderStatusCode.Pending
  }
  if (normalized === 'confirmed') {
    return OrderStatusCode.Confirmed
  }
  if (normalized === 'paid') {
    return OrderStatusCode.Paid
  }
  if (normalized === 'packed') {
    return OrderStatusCode.Packed
  }
  if (normalized === 'shipped') {
    return OrderStatusCode.Shipped
  }
  if (normalized === 'delivered') {
    return OrderStatusCode.Delivered
  }
  if (normalized === 'cancelled' || normalized === 'canceled') {
    return OrderStatusCode.Cancelled
  }
  if (normalized === 'refunded') {
    return OrderStatusCode.Refunded
  }

  return -1
}

export type OrderSummary = {
  id: string
  orderNumber: string
  createdAtUtc: string
  status: number | string
  paymentStatus: string
  totalAmount: number
  currency: string
  itemCount?: number
  items?: OrderItem[]
}

export type OrderDetails = OrderSummary & {
  items: OrderItem[]
}
