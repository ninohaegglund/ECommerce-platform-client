import { useEffect, useMemo, useState } from 'react'
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

const CATEGORY_SECTIONS = [
  {
    id: 'pokemon',
    title: 'Pokemon',
    description: 'Booster packs, ETB, singles and collector boxes.',
  },
  {
    id: 'magic',
    title: 'Magic: The Gathering',
    description: 'Play boosters, commander decks and bundle boxes.',
  },
  {
    id: 'one-piece',
    title: 'One Piece',
    description: 'Latest OP sets, decks and display products.',
  },
  {
    id: 'yu-gi-oh',
    title: 'Yu-Gi-Oh!',
    description: 'Boosters, starter decks and collector tins.',
  },
  {
    id: 'lorcana',
    title: 'Disney Lorcana',
    description: "Booster boxes, troves and starter decks.",
  },
  {
    id: 'accessories',
    title: 'Accessories',
    description: 'Sleeves, binders, top loaders and storage.',
  },
]

const REVIEW_CARDS = [
  {
    name: 'Elias N.',
    rating: '5/5',
    text: 'Fast delivery and really solid packaging for graded cards.',
  },
  {
    name: 'Sara L.',
    rating: '5/5',
    text: 'Best place for preorder drops. Clear communication and fair prices.',
  },
  {
    name: 'Mikael P.',
    rating: '4.9/5',
    text: 'Clean checkout and always good stock on sleeves and binders.',
  },
]

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
      setCartFeedback(`${product.name} added to your cart.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add item to cart.'
      setCartError(message)
    } finally {
      setAddingProductId('')
    }
  }

  const newInStock = useMemo(() => products.slice(0, 8), [products])
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => b.price - a.price).slice(0, 4),
    [products],
  )

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <header className="store-hero">
        <div className="hero-copy">
          <p className="eyebrow">Bestsellers and collector favorites</p>
          <h1>Everything in trading cards, accessories and retro console finds.</h1>
          <p className="hero-lede">
            Welcome {user.firstName}. Shop category by category and discover what's new in stock
            right now.
          </p>
          <div className="hero-actions">
            <a className="submit-btn hero-primary" href="#new-in-stock">
              New in stock
            </a>
            <a className="ghost-btn hero-secondary" href="#best-sellers">
              Best sellers
            </a>
          </div>
          <div className="hero-tabs" aria-label="Hero highlights">
            <span>BEST SELLERS</span>
            <span>ALL TRADING CARDS</span>
            <span>PROTECT YOUR COLLECTION</span>
          </div>
        </div>

        <div className="hero-showcase" aria-label="Featured showcase">
          <img src={heroImage} alt="Trading card and console showcase" />
          <div className="hero-card-callout">
            <strong>Collector drop this week</strong>
            <p>Pokemon, Magic and One Piece restocks are live.</p>
          </div>
        </div>
      </header>

      <section id="categories" className="category-overview">
        <div className="section-head">
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2>Main categories</h2>
          </div>
          <a className="ghost-btn" href="#new-in-stock">
            Show all
          </a>
        </div>
        <div className="category-grid">
          {CATEGORY_SECTIONS.map((category) => (
            <article key={category.id} id={category.id} className="category-card">
              <p className="chip">{category.title}</p>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="new-in-stock" className="product-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">New in stock</p>
            <h2>Latest products</h2>
          </div>
          <a className="ghost-btn" href="#best-sellers">
            Jump to best sellers
          </a>
        </div>

        {(productsError || cartError || cartFeedback) && (
          <div className="toolbar-feedback" aria-live="polite">
            {productsError && <p className="feedback error">{productsError}</p>}
            {cartError && <p className="feedback error">{cartError}</p>}
            {cartFeedback && <p className="feedback success">{cartFeedback}</p>}
          </div>
        )}

        <div className="products-grid">
          {isLoadingProducts ? (
            <p className="loading-copy">Loading products...</p>
          ) : (
            newInStock.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdding={addingProductId === product.id}
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </section>

      <section id="best-sellers" className="best-seller-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Best sellers</p>
            <h2>Most popular right now</h2>
          </div>
        </div>
        <div className="best-seller-grid">
          {(isLoadingProducts ? [] : bestSellers).map((product, index) => (
            <article key={`best-${product.id}`} className="best-seller-card">
              <span className="best-seller-rank">#{index + 1}</span>
              <h3>{product.name}</h3>
              <p>{product.shortDescription || 'Collector favorite product.'}</p>
              <p className="price">
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: product.currency,
                  maximumFractionDigits: 2,
                }).format(product.price)}
              </p>
              <button
                type="button"
                className="buy-btn"
                onClick={() => void handleAddToCart(product)}
                disabled={addingProductId === product.id}
              >
                {addingProductId === product.id ? 'Adding...' : 'Add to cart'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="reviews" className="review-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>What our customers say</h2>
          </div>
        </div>
        <div className="review-grid">
          {REVIEW_CARDS.map((review) => (
            <article key={review.name} className="review-card">
              <p className="review-rating">{review.rating}</p>
              <p>{review.text}</p>
              <strong>{review.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="brands" className="story-section">
        <p className="eyebrow">Your passion, our range</p>
        <h2>Your online trading card store</h2>
        <p>
          We focus on authentic products, fair pricing and fast delivery. Whether you are
          building your first deck or protecting a premium collection, NovaCart TCG is built
          to make shopping simple and safe.
        </p>
        <div className="story-links">
          <a id="deals" href="#new-in-stock">
            View deals
          </a>
          <Link id="preorders" to="/wishlist">
            Manage preorders
          </Link>
        </div>
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
