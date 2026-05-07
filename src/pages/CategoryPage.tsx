import { useEffect, useMemo, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import ProductCard, { getProductImagePath, getProductProfile } from '../components/ProductCard'
import SiteFooter from '../components/SiteFooter'
import type { Product } from '../data/products'
import { addCartItem } from '../services/cartApi'
import { getCatalogProducts } from '../services/catalogApi'
import { getProductImages } from '../services/productImagesApi'
import type { AuthUser } from '../types/auth'
import type { ProductImage } from '../types/product-image'

type CategoryKey = 'pokemon-kort' | 'spel' | 'konsoler' | 'refurbished'

type CategoryPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
  category: CategoryKey
}

const CAT_META: Record<CategoryKey, { title: string; kicker: string; color: string; desc: string }> = {
  'pokemon-kort': {
    title: 'Pokémon-kort',
    kicker: 'POKÉMON-KORT',
    color: 'var(--red)',
    desc: 'Booster-set, ETBs, singles och vintage-kort — nya och gamla, alltid äkthetsgranskade.',
  },
  'spel': {
    title: 'Spel',
    kicker: 'SPEL',
    color: 'var(--blue)',
    desc: 'Nya spel och retrotitlar till NES, SNES, Mega Drive, PS1, Game Boy och mer — testade och i gott skick.',
  },
  'konsoler': {
    title: 'Konsoler',
    kicker: 'KONSOLER',
    color: 'var(--ink-2)',
    desc: 'Nya och begagnade konsoler — PS5, Xbox Series, Switch samt retrokonsoler i kontrollerat skick.',
  },
  'refurbished': {
    title: 'Refurbished',
    kicker: 'REFURBISHED',
    color: 'var(--mint)',
    desc: 'Renoverade konsoler med ny optik, rengjorda kretskort och 90 dagars garanti.',
  },
}

function matchesCategory(product: Product, category: CategoryKey): boolean {
  const profile = getProductProfile(product)
  switch (category) {
    case 'pokemon-kort': return profile.label === 'Pokémon-kort'
    case 'spel':         return profile.label === 'Spel'
    case 'konsoler':     return profile.tone === 'console' && !profile.refurbished
    case 'refurbished':  return profile.refurbished
  }
}

function getProductImageCandidates(images: ProductImage[]) {
  return images
    .filter((img) => img.imageUrl.trim().length > 0)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
      return a.sortOrder - b.sortOrder
    })
    .map((img) => img.imageUrl.trim())
}

async function resolveWorkingImageUrl(candidates: string[]) {
  for (const candidate of candidates) {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = candidate
    })
    if (ok) return candidate
  }
  return ''
}

function CategoryPage({ user, isAdmin, onLogout, category }: CategoryPageProps) {
  const meta = CAT_META[category]

  const [products, setProducts] = useState<Product[]>([])
  const [productImageUrls, setProductImageUrls] = useState<Record<string, string>>({})
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [addingProductId, setAddingProductId] = useState('')
  const [addedSkus, setAddedSkus] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true)
      setProductsError('')
      try {
        const data = await getCatalogProducts()
        setProducts(data)
      } catch (err) {
        setProductsError(err instanceof Error ? err.message : 'Kunde inte ladda produkter.')
      } finally {
        setIsLoadingProducts(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (products.length === 0) { setProductImageUrls({}); return }
    let cancelled = false

    const loadImages = async () => {
      const entries = await Promise.all(
        products.map(async (product) => {
          try {
            const images = await getProductImages(product.id)
            const url = await resolveWorkingImageUrl(getProductImageCandidates(images))
            return url ? [product.id, url] : null
          } catch { return null }
        }),
      )
      if (cancelled) return
      setProductImageUrls(
        Object.fromEntries(entries.filter((e): e is [string, string] => e !== null)),
      )
    }

    void loadImages()
    return () => { cancelled = true }
  }, [products])

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesCategory(p, category)),
    [products, category],
  )

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id)
    setCartError('')
    try {
      await addCartItem({ productId: product.id, quantity: 1, currency: product.currency })
      setAddedSkus((prev) => new Set(prev).add(product.id))
      setTimeout(() => {
        setAddedSkus((prev) => { const next = new Set(prev); next.delete(product.id); return next })
      }, 1000)
      setToast(`${product.name} tillagd`)
      setTimeout(() => setToast(null), 1800)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Kunde inte lägga till i varukorgen.')
    } finally {
      setAddingProductId('')
    }
  }

  const fallbackImageUrl = (product: Product) => {
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section aria-labelledby="cat-page-title">
        <div className="sv-product-section">
          <div className="sv-section-head">
            <div>
              <p className="sv-section-kicker" style={{ color: meta.color }}>
                {meta.kicker}
              </p>
              <h2 id="cat-page-title" className="sv-section-title">{meta.title}</h2>
              <p className="sv-section-subtitle">{meta.desc}</p>
            </div>
          </div>

          {(productsError || cartError) && (
            <div className="sv-feedback-bar" aria-live="polite">
              {productsError && <p className="feedback error">{productsError}</p>}
              {cartError && <p className="feedback error">{cartError}</p>}
            </div>
          )}

          <div className="sv-product-grid">
            {isLoadingProducts ? (
              <p style={{ color: 'var(--ink-3)', gridColumn: '1/-1' }}>Laddar produkter…</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ color: 'var(--ink-3)', gridColumn: '1/-1' }}>
                Inga produkter hittades i denna kategori.
              </p>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdding={addingProductId === product.id}
                  added={addedSkus.has(product.id)}
                  onAddToCart={handleAddToCart}
                  imageUrl={productImageUrls[product.id] ?? fallbackImageUrl(product)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <SiteFooter />

      {toast && (
        <div className="sv-toast" role="status" aria-live="polite">
          <div className="sv-toast-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          {toast}
        </div>
      )}
    </main>
  )
}

export default CategoryPage
