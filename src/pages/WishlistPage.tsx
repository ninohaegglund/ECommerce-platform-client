import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { getProductImages } from '../services/productImagesApi'
import { getWishlist, removeWishlistItem } from '../services/wishlistApi'
import { getStoredAuth } from '../utils/authStorage'
import { getProductImagePath, getProductProfile } from '../utils/productCard'
import type { AuthUser } from '../types/auth'
import type { ProductImage } from '../types/product-image'
import type { Wishlist, WishlistItem } from '../types/wishlist'
import type { Product } from '../data/products'

type WishlistPageProps = {
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

function WishlistPage({ user, isAdmin, onLogout }: WishlistPageProps) {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [productImageUrls, setProductImageUrls] = useState<Record<string, string>>({})
  const isAuthenticated = user.id !== 'guest' && Boolean(getStoredAuth().token)

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await getWishlist()
      setWishlist(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ladda önskelistan.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlist(null)
      setError('')
      setSuccess('')
      setIsLoading(false)
      return
    }

    void loadWishlist()
  }, [isAuthenticated, loadWishlist])

  useEffect(() => {
    const productIds = wishlist?.items.map((item) => item.productId) ?? []
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
  }, [productImageUrls, wishlist])

  const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency || 'SEK',
    maximumFractionDigits: 0,
  }).format(amount)

  const formatDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value || '-'
    }

    return date.toLocaleDateString('sv-SE')
  }

  const getFallbackImageUrl = (item: WishlistItem) => {
    const product: Product = {
      id: item.productId,
      categoryId: '',
      name: item.productName || 'Produkt',
      shortDescription: '',
      description: '',
      price: item.unitPrice ?? 0,
      currency: item.currency || 'SEK',
      stockQuantity: 0,
    }
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }

  const removeItem = async (item: WishlistItem) => {
    setActiveItemId(item.id)
    setError('')
    setSuccess('')

    try {
      await removeWishlistItem(item.id)
      setWishlist((current) => (current
        ? { ...current, items: current.items.filter((entry) => entry.id !== item.id) }
        : current
      ))
      setSuccess('Produkt borttagen.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ta bort produkten.'
      setError(message)
    } finally {
      setActiveItemId('')
    }
  }

  const items = wishlist?.items ?? []

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="sv-wishlist-page">
        <div className="sv-product-section">
          <div className="sv-section-head">
            <div>
              <p className="sv-section-kicker">ÖNSKELISTA</p>
              <h2 className="sv-section-title">Dina sparade favoriter.</h2>
              <p className="sv-section-subtitle">
                Spara produkter du vill jämföra eller köpa senare.
              </p>
            </div>
          </div>

          {error && <p className="feedback error">{error}</p>}
          {success && <p className="feedback success">{success}</p>}

          {isLoading ? (
            <p style={{ color: 'var(--ink-3)' }}>Laddar önskelistan...</p>
          ) : !isAuthenticated ? (
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <h2>Logga in för att se din önskelista</h2>
              <p>Skapa konto eller logga in för att spara favoriter över tid.</p>
              <div className="sv-empty-actions">
                <Link className="sv-btn-primary" to="/login">Logga in</Link>
                <Link className="sv-btn-ghost" to="/register">Skapa konto</Link>
              </div>
            </div>
          ) : items.length === 0 ? (
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <h2>Du har inga sparade produkter än</h2>
              <p>Klicka på hjärtat på ett kort eller en produkt för att spara den här.</p>
              <div className="sv-empty-actions">
                <Link className="sv-btn-primary" to="/dashboard">Bläddra i butiken</Link>
                <Link className="sv-btn-ghost" to="/pokemon-kort">Pokémon-kort</Link>
              </div>
            </div>
          ) : (
            <div className="sv-wishlist-grid">
              {items.map((item) => (
                <article key={item.id} className="sv-wishlist-card">
                  <Link className="sv-wishlist-card-link" to={`/products/${item.productId}`}>
                    <img
                      src={productImageUrls[item.productId] ?? getFallbackImageUrl(item)}
                      alt={item.productName}
                      onError={(event) => {
                        const fallback = getFallbackImageUrl(item)
                        if (event.currentTarget.src !== fallback) {
                          event.currentTarget.src = fallback
                        }
                      }}
                    />
                  </Link>
                  <div className="sv-wishlist-card-body">
                    <div className="sv-wishlist-card-head">
                      <div>
                        <p className="sv-wishlist-card-name">{item.productName}</p>
                        <p className="sv-wishlist-card-meta mono">{item.sku || item.productId}</p>
                      </div>
                      <span className="sv-wishlist-card-date mono">{formatDate(item.createdAtUtc)}</span>
                    </div>
                    <div className="sv-wishlist-card-footer">
                      <span className="sv-wishlist-card-price mono">
                        {formatCurrency(item.unitPrice, item.currency)}
                      </span>
                      <div className="sv-wishlist-card-actions">
                        <Link
                          className="ghost-btn sv-wishlist-action-btn"
                          to={`/products/${item.productId}`}
                        >
                          Visa
                        </Link>
                        <button
                          type="button"
                          className="danger-btn sv-wishlist-action-btn"
                          onClick={() => void removeItem(item)}
                          disabled={activeItemId === item.id}
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default WishlistPage
