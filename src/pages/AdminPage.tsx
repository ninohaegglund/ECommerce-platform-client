import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import ProductImageUpload from '../components/ProductImageUpload'
import type { Product } from '../data/products'
import { getCatalogCategories } from '../services/categoryApi'
import { createCatalogProduct, getCatalogProducts } from '../services/catalogApi'
import { getAllOrders, getOrderById } from '../services/cartApi'
import { getInventoryStock, setInventoryStock } from '../services/inventoryApi'
import {
  getNewsletterSubscribers,
  sendNewsletter,
  sendNewsletterTest,
  type NewsletterRecipientResult,
  type NewsletterSendRequest,
  type NewsletterSendResult,
  type NewsletterSubscriber,
} from '../services/newsletterApi'
import type { AuthUser } from '../types/auth'
import type { Category } from '../types/category'
import type { InventoryStock } from '../types/inventory'
import {
  getOrderStatusLabel,
  PaymentStatusCode,
  parseOrderStatusCode,
  type OrderAddress,
  type OrderDetails,
  type OrderSummary,
} from '../types/order'
import { slugifyCategoryName } from '../utils/category'

type AdminPageProps = {
  user: AuthUser
  onLogout: () => void
}

type CreateProductFormState = {
  categoryId: string
  name: string
  slug: string
  sku: string
  shortDescription: string
  description: string
  price: string
  compareAtPrice: string
  currency: string
  stockQuantity: string
  isActive: boolean
  status: string
  imageUrl: string
  imageAltText: string
}

type NewsletterFormState = {
  subject: string
  body: string
  htmlBody: string
  testRecipientEmail: string
}

const emptyProductForm: CreateProductFormState = {
  categoryId: '',
  name: '',
  slug: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: '',
  compareAtPrice: '',
  currency: 'SEK',
  stockQuantity: '0',
  isActive: true,
  status: '0',
  imageUrl: '',
  imageAltText: '',
}

const defaultNewsletterForm: NewsletterFormState = {
  subject: 'Nyheter från Spelvalvet',
  body: '',
  htmlBody: '',
  testRecipientEmail: '',
}

function getCategoryOptions(categories: Category[]) {
  const childrenByParentId = new Map<string, Category[]>()
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'))

  sortedCategories.forEach((category) => {
    if (!category.parentCategoryId) return
    const children = childrenByParentId.get(category.parentCategoryId) ?? []
    children.push(category)
    childrenByParentId.set(category.parentCategoryId, children)
  })

  const rootCategories = sortedCategories.filter((category) => !category.parentCategoryId)
  const roots = rootCategories.length > 0 ? rootCategories : sortedCategories
  const options: Array<{ category: Category; depth: number }> = []

  const visit = (category: Category, depth: number) => {
    options.push({ category, depth })
    childrenByParentId.get(category.id)?.forEach((child) => visit(child, depth + 1))
  }

  roots.forEach((category) => visit(category, 0))

  return options
}

function AdminPage({ user, onLogout }: AdminPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [stockValue, setStockValue] = useState('0')
  const [currentStock, setCurrentStock] = useState<InventoryStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [productForm, setProductForm] = useState<CreateProductFormState>(emptyProductForm)
  const [createProductError, setCreateProductError] = useState('')
  const [createProductSuccess, setCreateProductSuccess] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [activeOrderId, setActiveOrderId] = useState('')
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [newsletterForm, setNewsletterForm] = useState<NewsletterFormState>(() => ({
    ...defaultNewsletterForm,
    testRecipientEmail: user.email,
  }))
  const [newsletterResult, setNewsletterResult] = useState<NewsletterSendResult | null>(null)
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true)
  const [isSendingNewsletterTest, setIsSendingNewsletterTest] = useState(false)
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false)
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState('')
  const modalRef = useRef<HTMLDivElement | null>(null)

  const categoryOptions = useMemo(() => getCategoryOptions(categories), [categories])
  const activeSubscriberCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.isActive !== false).length,
    [subscribers],
  )

  const loadProducts = useCallback(async (preferredProductId?: string) => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getCatalogProducts()
      setProducts(data)
      setSelectedProductId((current) => preferredProductId || current || data[0]?.id || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load catalog products.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true)
    setOrdersError('')

    try {
      const data = await getAllOrders()
      setOrders(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load orders.'
      setOrdersError(message)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  const loadNewsletterSubscribers = useCallback(async () => {
    setIsLoadingSubscribers(true)
    setNewsletterError('')

    try {
      const data = await getNewsletterSubscribers()
      setSubscribers(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load newsletter subscribers.'
      setNewsletterError(message)
    } finally {
      setIsLoadingSubscribers(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    void loadNewsletterSubscribers()
  }, [loadNewsletterSubscribers])

  useEffect(() => {
    if (selectedOrder) {
      modalRef.current?.focus()
    }
  }, [selectedOrder])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true)

      try {
        const data = await getCatalogCategories()
        setCategories(data)
        setProductForm((current) => ({
          ...current,
          categoryId: current.categoryId || data[0]?.id || '',
        }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load categories.'
        setCreateProductError(message)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    void loadCategories()
  }, [])

  useEffect(() => {
    const loadStock = async () => {
      if (!selectedProductId) {
        setCurrentStock(null)
        return
      }

      try {
        setCurrentStock(await getInventoryStock(selectedProductId))
      } catch {
        setCurrentStock(null)
      }
    }

    void loadStock()
  }, [selectedProductId])

  useEffect(() => {
    if (currentStock) {
      setStockValue(String(currentStock.quantityAvailable))
      return
    }

    setStockValue('0')
  }, [currentStock])

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

  const formatPaymentStatus = (status: number | string | null | undefined) => {
    if (typeof status === 'string') {
      return status
    }

    const code = typeof status === 'number' ? status : NaN
    if (!Number.isFinite(code)) {
      return '-'
    }

    const labels: Record<number, string> = {
      [PaymentStatusCode.Unpaid]: 'Unpaid',
      [PaymentStatusCode.Paid]: 'Paid',
      [PaymentStatusCode.Failed]: 'Failed',
      [PaymentStatusCode.Refunded]: 'Refunded',
    }

    return labels[code] ?? `Code ${code}`
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

  const getItemCount = (order: OrderSummary) => {
    if (typeof order.itemCount === 'number') {
      return order.itemCount
    }

    if (order.items) {
      return order.items.reduce((total, item) => total + item.quantity, 0)
    }

    return 0
  }

  const getCustomerName = (order: OrderSummary) => {
    const shipping = order.shippingAddress
    if (shipping && (shipping.firstName || shipping.lastName)) {
      return `${shipping.firstName} ${shipping.lastName}`.trim()
    }

    const billing = order.billingAddress
    if (billing && (billing.firstName || billing.lastName)) {
      return `${billing.firstName} ${billing.lastName}`.trim()
    }

    return 'Unknown'
  }

  const getCustomerEmail = (order: OrderSummary) => {
    const email = order.customerEmail?.trim()
    if (email) {
      return email
    }

    return order.userId ?? 'Unknown email'
  }

  const getSubscriberName = (subscriber: NewsletterSubscriber) => {
    const name = `${subscriber.firstName ?? ''} ${subscriber.lastName ?? ''}`.trim()
    return name || '-'
  }

  const getSubscriberDate = (subscriber: NewsletterSubscriber) => {
    return formatDate(subscriber.subscribedAtUtc ?? subscriber.createdAtUtc ?? '')
  }

  const formatRecipientResult = (recipient: NewsletterRecipientResult) => {
    if (typeof recipient === 'string') {
      return recipient
    }

    return [
      recipient.email ?? recipient.recipientEmail ?? 'Unknown recipient',
      recipient.status,
      recipient.error,
    ]
      .filter(Boolean)
      .join(' - ')
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
    setOrdersError('')

    try {
      const details = await getOrderById(id)
      setSelectedOrder(details)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load order details.'
      setOrdersError(message)
    } finally {
      setActiveOrderId('')
    }
  }

  const handleSaveStock = async () => {
    if (!selectedProductId) {
      setError('Choose a product first.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const nextStock = Number(stockValue)
      if (!Number.isFinite(nextStock) || nextStock < 0) {
        throw new Error('Stock must be a non-negative number.')
      }

      const saved = await setInventoryStock({
        productId: selectedProductId,
        quantityAvailable: nextStock,
      })

      setCurrentStock(saved)
      setSuccess('Stock saved successfully.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save stock.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const updateProductForm = <Key extends keyof CreateProductFormState>(
    key: Key,
    value: CreateProductFormState[Key],
  ) => {
    setProductForm((current) => ({ ...current, [key]: value }))
  }

  const updateNewsletterForm = <Key extends keyof NewsletterFormState>(
    key: Key,
    value: NewsletterFormState[Key],
  ) => {
    setNewsletterForm((current) => ({ ...current, [key]: value }))
  }

  const buildNewsletterPayload = (): NewsletterSendRequest => {
    const subject = newsletterForm.subject.trim()
    const body = newsletterForm.body.trim()
    const htmlBody = newsletterForm.htmlBody.trim()

    if (!subject) {
      throw new Error('Subject is required.')
    }

    if (!body) {
      throw new Error('Body is required.')
    }

    return htmlBody ? { subject, body, htmlBody } : { subject, body }
  }

  const handleSendNewsletterTest = async () => {
    setIsSendingNewsletterTest(true)
    setNewsletterError('')
    setNewsletterSuccess('')
    setNewsletterResult(null)

    try {
      const recipientEmail = newsletterForm.testRecipientEmail.trim()
      if (!recipientEmail) {
        throw new Error('Enter a test recipient email.')
      }

      const result = await sendNewsletterTest({
        recipientEmail,
        ...buildNewsletterPayload(),
      })

      setNewsletterResult(result)
      setNewsletterSuccess(`Test newsletter sent to ${recipientEmail}.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send test newsletter.'
      setNewsletterError(message)
    } finally {
      setIsSendingNewsletterTest(false)
    }
  }

  const handleSendNewsletter = async () => {
    setIsSendingNewsletter(true)
    setNewsletterError('')
    setNewsletterSuccess('')
    setNewsletterResult(null)

    try {
      if (activeSubscriberCount === 0) {
        throw new Error('There are no active subscribers to send to.')
      }

      const result = await sendNewsletter(buildNewsletterPayload())

      setNewsletterResult(result)
      setNewsletterSuccess('Newsletter sent to active subscribers.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send newsletter.'
      setNewsletterError(message)
    } finally {
      setIsSendingNewsletter(false)
    }
  }

  const handleCreateProduct = async () => {
    setIsCreatingProduct(true)
    setCreateProductError('')
    setCreateProductSuccess('')
    setSuccess('')
    setError('')

    try {
      const name = productForm.name.trim()
      const categoryId = productForm.categoryId.trim()
      const price = Number(productForm.price)
      const compareAtPrice = productForm.compareAtPrice.trim()
        ? Number(productForm.compareAtPrice)
        : null
      const stockQuantity = Number(productForm.stockQuantity)
      const status = Number(productForm.status)

      if (!categoryId) {
        throw new Error('Choose a category.')
      }

      if (!name) {
        throw new Error('Product name is required.')
      }

      if (!productForm.sku.trim()) {
        throw new Error('SKU is required.')
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Price must be a non-negative number.')
      }

      if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
        throw new Error('Compare-at price must be a non-negative number.')
      }

      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        throw new Error('Stock quantity must be a non-negative whole number.')
      }

      if (!Number.isInteger(status) || status < 0) {
        throw new Error('Status must be a non-negative number.')
      }

      const imageUrl = productForm.imageUrl.trim()
      const created = await createCatalogProduct({
        categoryId,
        name,
        slug: productForm.slug.trim() || slugifyCategoryName(name),
        sku: productForm.sku.trim(),
        shortDescription: productForm.shortDescription.trim(),
        description: productForm.description.trim(),
        price,
        compareAtPrice,
        currency: productForm.currency.trim() || 'SEK',
        stockQuantity,
        isActive: productForm.isActive,
        status,
        images: imageUrl
          ? [
            {
              imageUrl,
              altText: productForm.imageAltText.trim() || name,
              sortOrder: 0,
              isPrimary: true,
            },
          ]
          : [],
      })

      setProductForm((current) => ({
        ...emptyProductForm,
        categoryId: current.categoryId,
      }))
      setSelectedProductId(created.id)
      setCreateProductSuccess(`${created.name} created successfully.`)
      await loadProducts(created.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create product.'
      setCreateProductError(message)
    } finally {
      setIsCreatingProduct(false)
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={true} onLogout={onLogout} />

      <section className="admin-panel">
        <p className="eyebrow">Admin</p>
        <h1>Admin Control Room</h1>
        <p className="subtitle">Only users with the Admin role can open this page.</p>

        <div className="admin-grid">
          <article className="admin-card">
            <h3>Orders Monitor</h3>
            <p>Track order statuses and manually resolve failed payments.</p>
            <div className="admin-card-actions">
              <a className="ghost-btn" href="#admin-orders">View all orders</a>
            </div>
          </article>
          <article className="admin-card">
            <h3>Inventory Manager</h3>
            <p>Add or update stock reservations and stock visibility.</p>
          </article>
          <article className="admin-card">
            <h3>User Access</h3>
            <p>Review user roles and account activity logs.</p>
          </article>
          <article className="admin-card">
            <h3>Nyhetsbrev</h3>
            <p>Review subscribers, send a test email, and publish newsletters manually.</p>
            <div className="admin-card-actions">
              <a className="ghost-btn" href="#admin-newsletter">Open newsletter</a>
            </div>
          </article>
        </div>

        <div className="admin-stock-panel" id="admin-newsletter">
          <h2>Nyhetsbrev</h2>
          <p className="subtitle">
            Send test emails first, then publish manually to active subscribers.
          </p>

          <div className="admin-newsletter-stats">
            <div>
              <span>Total subscribers</span>
              <strong>{subscribers.length}</strong>
            </div>
            <div>
              <span>Active subscribers</span>
              <strong>{activeSubscriberCount}</strong>
            </div>
            <div>
              <span>Notification API</span>
              <strong>localhost:5205</strong>
            </div>
          </div>

          {newsletterError && <p className="feedback error">{newsletterError}</p>}
          {newsletterSuccess && <p className="feedback success">{newsletterSuccess}</p>}

          <div className="admin-newsletter-layout">
            <section className="admin-newsletter-card">
              <div className="admin-newsletter-card-header">
                <div>
                  <h3>Subscribers</h3>
                  <p className="subtitle">Fetched from NotificationService.API.</p>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => void loadNewsletterSubscribers()}
                  disabled={isLoadingSubscribers}
                >
                  {isLoadingSubscribers ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {isLoadingSubscribers ? (
                <p>Loading subscribers...</p>
              ) : subscribers.length === 0 ? (
                <p className="subtitle">No newsletter subscribers found.</p>
              ) : (
                <div className="admin-subscriber-list">
                  {subscribers.map((subscriber) => (
                    <article
                      key={subscriber.id ?? subscriber.email}
                      className="admin-subscriber-row"
                    >
                      <div>
                        <strong>{subscriber.email}</strong>
                        <span>{getSubscriberName(subscriber)}</span>
                      </div>
                      <div>
                        <span>{getSubscriberDate(subscriber)}</span>
                        <em>{subscriber.isActive === false ? 'Inactive' : 'Active'}</em>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-newsletter-card">
              <h3>Create newsletter</h3>
              <div className="admin-newsletter-form">
                <label>
                  Subject
                  <input
                    type="text"
                    value={newsletterForm.subject}
                    onChange={(event) => updateNewsletterForm('subject', event.target.value)}
                    placeholder="Nyheter från Spelvalvet"
                  />
                </label>

                <label>
                  Test recipient email
                  <input
                    type="email"
                    value={newsletterForm.testRecipientEmail}
                    onChange={(event) =>
                      updateNewsletterForm('testRecipientEmail', event.target.value)
                    }
                    placeholder="admin@example.com"
                  />
                </label>

                <label className="admin-newsletter-form__wide">
                  Body
                  <textarea
                    rows={6}
                    value={newsletterForm.body}
                    onChange={(event) => updateNewsletterForm('body', event.target.value)}
                    placeholder="Texten i nyhetsbrevet"
                  />
                </label>

                <label className="admin-newsletter-form__wide">
                  HTML body (optional)
                  <textarea
                    rows={5}
                    value={newsletterForm.htmlBody}
                    onChange={(event) => updateNewsletterForm('htmlBody', event.target.value)}
                    placeholder="<h1>Nyheter från Spelvalvet</h1>"
                  />
                </label>

                <div className="admin-newsletter-actions admin-newsletter-form__wide">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => void handleSendNewsletterTest()}
                    disabled={isSendingNewsletterTest || isSendingNewsletter}
                  >
                    {isSendingNewsletterTest ? 'Sending test...' : 'Send test'}
                  </button>
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={() => void handleSendNewsletter()}
                    disabled={
                      isSendingNewsletter ||
                      isSendingNewsletterTest ||
                      activeSubscriberCount === 0
                    }
                  >
                    {isSendingNewsletter ? 'Sending...' : 'Send to subscribers'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {newsletterResult && (
            <div className="admin-newsletter-result">
              <h3>Send result</h3>
              <div className="admin-newsletter-result-grid">
                <div>
                  <span>Total subscribers</span>
                  <strong>{newsletterResult.totalSubscribers ?? '-'}</strong>
                </div>
                <div>
                  <span>Sent</span>
                  <strong>{newsletterResult.sentCount ?? '-'}</strong>
                </div>
                <div>
                  <span>Failed</span>
                  <strong>{newsletterResult.failedCount ?? '-'}</strong>
                </div>
              </div>

              {newsletterResult.message && <p>{newsletterResult.message}</p>}

              {newsletterResult.recipients && newsletterResult.recipients.length > 0 && (
                <div className="admin-newsletter-recipients">
                  <h4>Recipients</h4>
                  <ul>
                    {newsletterResult.recipients.map((recipient, index) => (
                      <li key={`${formatRecipientResult(recipient)}-${index}`}>
                        {formatRecipientResult(recipient)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-stock-panel" id="admin-orders">
          <h2>All orders</h2>
          <p className="subtitle">View every order from OrderService API.</p>

          {ordersError && <p className="feedback error">{ordersError}</p>}

          {isLoadingOrders ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="subtitle">No orders found.</p>
          ) : (
            <div className="admin-orders-list">
              <div className="admin-orders-header" aria-hidden="true">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Payment</span>
                <span>Total</span>
                <span>Items</span>
              </div>
              {orders.map((order) => (
                <details key={order.id} className="admin-order-card">
                  <summary className="admin-order-summary">
                    <div className="admin-order-main">
                      <span className="admin-order-id">{order.orderNumber || order.id}</span>
                      <span className="admin-order-date">{formatDate(order.createdAtUtc)}</span>
                    </div>
                    <span>{getCustomerName(order)}</span>
                    <span>{getStatusLabel(order.status)}</span>
                    <span>{formatPaymentStatus(order.paymentStatus)}</span>
                    <span>{formatAmount(order.totalAmount, order.currency)}</span>
                    <span>{getItemCount(order)}</span>
                  </summary>
                  <div className="admin-order-body">
                    <div className="admin-order-meta">
                      <p><strong>Email:</strong> {getCustomerEmail(order)}</p>
                      <p><strong>Order ID:</strong> {order.id}</p>
                    </div>
                    <div className="admin-order-actions">
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => void viewOrderDetails(order.id)}
                        disabled={activeOrderId === order.id}
                      >
                        {activeOrderId === order.id ? 'Loading...' : 'View details'}
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        <div className="admin-stock-panel">
          <h2>Create product</h2>
          <p className="subtitle">Create a catalog product and assign it to a category from CatalogService.API.</p>

          {createProductError && <p className="feedback error">{createProductError}</p>}
          {createProductSuccess && <p className="feedback success">{createProductSuccess}</p>}

          <div className="admin-product-form">
            <label>
              Category
              <select
                value={productForm.categoryId}
                onChange={(event) => updateProductForm('categoryId', event.target.value)}
                disabled={isLoadingCategories || categoryOptions.length === 0}
              >
                {categoryOptions.length === 0 ? (
                  <option value="">No categories found</option>
                ) : (
                  categoryOptions.map(({ category, depth }) => (
                    <option key={category.id} value={category.id}>
                      {`${'-- '.repeat(depth)}${category.name}`}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              Product name
              <input
                type="text"
                value={productForm.name}
                onChange={(event) => updateProductForm('name', event.target.value)}
                placeholder="Silent Hill 3 - PlayStation 2"
              />
            </label>

            <label>
              Slug
              <input
                type="text"
                value={productForm.slug}
                onChange={(event) => updateProductForm('slug', event.target.value)}
                placeholder="Auto-generated from product name"
              />
            </label>

            <label>
              SKU
              <input
                type="text"
                value={productForm.sku}
                onChange={(event) => updateProductForm('sku', event.target.value)}
                placeholder="PS2-SH3"
              />
            </label>

            <label>
              Short description
              <input
                type="text"
                value={productForm.shortDescription}
                onChange={(event) => updateProductForm('shortDescription', event.target.value)}
                placeholder="Short card/dashboard text"
              />
            </label>

            <label className="admin-product-form__wide">
              Description
              <textarea
                value={productForm.description}
                onChange={(event) => updateProductForm('description', event.target.value)}
                rows={4}
                placeholder="Long product detail description"
              />
            </label>

            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(event) => updateProductForm('price', event.target.value)}
              />
            </label>

            <label>
              Compare-at price
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.compareAtPrice}
                onChange={(event) => updateProductForm('compareAtPrice', event.target.value)}
              />
            </label>

            <label>
              Currency
              <input
                type="text"
                value={productForm.currency}
                onChange={(event) => updateProductForm('currency', event.target.value.toUpperCase())}
              />
            </label>

            <label>
              Stock quantity
              <input
                type="number"
                min="0"
                step="1"
                value={productForm.stockQuantity}
                onChange={(event) => updateProductForm('stockQuantity', event.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={productForm.status}
                onChange={(event) => updateProductForm('status', event.target.value)}
              >
                <option value="0">Draft</option>
                <option value="1">Published</option>
              </select>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(event) => updateProductForm('isActive', event.target.checked)}
              />
              Active product
            </label>

            <label>
              Primary image URL
              <input
                type="url"
                value={productForm.imageUrl}
                onChange={(event) => updateProductForm('imageUrl', event.target.value)}
                placeholder="https://localhost:7019/uploads/products/image.jpg"
              />
            </label>

            <label>
              Image alt text
              <input
                type="text"
                value={productForm.imageAltText}
                onChange={(event) => updateProductForm('imageAltText', event.target.value)}
                placeholder="Defaults to product name"
              />
            </label>

            <button
              type="button"
              className="submit-btn admin-product-form__wide"
              onClick={() => void handleCreateProduct()}
              disabled={isCreatingProduct || isLoadingCategories || categoryOptions.length === 0}
            >
              {isCreatingProduct ? 'Creating product...' : 'Create product'}
            </button>
          </div>
        </div>

        <div className="admin-stock-panel">
          <h2>Set product stock</h2>
          <p className="subtitle">Write stock levels to InventoryService.API using the catalog product id.</p>

          {error && <p className="feedback error">{error}</p>}
          {success && <p className="feedback success">{success}</p>}

          {isLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="admin-stock-form">
              <label>
                Product
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Available stock
                <input
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                />
              </label>

              <button
                type="button"
                className="submit-btn"
                onClick={() => void handleSaveStock()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving stock...' : 'Save stock'}
              </button>
            </div>
          )}

          {currentStock && (
            <p className="subtitle">
              Current inventory: {currentStock.quantityAvailable} available,{' '}
              {currentStock.quantityReserved} reserved.
            </p>
          )}
        </div>

        {selectedProductId && !isLoading && (
          <div className="admin-images-panel">
            <ProductImageUpload productId={selectedProductId} />
          </div>
        )}

        {selectedOrder && (
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-details-title"
            onClick={handleBackdropClick}
            onKeyDown={handleModalKeyDown}
            tabIndex={-1}
            ref={modalRef}
          >
            <div className="order-modal-card">
              <header className="order-modal-header">
                <div>
                  <p className="order-modal-eyebrow">Order details</p>
                  <h2 id="admin-order-details-title">
                    Order: {selectedOrder.orderNumber || selectedOrder.id}
                  </h2>
                  <p className="order-modal-meta">
                    <span>Status: {getStatusLabel(selectedOrder.status)}</span>
                    <span>Payment: {formatPaymentStatus(selectedOrder.paymentStatus)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="order-modal-close"
                  onClick={handleCloseDetails}
                  aria-label="Close order details"
                >
                  X
                </button>
              </header>

              <div className="order-details-grid">
                <section className="order-details-card">
                  <h3>Order info</h3>
                  <p><strong>Order date:</strong> {formatDate(selectedOrder.createdAtUtc)}</p>
                  <p><strong>Customer email:</strong> {getCustomerEmail(selectedOrder)}</p>
                  <p>
                    <strong>Updated:</strong>{' '}
                    {selectedOrder.updatedAtUtc ? formatDate(selectedOrder.updatedAtUtc) : '-'}
                  </p>
                  <p><strong>Order status:</strong> {getStatusLabel(selectedOrder.status)}</p>
                  <p>
                    <strong>Payment status:</strong>{' '}
                    {formatPaymentStatus(selectedOrder.paymentStatus)}
                  </p>
                </section>
                <section className="order-details-card">
                  <h3>Payment</h3>
                  <p><strong>Provider:</strong> {selectedOrder.paymentProvider || '-'}</p>
                  <p>
                    <strong>Transaction:</strong> {selectedOrder.paymentTransactionId || '-'}
                  </p>
                  <p>
                    <strong>Subtotal:</strong>{' '}
                    {formatAmount(selectedOrder.subtotalAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Shipping:</strong>{' '}
                    {formatAmount(selectedOrder.shippingAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Tax:</strong>{' '}
                    {formatAmount(selectedOrder.taxAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Discount:</strong>{' '}
                    {formatAmount(selectedOrder.discountAmount ?? 0, selectedOrder.currency)}
                  </p>
                  <p>
                    <strong>Total:</strong>{' '}
                    {formatAmount(selectedOrder.totalAmount, selectedOrder.currency)}
                  </p>
                </section>
                <section className="order-details-card">
                  <h3>Shipping address</h3>
                  {formatAddressLines(selectedOrder.shippingAddress).map((line) => (
                    <p key={`ship-${line}`}>{line}</p>
                  ))}
                </section>
                <section className="order-details-card">
                  <h3>Billing address</h3>
                  {formatAddressLines(selectedOrder.billingAddress).map((line) => (
                    <p key={`bill-${line}`}>{line}</p>
                  ))}
                </section>
              </div>

              <div className="cart-table-wrap">
                <table className="cart-table order-details-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="order-details-product admin-order-product">
                          <div>
                            <p className="order-item-name">{item.productName}</p>
                            <p className="order-item-meta">ID: {item.productId}</p>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatAmount(item.unitPrice, selectedOrder.currency)}</td>
                        <td>{formatAmount(item.totalPrice, selectedOrder.currency)}</td>
                      </tr>
                    ))}
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

export default AdminPage
