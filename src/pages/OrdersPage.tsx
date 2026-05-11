import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { getProductImagePath, getProductProfile } from '../components/ProductCard'
import { getOrderById, getOrders, updateOrderStatus } from '../services/cartApi'
import { getProductImages } from '../services/productImagesApi'
import type { AuthUser } from '../types/auth'
import type { ProductImage } from '../types/product-image'
import {
  getOrderStatusLabel,
  OrderStatusCode,
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

  const getOrderItemPreview = (order: OrderSummary): OrderItem[] => {
    if (!order.items || order.items.length === 0) {
      return []
    }

    return order.items.slice(0, 1)
  }

  const getFallbackImageUrl = (item: OrderItem, currency: string) => {
    const product: Product = {
      id: item.productId,
      name: item.productName || 'Produkt',
      shortDescription: '',
      price: item.unitPrice ?? 0,
      currency,
    }
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }

  const formatPaymentStatus = (status: number | string | null | undefined) => {
    if (typeof status === 'string') {
      return status
    }

    const code = typeof status === 'number' ? status : NaN
    if (!Number.isFinite(code)) {
      return '-'
    }

    const labels: Record<number, string> = {
      0: 'Ej betald',
      1: 'Betald',
      2: 'Misslyckad',
      3: 'Aterbetald',
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
                <h3>Ordernummer: {order.orderNumber || order.id}</h3>
                <p><strong>Skapad:</strong> {formatDate(order.createdAtUtc)}</p>
                <p>
                  <strong>Totalt:</strong> {formatAmount(order.totalAmount, order.currency)}
                </p>
                <p><strong>Produkter:</strong> {getItemCount(order)}</p>
                {getOrderItemPreview(order).length > 0 && (
                  <div className="order-items-preview">
                    {getOrderItemPreview(order).map((item) => {
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
                  </div>
                )}
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
