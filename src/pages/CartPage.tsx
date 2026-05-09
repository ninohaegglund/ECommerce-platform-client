import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { getProductImagePath, getProductProfile } from '../components/ProductCard'
import { getCart, removeCartItem, updateCartItem } from '../services/cartApi'
import { getProductImages } from '../services/productImagesApi'
import type { AuthUser } from '../types/auth'
import type { Cart, CartItem } from '../types/cart'
import type { ProductImage } from '../types/product-image'
import type { Product } from '../data/products'

type CartPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
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

function CartPage({ user, isAdmin, onLogout }: CartPageProps) {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [productImageUrls, setProductImageUrls] = useState<Record<string, string>>({})

  const loadCart = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getCart()
      setCart(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ladda varukorgen.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCart()
  }, [loadCart])

  useEffect(() => {
    const productIds = cart?.items.map((item) => item.productId) ?? []
    const pendingIds = productIds.filter((id) => !productImageUrls[id])
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
  }, [cart, productImageUrls])

  const formattedSubtotal = useMemo(() => {
    if (!cart) {
      return '-'
    }

    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: cart.currency || 'SEK',
      maximumFractionDigits: 2,
    }).format(cart.subtotalAmount)
  }, [cart])

  const getFallbackImageUrl = (item: CartItem) => {
    const product: Product = {
      id: item.productId,
      name: item.productName || 'Produkt',
      shortDescription: '',
      price: item.unitPrice ?? 0,
      currency: cart?.currency || 'SEK',
    }
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }

  const changeQuantity = async (item: CartItem, nextQuantity: number) => {
    if (nextQuantity < 1) {
      return
    }

    setActiveItemId(item.id)
    setError('')
    setSuccess('')

    try {
      await updateCartItem(item.id, { quantity: nextQuantity })
      await loadCart()
      setSuccess('Antal uppdaterat.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte uppdatera antal.'
      setError(message)
    } finally {
      setActiveItemId('')
    }
  }

  const removeItem = async (itemId: string) => {
    setActiveItemId(itemId)
    setError('')
    setSuccess('')

    try {
      await removeCartItem(itemId)
      await loadCart()
      setSuccess('Produkt borttagen.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ta bort produkt.'
      setError(message)
    } finally {
      setActiveItemId('')
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="cart-page">
        <h2 className="sv-section-title">Din varukorg</h2>
        <p className="sv-section-subtitle">Granska och slutför din beställning.</p>

        {error && <p className="feedback error">{error}</p>}
        {success && <p className="feedback success">{success}</p>}

        {isLoading ? (
          <p>Laddar varukorg...</p>
        ) : !cart || cart.items.length === 0 ? (
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
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2>Varukorgen är tom</h2>
            <p>Bläddra i butiken för att börja handla — Pokémon-kort, spel och refurbished konsoler väntar.</p>
            <div className="sv-empty-actions">
              <Link className="sv-btn-primary" to="/dashboard">Till butiken</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Antal</th>
                    <th>Styckpris</th>
                    <th>Totalt</th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id}>
                      <td className="cart-product-cell">
                        <img
                          src={productImageUrls[item.productId] ?? getFallbackImageUrl(item)}
                          alt={item.productName}
                          onError={(e) => {
                            const fallback = getFallbackImageUrl(item)
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback
                            }
                          }}
                        />
                        <span>{item.productName}</span>
                      </td>
                      <td>
                        <div className="qty-controls">
                          <button
                            type="button"
                            onClick={() => void changeQuantity(item, item.quantity - 1)}
                            disabled={activeItemId === item.id || item.quantity <= 1}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => void changeQuantity(item, item.quantity + 1)}
                            disabled={activeItemId === item.id}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{item.unitPrice.toFixed(2)}</td>
                      <td>{item.lineTotal.toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => void removeItem(item.id)}
                          disabled={activeItemId === item.id}
                        >
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cart-summary">
              <p>
                <strong>Delsumma:</strong> {formattedSubtotal}
              </p>
              <button
                type="button"
                className="submit-btn"
                onClick={() => navigate('/checkout')}
              >
                Gå till kassan
              </button>
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}

export default CartPage
