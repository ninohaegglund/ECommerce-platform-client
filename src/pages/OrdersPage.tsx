import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import { getOrderById, getOrders, updateOrderStatus } from '../services/cartApi'
import type { AuthUser } from '../types/auth'
import {
  getOrderStatusLabel,
  OrderStatusCode,
  parseOrderStatusCode,
  type OrderDetails,
  type OrderSummary,
} from '../types/order'

type OrdersPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

type CheckoutSuccessState = {
  checkoutSuccess?: string
}

function OrdersPage({ user, isAdmin, onLogout }: OrdersPageProps) {
  const location = useLocation()
  const state = (location.state as CheckoutSuccessState | null) ?? null

  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeOrderId, setActiveOrderId] = useState('')
  const [cancelingOrderId, setCancelingOrderId] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getOrders(user.id)
      setOrders(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const checkoutSuccessMessage = useMemo(
    () => state?.checkoutSuccess ?? '',
    [state?.checkoutSuccess],
  )

  const formatDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value || '-'
    }

    return date.toLocaleString('sv-SE')
  }

  const formatAmount = (amount: number, currency: string) => {
    if (!Number.isFinite(amount)) {
      return '-'
    }

    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency || 'SEK',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusLabel = (status: number | string) => {
    const code = parseOrderStatusCode(status)
    return code === -1
      ? typeof status === 'string'
        ? status
        : `Unknown (${String(status)})`
      : getOrderStatusLabel(code)
  }

  const canCancelOrder = (status: number | string) => {
    const code = parseOrderStatusCode(status)
    return (
      code !== OrderStatusCode.Cancelled &&
      code !== OrderStatusCode.Delivered &&
      code !== OrderStatusCode.Refunded &&
      code !== OrderStatusCode.Shipped
    )
  }

  const getItemCount = (order: OrderSummary) => {
    if (typeof order.itemCount === 'number') {
      return order.itemCount
    }

    if (order.items) {
      return order.items.reduce((total, item) => total + item.quantity, 0)
    }

    return 0
  }

  const viewOrderDetails = async (id: string) => {
    setActiveOrderId(id)
    setError('')
    setSuccess('')

    try {
      const details = await getOrderById(id)
      setSelectedOrder(details)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load order details.'
      setError(message)
    } finally {
      setActiveOrderId('')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    setCancelingOrderId(orderId)
    setError('')
    setSuccess('')

    try {
      await updateOrderStatus(orderId, OrderStatusCode.Cancelled)
      await loadOrders()

      if (selectedOrder?.id === orderId) {
        const refreshedDetails = await getOrderById(orderId)
        setSelectedOrder(refreshedDetails)
      }

      setSuccess('Order cancelled successfully.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order.'
      setError(message)
    } finally {
      setCancelingOrderId('')
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="orders-page">
        <h1>Your Orders</h1>
        <p className="subtitle">Simple order history from OrderService.</p>

        {checkoutSuccessMessage && <p className="feedback success">{checkoutSuccessMessage}</p>}
        {success && <p className="feedback success">{success}</p>}
        {error && <p className="feedback error">{error}</p>}

        {isLoading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="hero-panel">
            <h2>No orders yet</h2>
            <p>Checkout your cart to create your first order.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <h3>{order.orderNumber || order.id}</h3>
                <p><strong>Created:</strong> {formatDate(order.createdAtUtc)}</p>
                <p><strong>Status:</strong> {getStatusLabel(order.status)}</p>
                <p><strong>Payment:</strong> {order.paymentStatus || '-'}</p>
                <p>
                  <strong>Total:</strong> {formatAmount(order.totalAmount, order.currency)}
                </p>
                <p><strong>Items:</strong> {getItemCount(order)}</p>
                <div className="order-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => void viewOrderDetails(order.id)}
                    disabled={activeOrderId === order.id}
                  >
                    {activeOrderId === order.id ? 'Loading...' : 'View details'}
                  </button>
                  {canCancelOrder(order.status) && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => void handleCancelOrder(order.id)}
                      disabled={cancelingOrderId === order.id}
                    >
                      {cancelingOrderId === order.id ? 'Cancelling...' : 'Cancel order'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedOrder && (
          <section className="order-details">
            <h2>Order Details: {selectedOrder.orderNumber || selectedOrder.id}</h2>
            <p><strong>Status:</strong> {getStatusLabel(selectedOrder.status)}</p>
            <p><strong>Payment:</strong> {selectedOrder.paymentStatus || '-'}</p>
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{item.sku}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unitPrice.toFixed(2)}</td>
                      <td>{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default OrdersPage
