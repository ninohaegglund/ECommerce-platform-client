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
          <p className="eyebrow">Retro collector shop</p>
          <h1>Consoles, Pokemon cards, and arcade finds in one clean vault.</h1>
          <p className="hero-lede">
            Curated drops for players, collectors, and anyone who still remembers the
            cartridge click.
          </p>

          <div className="hero-actions">
            <a className="submit-btn hero-primary" href="#drop-grid">
              Shop latest drop
            </a>
            <Link className="ghost-btn hero-secondary" to="/about">
              About the vault
            </Link>
          </div>

          <dl className="hero-stats" aria-label="Store highlights">
            <div>
              <dt>1990s</dt>
              <dd>console era</dd>
            </div>
            <div>
              <dt>TCG</dt>
              <dd>sealed picks</dd>
            </div>
            <div>
              <dt>24h</dt>
              <dd>packing window</dd>
            </div>
          </dl>
        </div>

        <div className="hero-showcase" aria-label="Featured retro drop">
          <img src={heroImage} alt="Layered retro console display" />
          <div className="hero-drop-card">
            <span>Featured drop</span>
            <strong>Hand-tested hardware and display-ready cards</strong>
          </div>
        </div>
      </header>

      <section className="category-strip" aria-label="Collector categories">
        <article id="consoles">
          <span className="category-icon">01</span>
          <div>
            <h2>Retro consoles</h2>
            <p>Game Boy, Nintendo, Sega, PlayStation, and living-room classics.</p>
          </div>
        </article>
        <article id="cards">
          <span className="category-icon">02</span>
          <div>
            <h2>Pokemon cards</h2>
            <p>Sealed boosters, binder hits, and graded-card friendly picks.</p>
          </div>
        </article>
        <article id="preorders">
          <span className="category-icon">03</span>
          <div>
            <h2>Upcoming drops</h2>
            <p>Wishlisted stock, preorder windows, and limited collector bundles.</p>
          </div>
        </article>
      </section>

      <section className="store-toolbar">
        <div>
          <p className="eyebrow">Latest inventory</p>
          <h2>Fresh collector drops</h2>
          <p className="subtitle">Welcome back, {user.firstName}. The vault is open.</p>
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
          <h2>Signed in as {user.email}</h2>
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
