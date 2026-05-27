import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { getProductImagePath, getProductProfile } from '../utils/productCard'
import { getOrderById, getOrders, updateOrderStatus } from '../services/cartApi'
import { getProductImages } from '../services/productImagesApi'
import type { AuthUser } from '../types/auth'
import type { ProductImage } from '../types/product-image'
import {
  OrderStatusCode,
  PaymentStatusCode,
  parseOrderStatusCode,
  type OrderDetails,
  type OrderAddress,
  type OrderItem,
  type OrderSummary,
} from '../types/order'
import type { Product } from '../data/products'

type OrdersPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

type CheckoutSuccessState = {
  checkoutSuccess?: string
}

type OrdersTab = 'all' | 'active' | 'shipped' | 'delivered' | 'cancelled'

const ORDER_TABS: { id: OrdersTab; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'active', label: 'Aktiva' },
  { id: 'shipped', label: 'Skickade' },
  { id: 'delivered', label: 'Levererade' },
  { id: 'cancelled', label: 'Avbrutna' },
]

const ORDER_PROGRESS_STEPS = ['Beställd', 'Betald', 'Packas', 'Skickad', 'Levererad']

const getProductImageCandidates = (images: ProductImage[]) =>
  images
    .filter((img) => img.imageUrl.trim().length > 0)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1
      }
      return a.sortOrder - b.sortOrder
    })
    .map((img) => img.imageUrl.trim())

const resolveWorkingImageUrl = async (candidates: string[]) => {
  for (const candidate of candidates) {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = candidate
    })
    if (ok) {
      return candidate
    }
  }
  return ''
}

const parsePaymentStatusCode = (status: number | string | null | undefined) => {
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status
  }

  if (typeof status !== 'string') {
    return -1
  }

  const normalized = status.trim().toLowerCase()
  if (normalized === 'paid' || normalized === 'betald') {
    return PaymentStatusCode.Paid
  }
  if (normalized === 'unpaid' || normalized === 'ej betald') {
    return PaymentStatusCode.Unpaid
  }
  if (normalized === 'failed' || normalized === 'misslyckad') {
    return PaymentStatusCode.Failed
  }
  if (normalized === 'refunded' || normalized === 'aterbetald' || normalized === 'återbetald') {
    return PaymentStatusCode.Refunded
  }

  return -1
}

const isCancelledStatus = (status: number | string) => {
  const code = parseOrderStatusCode(status)
  return code === OrderStatusCode.Cancelled || code === OrderStatusCode.Refunded
}

const isDeliveredStatus = (status: number | string) =>
  parseOrderStatusCode(status) === OrderStatusCode.Delivered

const isShippedStatus = (status: number | string) =>
  parseOrderStatusCode(status) === OrderStatusCode.Shipped

const isActiveStatus = (status: number | string) => {
  const code = parseOrderStatusCode(status)
  if (code === -1) {
    return true
  }

  return (
    code !== OrderStatusCode.Shipped &&
    code !== OrderStatusCode.Delivered &&
    code !== OrderStatusCode.Cancelled &&
    code !== OrderStatusCode.Refunded
  )
}

const getOrderStatusBadge = (status: number | string) => {
  const code = parseOrderStatusCode(status)

  if (code === OrderStatusCode.Delivered) {
    return { label: 'Levererad', tone: 'delivered' }
  }

  if (code === OrderStatusCode.Shipped) {
    return { label: 'Skickad', tone: 'shipped' }
  }

  if (code === OrderStatusCode.Cancelled || code === OrderStatusCode.Refunded) {
    return { label: 'Avbruten', tone: 'cancelled' }
  }

  return { label: 'Behandlas', tone: 'processing' }
}

const getPaymentBadge = (status: number | string | null | undefined) => {
  const code = parsePaymentStatusCode(status)
  const isPaid = code === PaymentStatusCode.Paid

  return {
    label: isPaid ? 'Betald' : 'Ej betald',
    tone: isPaid ? 'paid' : 'unpaid',
  }
}

const getOrderProgressIndex = (
  status: number | string,
  paymentStatus: number | string | null | undefined,
) => {
  const statusCode = parseOrderStatusCode(status)
  const paymentCode = parsePaymentStatusCode(paymentStatus)

  switch (statusCode) {
    case OrderStatusCode.Delivered:
      return 4
    case OrderStatusCode.Shipped:
      return 3
    case OrderStatusCode.Packed:
      return 2
    case OrderStatusCode.Paid:
      return 1
    case OrderStatusCode.Confirmed:
      return paymentCode === PaymentStatusCode.Paid ? 1 : 0
    case OrderStatusCode.Pending:
      return 0
    default:
      return paymentCode === PaymentStatusCode.Paid ? 1 : 0
  }
}

const getOrderPreviewItems = (order: OrderSummary, maxItems = 2) => {
  if (!order.items || order.items.length === 0) {
    return { items: [] as OrderItem[], remainingCount: 0 }
  }

  const items = order.items.slice(0, maxItems)
  const remainingCount = Math.max(0, order.items.length - items.length)

  return { items, remainingCount }
}

function OrdersPage({ user, isAdmin, onLogout }: OrdersPageProps) {
  const location = useLocation()
  const state = (location.state as CheckoutSuccessState | null) ?? null

  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [activeTab, setActiveTab] = useState<OrdersTab>('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeOrderId, setActiveOrderId] = useState('')
  const [cancelingOrderId, setCancelingOrderId] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [productImageUrls, setProductImageUrls] = useState<Record<string, string>>({})
  const modalRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (selectedOrder) {
      modalRef.current?.focus()
    }
  }, [selectedOrder])

  useEffect(() => {
    const productIds = new Set<string>()
    for (const order of orders) {
      order.items?.forEach((item) => productIds.add(item.productId))
    }
    selectedOrder?.items?.forEach((item) => productIds.add(item.productId))

    const pendingIds = [...productIds].filter((id) => !productImageUrls[id])
    if (pendingIds.length === 0) {
      return
    }

    let cancelled = false

    const loadImages = async () => {
      const entries = await Promise.all(
        pendingIds.map(async (productId) => {
          try {
            const images = await getProductImages(productId)
            const url = await resolveWorkingImageUrl(getProductImageCandidates(images))
            return url ? [productId, url] : null
          } catch {
            return null
          }
        }),
      )

      if (cancelled) {
        return
      }

      const resolved = Object.fromEntries(
        entries.filter((entry): entry is [string, string] => entry !== null),
      )
      if (Object.keys(resolved).length > 0) {
        setProductImageUrls((prev) => ({ ...prev, ...resolved }))
      }
    }

    void loadImages()

    return () => {
      cancelled = true
    }
  }, [orders, selectedOrder, productImageUrls])

  const checkoutSuccessMessage = useMemo(
    () => state?.checkoutSuccess ?? '',
    [state?.checkoutSuccess],
  )

  const orderStats = useMemo(() => {
    let currency = ''
    let active = 0
    let shipped = 0
    let delivered = 0
    let cancelled = 0
    let totalSpent = 0

    for (const order of orders) {
      if (!currency && order.currency) {
        currency = order.currency
      }

      const statusCode = parseOrderStatusCode(order.status)
      const isCancelled =
        statusCode === OrderStatusCode.Cancelled || statusCode === OrderStatusCode.Refunded
      const isDelivered = statusCode === OrderStatusCode.Delivered
      const isShipped = statusCode === OrderStatusCode.Shipped

      if (isCancelled) {
        cancelled += 1
      } else if (isDelivered) {
        delivered += 1
      } else if (isShipped) {
        shipped += 1
      } else {
        active += 1
      }

      if (!isCancelled && Number.isFinite(order.totalAmount)) {
        totalSpent += order.totalAmount
      }
    }

    return {
      all: orders.length,
      active,
      shipped,
      delivered,
      cancelled,
      totalSpent,
      currency: currency || 'SEK',
    }
  }, [orders])

  const tabCounts: Record<OrdersTab, number> = {
    all: orderStats.all,
    active: orderStats.active,
    shipped: orderStats.shipped,
    delivered: orderStats.delivered,
    cancelled: orderStats.cancelled,
  }

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return orders.filter((order) => isActiveStatus(order.status))
      case 'shipped':
        return orders.filter((order) => isShippedStatus(order.status))
      case 'delivered':
        return orders.filter((order) => isDeliveredStatus(order.status))
      case 'cancelled':
        return orders.filter((order) => isCancelledStatus(order.status))
      default:
        return orders
    }
  }, [activeTab, orders])

  const activeTabEmptyMessage = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return 'Du har inga aktiva beställningar just nu.'
      case 'shipped':
        return 'Du har inga skickade beställningar ännu.'
      case 'delivered':
        return 'Du har inga levererade beställningar ännu.'
      case 'cancelled':
        return 'Du har inga avbrutna beställningar ännu.'
      default:
        return 'Du har inga beställningar ännu.'
    }
  }, [activeTab])

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
    if (code === -1) {
      return typeof status === 'string' ? status : `Okänd (${String(status)})`
    }

    const labels: Record<number, string> = {
      [OrderStatusCode.Pending]: 'Väntar',
      [OrderStatusCode.Confirmed]: 'Bekräftad',
      [OrderStatusCode.Paid]: 'Betald',
      [OrderStatusCode.Packed]: 'Packas',
      [OrderStatusCode.Shipped]: 'Skickad',
      [OrderStatusCode.Delivered]: 'Levererad',
      [OrderStatusCode.Cancelled]: 'Avbruten',
      [OrderStatusCode.Refunded]: 'Återbetald',
    }

    return labels[code] ?? `Kod ${code}`
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

  const getFallbackImageUrl = (item: OrderItem, currency: string) => {
    const product: Product = {
      id: item.productId,
      categoryId: '',
      name: item.productName || 'Produkt',
      shortDescription: '',
      description: '',
      price: item.unitPrice ?? 0,
      currency,
      stockQuantity: 0,
    }
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }

  const formatPaymentStatus = (status: number | string | null | undefined) => {
    const code =
      typeof status === 'number'
        ? status
        : typeof status === 'string'
          ? parsePaymentStatusCode(status)
          : NaN
    if (!Number.isFinite(code)) {
      return typeof status === 'string' ? status : '-'
    }

    const labels: Record<number, string> = {
      [PaymentStatusCode.Unpaid]: 'Ej betald',
      [PaymentStatusCode.Paid]: 'Betald',
      [PaymentStatusCode.Failed]: 'Misslyckad',
      [PaymentStatusCode.Refunded]: 'Återbetald',
    }

    return labels[code] ?? `Kod ${code}`
  }

  const formatAddressLines = (address?: OrderAddress) => {
    if (!address) {
      return ['-']
    }

    const lines = [
      `${address.firstName} ${address.lastName}`.trim(),
      address.company || '',
      address.streetLine1,
      address.streetLine2 || '',
      `${address.postalCode} ${address.city}`.trim(),
      address.region || '',
      address.countryCode || '',
      address.phoneNumber ? `Tel: ${address.phoneNumber}` : '',
    ]

    return lines.filter((line) => line.trim().length > 0)
  }

  const handleCloseDetails = () => {
    setSelectedOrder(null)
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleCloseDetails()
    }
  }

  const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      handleCloseDetails()
    }
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
          <p className="orders-loading">Laddar beställningar...</p>
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
            <p>Du har inga beställningar ännu. Fortsätt handla för att skapa din första order.</p>
            <div className="sv-empty-actions">
              <Link className="sv-btn-primary" to="/dashboard">
                Fortsätt handla
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="orders-summary">
              <div className="orders-summary-card">
                <p className="orders-summary-label">Aktiva beställningar</p>
                <p className="orders-summary-value">{orderStats.active}</p>
              </div>
              <div className="orders-summary-card">
                <p className="orders-summary-label">Levererade beställningar</p>
                <p className="orders-summary-value">{orderStats.delivered}</p>
              </div>
              <div className="orders-summary-card">
                <p className="orders-summary-label">Avbrutna beställningar</p>
                <p className="orders-summary-value">{orderStats.cancelled}</p>
              </div>
              <div className="orders-summary-card">
                <p className="orders-summary-label">Totalt spenderat</p>
                <p className="orders-summary-value">
                  {formatAmount(orderStats.totalSpent, orderStats.currency)}
                </p>
              </div>
            </div>

            <div className="orders-tabs" role="tablist" aria-label="Filtrera beställningar">
              {ORDER_TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const count = tabCounts[tab.id]

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`orders-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={isActive}
                  >
                    <span>{tab.label}</span>
                    <span className="orders-tab-count">{count}</span>
                  </button>
                )
              })}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="orders-empty-tab">
                <p>{activeTabEmptyMessage}</p>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map((order) => {
                  const statusBadge = getOrderStatusBadge(order.status)
                  const paymentBadge = getPaymentBadge(order.paymentStatus)
                  const paymentStatusLabel = formatPaymentStatus(order.paymentStatus)
                  const preview = getOrderPreviewItems(order, 2)
                  const isCancelled = isCancelledStatus(order.status)
                  const rawProgressIndex = isCancelled
                    ? 0
                    : getOrderProgressIndex(order.status, order.paymentStatus)
                  const progressIndex = Math.min(
                    ORDER_PROGRESS_STEPS.length - 1,
                    Math.max(0, rawProgressIndex),
                  )
                  const progressPercent = Math.round(
                    (progressIndex / (ORDER_PROGRESS_STEPS.length - 1)) * 100,
                  )
                  const progressStyle = {
                    '--progress': `${progressPercent}%`,
                  } as CSSProperties

                  return (
                    <article key={order.id} className="order-card">
                      <div className="order-card-top">
                        <div className="order-card-left">
                          <p className="order-card-label">Ordernummer</p>
                          <h3 className="order-card-number">
                            {order.orderNumber || order.id}
                          </h3>
                          <p className="order-card-date">
                            Beställd {formatDate(order.createdAtUtc)}
                          </p>
                          <div className="order-badges">
                            <span className={`status-badge ${statusBadge.tone}`}>
                              {statusBadge.label}
                            </span>
                            <span
                              className={`payment-badge ${paymentBadge.tone}`}
                              title={paymentStatusLabel}
                            >
                              {paymentBadge.label}
                            </span>
                          </div>
                        </div>
                        <div className="order-card-right">
                          <div className="order-card-stat">
                            <span className="order-card-stat-label">Totalsumma</span>
                            <p className="order-card-total">
                              {formatAmount(order.totalAmount, order.currency)}
                            </p>
                          </div>
                          <div className="order-card-stat">
                            <span className="order-card-stat-label">Produkter</span>
                            <p className="order-card-count">{getItemCount(order)} st</p>
                          </div>
                          <div className="order-card-actions">
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
                                {cancelingOrderId === order.id
                                  ? 'Avbryter...'
                                  : 'Avbryt beställning'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`order-progress ${isCancelled ? 'is-cancelled' : ''}`}>
                        <div className="order-progress-top">
                          <span className="order-progress-label">Orderstatus</span>
                          {isCancelled && (
                            <span className="order-progress-cancelled">Avbruten</span>
                          )}
                        </div>
                        <div className="order-progress-track" style={progressStyle}>
                          <span className="order-progress-fill" />
                        </div>
                        <div
                          className={`order-progress-steps ${isCancelled ? 'is-muted' : ''}`}
                        >
                          {ORDER_PROGRESS_STEPS.map((step, index) => (
                            <div
                              key={step}
                              className={`order-progress-step ${
                                index <= progressIndex ? 'is-complete' : ''
                              }`}
                            >
                              <span className="order-progress-dot" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {preview.items.length > 0 && (
                        <div className="order-items-preview">
                          {preview.items.map((item) => {
                            const imageUrl =
                              productImageUrls[item.productId] ??
                              getFallbackImageUrl(item, order.currency)
                            return (
                              <div key={item.id} className="order-item-preview">
                                <img
                                  src={imageUrl}
                                  alt={item.productName}
                                  onError={(e) => {
                                    const fallback = getFallbackImageUrl(item, order.currency)
                                    if (e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback
                                    }
                                  }}
                                />
                                <div>
                                  <p className="order-item-name">{item.productName}</p>
                                  <p className="order-item-meta">Antal: {item.quantity}</p>
                                </div>
                              </div>
                            )
                          })}
                          {preview.remainingCount > 0 && (
                            <p className="order-items-more">
                              +{preview.remainingCount} fler produkter
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}

        {selectedOrder && (
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            onClick={handleBackdropClick}
            onKeyDown={handleModalKeyDown}
            tabIndex={-1}
            ref={modalRef}
          >
            <div className="order-modal-card">
              <header className="order-modal-header">
                <div>
                  <p className="order-modal-eyebrow">Orderdetaljer</p>
                  <h2 id="order-details-title">
                    Ordernummer: {selectedOrder.orderNumber || selectedOrder.id}
                  </h2>
                  <p className="order-modal-meta">
                    <span>Status: {getStatusLabel(selectedOrder.status)}</span>
                    <span>Betalning: {formatPaymentStatus(selectedOrder.paymentStatus)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="order-modal-close"
                  onClick={handleCloseDetails}
                  aria-label="Stäng orderdetaljer"
                >
                  ×
                </button>
              </header>

              <div className="order-details-grid">
                <section className="order-details-card">
                  <h3>Orderinfo</h3>
                  <p><strong>Orderdatum:</strong> {formatDate(selectedOrder.createdAtUtc)}</p>
                  <p>
                    <strong>Uppdaterad:</strong>{' '}
                    {selectedOrder.updatedAtUtc ? formatDate(selectedOrder.updatedAtUtc) : '-'}
                  </p>
                  <p><strong>Orderstatus:</strong> {getStatusLabel(selectedOrder.status)}</p>
                  <p>
                    <strong>Betalningsstatus:</strong>{' '}
                    {formatPaymentStatus(selectedOrder.paymentStatus)}
                  </p>
                </section>
                <section className="order-details-card">
                  <h3>Betalning</h3>
                  <p><strong>Betalningsmetod:</strong> {selectedOrder.paymentProvider || '-'}</p>
                  <p>
                    <strong>Transaktion:</strong> {selectedOrder.paymentTransactionId || '-'}
                  </p>
                  <p>
                    <strong>Delsumma:</strong>{' '}
                    {formatAmount(selectedOrder.subtotalAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Frakt:</strong>{' '}
                    {formatAmount(selectedOrder.shippingAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Moms:</strong>{' '}
                    {formatAmount(selectedOrder.taxAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Rabatt:</strong>{' '}
                    {formatAmount(selectedOrder.discountAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Totalsumma:</strong>{' '}
                    {formatAmount(selectedOrder.totalAmount, selectedOrder.currency)}
                  </p>
                </section>
                <section className="order-details-card">
                  <h3>Leveransadress</h3>
                  {formatAddressLines(selectedOrder.shippingAddress).map((line) => (
                    <p key={`ship-${line}`}>{line}</p>
                  ))}
                </section>
                <section className="order-details-card">
                  <h3>Fakturaadress</h3>
                  {formatAddressLines(selectedOrder.billingAddress).map((line) => (
                    <p key={`bill-${line}`}>{line}</p>
                  ))}
                </section>
              </div>

              <div className="cart-table-wrap">
                <table className="cart-table order-details-table">
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th>Antal</th>
                      <th>Styckpris</th>
                      <th>Totalt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => {
                      const imageUrl =
                        productImageUrls[item.productId] ??
                        getFallbackImageUrl(item, selectedOrder.currency)
                      return (
                        <tr key={item.id}>
                          <td className="order-details-product">
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              onError={(e) => {
                                const fallback = getFallbackImageUrl(item, selectedOrder.currency)
                                if (e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback
                                }
                              }}
                            />
                            <div>
                              <p className="order-item-name">{item.productName}</p>
                              <p className="order-item-meta">ID: {item.productId}</p>
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatAmount(item.unitPrice, selectedOrder.currency)}</td>
                          <td>{formatAmount(item.totalPrice, selectedOrder.currency)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}

export default OrdersPage
