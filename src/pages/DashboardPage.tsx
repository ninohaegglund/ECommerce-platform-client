import { useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import { demoProducts } from '../data/products'
import type { Product } from '../data/products'
import ProductCard from '../components/ProductCard'
import { addCartItem } from '../services/cartApi'
import type { AuthUser } from '../types/auth'

type DashboardPageProps = {
  user: AuthUser
  isAdmin: boolean
  token: string
  expiresAt: string
  onLogout: () => void
}

function DashboardPage({ user, isAdmin, token, expiresAt, onLogout }: DashboardPageProps) {
  const [showToken, setShowToken] = useState(false)
  const [addingProductId, setAddingProductId] = useState('')
  const [cartFeedback, setCartFeedback] = useState('')
  const [cartError, setCartError] = useState('')

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.productId)
    setCartFeedback('')
    setCartError('')

    try {
      await addCartItem({
        productId: product.productId,
        productName: product.productName,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.unitPrice,
        currency: product.currency,
      })
      setCartFeedback(`${product.productName} added to cart.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add item to cart.'
      setCartError(message)
    } finally {
      setAddingProductId('')
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <header className="store-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>NovaCart</h1>
          <p className="subtitle">Welcome, {user.firstName}. Start shopping now.</p>
        </div>
      </header>

      <section className="hero-panel">
        <h2>Simple Ecommerce Front Page</h2>
        <p>
          This is your post-login landing page. Later you can replace this with product
          search, cart, and checkout.
        </p>
        {cartError && <p className="feedback error">{cartError}</p>}
        {cartFeedback && <p className="feedback success">{cartFeedback}</p>}
      </section>

      <section className="products-grid">
        {demoProducts.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            isAdding={addingProductId === product.productId}
            onAddToCart={handleAddToCart}
          />
        ))}
      </section>

      <section className="token-panel">
        <p>
          <strong>Signed in as:</strong> {user.email}
        </p>
        <p>
          <strong>Expires at:</strong> {expiresAt || 'Unknown'}
        </p>
        <button type="button" className="ghost-btn" onClick={() => setShowToken((v) => !v)}>
          {showToken ? 'Hide token' : 'Show token'}
        </button>
        {showToken && <textarea readOnly value={token} rows={5} aria-label="JWT token" />}
        <p className="note">JWT is also saved in localStorage under authToken.</p>
      </section>
    </main>
  )
}

export default DashboardPage
