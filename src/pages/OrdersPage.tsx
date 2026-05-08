import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
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
      const message = err instanceof Error ? err.message : 'Kunde inte ladda beställningar.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [user.id])

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
        : `Okänd (${String(status)})`
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
      const message = err instanceof Error ? err.message : 'Kunde inte ladda orderdetaljer.'
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

      setSuccess('Beställningen har avbrutits.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte avbryta beställning.'
      setError(message)
    } finally {
      setCancelingOrderId('')
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="orders-page">
        <h2 className="sv-section-title">Dina beställningar</h2>
        <p className="sv-section-subtitle">Här hittar du dina senaste beställningar.</p>

        {checkoutSuccessMessage && <p className="feedback success">{checkoutSuccessMessage}</p>}
        {success && <p className="feedback success">{success}</p>}
        {error && <p className="feedback error">{error}</p>}

        {isLoading ? (
          <p>Laddar beställningar...</p>
        ) : orders.length === 0 ? (
          <div className="sv-empty-state">
            <svg
              className="sv-empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h2>Inga beställningar än</h2>
            <p>Slutför ett köp för att skapa din första beställning.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <h3>{order.orderNumber || order.id}</h3>
                <p><strong>Skapad:</strong> {formatDate(order.createdAtUtc)}</p>
                <p><strong>Status:</strong> {getStatusLabel(order.status)}</p>
                <p><strong>Betalning:</strong> {order.paymentStatus || '-'}</p>
                <p>
                  <strong>Totalt:</strong> {formatAmount(order.totalAmount, order.currency)}
                </p>
                <p><strong>Produkter:</strong> {getItemCount(order)}</p>
                <div className="order-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => void viewOrderDetails(order.id)}
                    disabled={activeOrderId === order.id}
                  >
                    {activeOrderId === order.id ? 'Laddar...' : 'Visa detaljer'}
                  </button>
                  {canCancelOrder(order.status) && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => void handleCancelOrder(order.id)}
                      disabled={cancelingOrderId === order.id}
                    >
                      {cancelingOrderId === order.id ? 'Avbryter...' : 'Avbryt beställning'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedOrder && (
          <section className="order-details">
            <h2>Orderdetaljer: {selectedOrder.orderNumber || selectedOrder.id}</h2>
            <p><strong>Status:</strong> {getStatusLabel(selectedOrder.status)}</p>
            <p><strong>Betalning:</strong> {selectedOrder.paymentStatus || '-'}</p>
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>SKU</th>
                    <th>Antal</th>
                    <th>Styckpris</th>
                    <th>Totalt</th>
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

      <SiteFooter />
    </main>
  )
}

export default OrdersPage
