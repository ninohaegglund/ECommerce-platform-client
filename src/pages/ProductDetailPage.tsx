import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { addCartItem } from '../services/cartApi'
import { getCatalogProduct, getCatalogProducts } from '../services/catalogApi'
import { getInventoryStock } from '../services/inventoryApi'
import { getProductImages } from '../services/productImagesApi'
import type { Product } from '../data/products'
import type { AuthUser } from '../types/auth'
import type { InventoryStock } from '../types/inventory'
import type { ProductImage } from '../types/product-image'
import { getProductImagePath, getProductProfile } from '../utils/productCard'

type ProductDetailPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
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

function ProductDetailPage({ user, isAdmin, onLogout }: ProductDetailPageProps) {
  const { productId = '' } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [stock, setStock] = useState<InventoryStock | null>(null)
  const [productImageUrl, setProductImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError('')
      setProduct(null)
      setStock(null)
      setProductImageUrl('')

      try {
        let selectedProduct: Product | null = null

        try {
          selectedProduct = await getCatalogProduct(productId)
        } catch {
          const products = await getCatalogProducts()
          selectedProduct = products.find((item) => item.id === productId) ?? null
        }

        if (!selectedProduct) {
          throw new Error('Produkten hittades inte.')
        }

        setProduct(selectedProduct)
        try {
          setStock(await getInventoryStock(selectedProduct.id))
        } catch {
          setStock(null)
        }

        try {
          const images = selectedProduct.images?.length
            ? selectedProduct.images
            : await getProductImages(selectedProduct.id)
          const url = await resolveWorkingImageUrl(getProductImageCandidates(images))
          setProductImageUrl(url)
        } catch {
          setProductImageUrl('')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kunde inte ladda produktdetaljer.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      void loadProduct()
    }
  }, [productId])

  const formattedPrice = useMemo(() => {
    if (!product) {
      return '-'
    }

    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: product.currency,
      maximumFractionDigits: 2,
    }).format(product.price)
  }, [product])

  const fallbackImageUrl = useMemo(() => {
    if (!product) return ''
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }, [product])

  const productDescription =
    product?.description.trim() ||
    product?.shortDescription.trim() ||
    'Ingen beskrivning tillg\u00e4nglig.'

  const availableQuantity = stock?.quantityAvailable ?? product?.stockQuantity ?? 0
  const isOutOfStock = availableQuantity <= 0

  const handleAddToCart = async () => {
    if (!product) {
      return
    }

    setIsAdding(true)
    setError('')
    setSuccess('')

    try {
      if (availableQuantity <= 0) {
        throw new Error('Den h\u00e4r produkten \u00e4r slut i lager.')
      }

      await addCartItem({
        productId: product.id,
        quantity: 1,
        currency: product.currency,
      })
      setSuccess(`${product.name} har lagts i varukorgen.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte l\u00e4gga produkten i varukorgen.'
      setError(message)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="product-detail-page">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Produktdetaljer</p>
            <h1>{product?.name ?? 'Laddar produkt'}</h1>
            <p className="subtitle">{'Lagerstatus f\u00f6r vald produkt.'}</p>
          </div>
          <Link className="ghost-btn" to="/dashboard">
            Tillbaka till produkter
          </Link>
        </div>

        {error && <p className="feedback error">{error}</p>}
        {success && <p className="feedback success">{success}</p>}

        {isLoading ? (
          <p>Laddar produkt...</p>
        ) : product ? (
          <div className="product-detail-grid">
            <article className="hero-panel">
              <div className="product-detail-image">
                <img
                  src={productImageUrl || fallbackImageUrl}
                  alt={product.name}
                  onError={(event) => {
                    if (fallbackImageUrl && event.currentTarget.dataset.fallbackApplied !== 'true') {
                      event.currentTarget.dataset.fallbackApplied = 'true'
                      event.currentTarget.src = fallbackImageUrl
                    }
                  }}
                />
              </div>
              <p className="chip">Katalogprodukt</p>
              <h2>{product.name}</h2>
              <p className="product-detail-description">{productDescription}</p>
              <p className="price">{formattedPrice}</p>
              {isOutOfStock ? (
                <p className="feedback error">
                  {'Slut i lager. Produkten kan inte l\u00e4ggas till just nu.'}
                </p>
              ) : (
                <p className="subtitle">
                  {availableQuantity} {'tillg\u00e4ngliga just nu.'}
                </p>
              )}
              <button
                type="button"
                className="submit-btn"
                onClick={() => void handleAddToCart()}
                disabled={isAdding || isOutOfStock}
              >
                {isOutOfStock ? 'Slut i lager' : isAdding ? 'L\u00e4gger till...' : 'L\u00e4gg i varukorgen'}
              </button>
            </article>

            <aside className="stock-panel">
              <h3>{'Lager\u00f6versikt'}</h3>
              <div className="stock-metrics">
                <div>
                  <span>{'Tillg\u00e4ngliga'}</span>
                  <strong>{availableQuantity}</strong>
                </div>
              </div>
              <p className="subtitle">Produkt-ID: {product.id}</p>
            </aside>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  )
}

export default ProductDetailPage
