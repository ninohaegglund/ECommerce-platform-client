import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import AppNavbar from '../components/AppNavbar'
import ProductCard from '../components/ProductCard'
import SiteFooter from '../components/SiteFooter'
import type { Product } from '../data/products'
import { addCartItem } from '../services/cartApi'
import { getCatalogProducts } from '../services/catalogApi'
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
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [addingProductId, setAddingProductId] = useState('')
  const [cartFeedback, setCartFeedback] = useState('')
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true)
      setProductsError('')

      try {
        const data = await getCatalogProducts()
        setProducts(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load products.'
        setProductsError(message)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    void loadProducts()
  }, [])

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id)
    setCartFeedback('')
    setCartError('')

    try {
      await addCartItem({
        productId: product.id,
        quantity: 1,
        currency: product.currency,
      })
      setCartFeedback(`${product.name} added to your bag.`)
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

      <header className="store-hero">
        <div className="hero-copy">
          <div className="hero-kicker-row">
            <span>Spring collector drop</span>
            <span>Stock synced from catalog</span>
          </div>
          <h1>Rare games, clean cards, and console nostalgia without the messy hunt.</h1>
          <p className="hero-lede">
            Browse tested retro consoles, Pokemon card picks, and collector bundles
            inside a focused storefront built for fast shopping.
          </p>

          <div className="hero-actions">
            <a className="submit-btn hero-primary" href="#drop-grid">
              Shop the drop
            </a>
            <Link className="ghost-btn hero-secondary" to="/wishlist">
              View wishlist
            </Link>
          </div>

          <dl className="hero-stats" aria-label="Store highlights">
            <div>
              <dt>48h</dt>
              <dd>drop refresh</dd>
            </div>
            <div>
              <dt>TCG</dt>
              <dd>card-ready packing</dd>
            </div>
            <div>
              <dt>CRT</dt>
              <dd>retro tested feel</dd>
            </div>
          </dl>
        </div>

        <div className="hero-showcase" aria-label="Featured collector display">
          <div className="hero-visual-board">
            <img src={heroImage} alt="Layered retro console display" />
            <div className="hero-card-stack" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="hero-drop-card">
            <span>Vault pick</span>
            <strong>Console condition checked before the listing goes live.</strong>
          </div>

          <div className="hero-schedule-card">
            <span>Next drop</span>
            <strong>Friday 18:00</strong>
          </div>
        </div>
      </header>

      <section className="category-strip" aria-label="Collector categories">
        <article id="consoles">
          <span className="category-icon">01</span>
          <div>
            <h2>Retro consoles</h2>
            <p>Handhelds, living-room systems, cables, controllers, and display pieces.</p>
          </div>
        </article>
        <article id="cards">
          <span className="category-icon">02</span>
          <div>
            <h2>Pokemon cards</h2>
            <p>Singles, sealed finds, and collector-safe shipping for binder upgrades.</p>
          </div>
        </article>
        <article id="preorders">
          <span className="category-icon">03</span>
          <div>
            <h2>Preorders</h2>
            <p>Reserve upcoming stock before the next collector wave lands.</p>
          </div>
        </article>
        <article id="trade-ins">
          <span className="category-icon">04</span>
          <div>
            <h2>Trade-ins</h2>
            <p>Send in duplicate cards or old hardware and build your next haul.</p>
          </div>
        </article>
      </section>

      <section className="store-toolbar">
        <div>
          <p className="eyebrow">Latest inventory</p>
          <h2>Fresh from the vault</h2>
          <p className="subtitle">Welcome back, {user.firstName}. Your next find is ready.</p>
        </div>

        <div className="drop-badges" aria-label="Drop categories">
          <span>Cards</span>
          <span>Hardware</span>
          <span>Bundles</span>
        </div>

        {(productsError || cartError || cartFeedback) && (
          <div className="toolbar-feedback" aria-live="polite">
            {productsError && <p className="feedback error">{productsError}</p>}
            {cartError && <p className="feedback error">{cartError}</p>}
            {cartFeedback && <p className="feedback success">{cartFeedback}</p>}
          </div>
        )}
      </section>

      <section id="drop-grid" className="products-grid" aria-label="Product drops">
        {isLoadingProducts ? (
          <p className="loading-copy">Loading collector drops...</p>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdding={addingProductId === product.id}
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </section>

      <section className="session-panel">
        <div>
          <p className="eyebrow">Account session</p>
          <h2>{user.email}</h2>
          <p className="subtitle">Session expiry: {expiresAt || 'Unknown'}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setShowToken((v) => !v)}>
          {showToken ? 'Hide token' : 'Show token'}
        </button>
        {showToken && <textarea readOnly value={token} rows={5} aria-label="JWT token" />}
      </section>

      <SiteFooter />
    </main>
  )
}

export default DashboardPage
