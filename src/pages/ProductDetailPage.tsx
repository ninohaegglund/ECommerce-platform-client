import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import { addCartItem } from '../services/cartApi'
import { getCatalogProducts } from '../services/catalogApi'
import { getInventoryStock } from '../services/inventoryApi'
import type { Product } from '../data/products'
import type { AuthUser } from '../types/auth'
import type { InventoryStock } from '../types/inventory'

type ProductDetailPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function ProductDetailPage({ user, isAdmin, onLogout }: ProductDetailPageProps) {
  const { productId = '' } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [stock, setStock] = useState<InventoryStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError('')

      try {
        const products = await getCatalogProducts()
        const selectedProduct = products.find((item) => item.id === productId) ?? null

        if (!selectedProduct) {
          throw new Error('Product not found.')
        }

        setProduct(selectedProduct)
        setStock(await getInventoryStock(selectedProduct.id))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load product details.'
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

  const isOutOfStock = (stock?.quantityAvailable ?? 0) <= 0

  const handleAddToCart = async () => {
    if (!product) {
      return
    }

    setIsAdding(true)
    setError('')
    setSuccess('')

    try {
      if ((stock?.quantityAvailable ?? 0) <= 0) {
        throw new Error('This product is out of stock.')
      }

      await addCartItem({
        productId: product.id,
        quantity: 1,
        currency: product.currency,
      })
      setSuccess(`${product.name} added to cart.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add item to cart.'
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
            <p className="eyebrow">Product details</p>
            <h1>{product?.name ?? 'Loading product'}</h1>
            <p className="subtitle">Inventory and reservation state for the selected product.</p>
          </div>
          <Link className="ghost-btn" to="/dashboard">
            Back to products
          </Link>
        </div>

        {error && <p className="feedback error">{error}</p>}
        {success && <p className="feedback success">{success}</p>}

        {isLoading ? (
          <p>Loading product...</p>
        ) : product ? (
          <div className="product-detail-grid">
            <article className="hero-panel">
              <p className="chip">Catalog Product</p>
              <h2>{product.name}</h2>
              <p>{product.shortDescription || 'No description available.'}</p>
              <p className="price">{formattedPrice}</p>
              {isOutOfStock ? (
                <p className="feedback error">Out of stock. This product cannot be added right now.</p>
              ) : (
                <p className="subtitle">{stock?.quantityAvailable ?? 0} available right now.</p>
              )}
              <button
                type="button"
                className="submit-btn"
                onClick={() => void handleAddToCart()}
                disabled={isAdding || isOutOfStock}
              >
                {isOutOfStock ? 'Out of stock' : isAdding ? 'Adding...' : 'Add to cart'}
              </button>
            </article>

            <aside className="stock-panel">
              <h3>Stock overview</h3>
              <div className="stock-metrics">
                <div>
                  <span>Available</span>
                  <strong>{stock?.quantityAvailable ?? 0}</strong>
                </div>
                <div>
                  <span>Reserved</span>
                  <strong>{stock?.quantityReserved ?? 0}</strong>
                </div>
              </div>
              <p className="subtitle">Product ID: {product.id}</p>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default ProductDetailPage