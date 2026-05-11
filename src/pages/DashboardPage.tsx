import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import ProductCard from '../components/ProductCard'
import SiteFooter from '../components/SiteFooter'
import type { Product } from '../data/products'
import { addCartItem } from '../services/cartApi'
import { getCatalogProducts } from '../services/catalogApi'
import { getProductImages } from '../services/productImagesApi'
import type { AuthUser } from '../types/auth'
import type { ProductImage } from '../types/product-image'

type DashboardPageProps = {
  user: AuthUser
  isAdmin: boolean
  token: string
  expiresAt: string
  onLogout: () => void
}

const CATEGORY_DATA = [
  {
    id: 'pokemon-kort',
    name: 'Pokémon-kort · Nya',
    desc: 'Senaste booster-seten, ETBs och nyutgivna singles — alltid i lager på lanseringsdagen.',
    color: 'var(--red)',
    count: '874 produkter',
    icon: '★',
    image: '/shop-icons/pokemon-surging-sparks-booster-box.webp',
  },
  {
    id: 'pokemon-kort-gamla',
    name: 'Pokémon-kort · Gamla',
    desc: 'Vintage-kort, Base Set, Jungle och Fossil — äkthetsgranskade och prisvärderade.',
    color: 'var(--amber)',
    count: '374 produkter',
    icon: '★',
    image: '/shop-icons/2020POKEMONSWSHBLACKSTARPROMO_050CHARIZARDVCHMPN.PATHELITETRNR.BOX_PSA10_FRONT.webp',
  },
  {
    id: 'spel',
    name: 'Spel · Nya',
    desc: 'Nya spel till PS5, Xbox, Switch och PC — snabb leverans direkt till dörren.',
    color: 'var(--blue)',
    count: '512 produkter',
    icon: '▶',
    image: '/shop-icons/simisear-214-vstar-universe-raukcard-10.webp',
  },
  {
    id: 'retrogaming',
    name: 'Spel · Retro',
    desc: 'Klassiska titlar till NES, SNES, Mega Drive, PS1 och Game Boy — sorterade och testade.',
    color: 'var(--ink)',
    count: '418 produkter',
    icon: '▶',
    image: '/shop-icons/cynthias-garchump-ex-087-sar-raukcard-10-pokemon-kort.webp',
  },
  {
    id: 'konsoler',
    name: 'Konsoler',
    desc: 'Nya och begagnade konsoler — PS5, Xbox Series, Switch samt retrokonsoler i gott skick.',
    color: 'var(--ink-2)',
    count: '417 produkter',
    icon: '◈',
    image: '/shop-icons/N64-Retro-Gaming-Console.webp',
  },
  {
    id: 'refurbished',
    name: 'Refurbished',
    desc: 'Renoverade konsoler med ny optik, rengjorda kretskort och 90 dagars garanti.',
    color: 'var(--mint)',
    count: '186 produkter',
    icon: '✓',
    image: '/shop-icons/Nintendo64KontrollTredjepartOrange_8cc0d6a1-427d-4f0f-95c7-d0e65a8cd766.webp',
  },
]

const REVIEW_DATA = [
  {
    rating: 5,
    quote:
      'Beställde en Charizard Base Set på onsdag kväll, hade den i brevlådan torsdag lunch. Äkthetskontrollen var noggrann och kortet var i bättre skick än beskrivet.',
    name: 'Erik N.',
    role: 'Pokémon-samlare',
    color: 'var(--red)',
  },
  {
    rating: 5,
    quote:
      'Köpte en refurbished N64 och den ser ut och fungerar som ny. 90 dagars garanti och snabb frakt — kan varmt rekommendera Spelvalvet.',
    name: 'Linnea S.',
    role: 'Retro-entusiast',
    color: 'var(--mint)',
  },
  {
    rating: 5,
    quote:
      'Bästa stället för gamla spel i Sverige. Hittade titlar till SNES som jag letat efter länge — alla testade och i gott skick. Nöjd kund!',
    name: 'Kalle M.',
    role: 'Retrogaming-spelare',
    color: 'var(--blue)',
  },
  {
    rating: 5,
    quote:
      'Beställde sleeves, boosters och ett par graded kort. Allt kom väl packat, snyggt sorterat och med tydlig status på varje produkt.',
    name: 'Maja R.',
    role: 'TCG-spelare',
    color: 'var(--amber)',
  },
  {
    rating: 5,
    quote:
      'Supporten hjälpte mig välja rätt handkontroll till min N64. Den kom fram snabbt och känslan var precis som jag mindes den.',
    name: 'Oskar T.',
    role: 'Konsolnostalgiker',
    color: 'var(--ink-2)',
  },
  {
    rating: 5,
    quote:
      'Jag uppskattar att skicket faktiskt matchar beskrivningen. Inga överraskningar, bara bra produkter och snabb leverans.',
    name: 'Sara L.',
    role: 'Samlarförälder',
    color: 'var(--mint)',
  },
  {
    rating: 5,
    quote:
      'Köpte flera retrospel som present. De var rengjorda, testade och såg mycket bättre ut än bilderna. Kommer handla igen.',
    name: 'Noel A.',
    role: 'Presentjägare',
    color: 'var(--red)',
  },
]

const BESTSELLER_IMAGES = [
  '/shop-icons/pokemon-151-japansk-booster-box.webp',
  '/shop-icons/pokemon-surging-sparks-booster-box.webp',
  '/shop-icons/N64-Retro-Gaming-Console.webp',
  '/shop-icons/Nintendo64KontrollTredjepartOrange_8cc0d6a1-427d-4f0f-95c7-d0e65a8cd766.webp',
]

const BESTSELLER_CATS = [
  { label: 'Pokémon-kort', color: 'var(--red)' },
  { label: 'Refurbished', color: 'var(--mint)' },
  { label: 'Spel', color: 'var(--blue)' },
  { label: 'Konsoler', color: 'var(--ink-2)' },
]

const BESTSELLER_CHANGES = ['+412 sålda', '+298 sålda', '+241 sålda', '+187 sålda']
const REVIEW_AUTOPLAY_MS = 6500

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

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1L3.1 9.5l6.1-.9L12 3Z"/>
    </svg>
  )
}

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
    </svg>
  )
}

function DashboardPage({ user, isAdmin, onLogout }: DashboardPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [productImageUrls, setProductImageUrls] = useState<Record<string, string>>({})
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [addingProductId, setAddingProductId] = useState('')
  const [addedSkus, setAddedSkus] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [cartError, setCartError] = useState('')
  const [activeReviewIndex, setActiveReviewIndex] = useState(0)
  const [isReviewCarouselPaused, setIsReviewCarouselPaused] = useState(false)
  const reviewCount = REVIEW_DATA.length

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

  useEffect(() => {
    if (isReviewCarouselPaused || reviewCount <= 1) return

    const intervalId = window.setInterval(() => {
      setActiveReviewIndex((index) => (index + 1) % reviewCount)
    }, REVIEW_AUTOPLAY_MS)

    return () => window.clearInterval(intervalId)
  }, [isReviewCarouselPaused, reviewCount])

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

  const newInStock = useMemo(() => products.slice(0, 8), [products])
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => b.price - a.price).slice(0, 4),
    [products],
  )
  const goToPreviousReview = () => {
    setActiveReviewIndex((index) => (index - 1 + reviewCount) % reviewCount)
  }
  const goToNextReview = () => {
    setActiveReviewIndex((index) => (index + 1) % reviewCount)
  }

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      {/* ---- Hero ---- */}
      <section className="sv-hero" aria-label="Välkommen till Spelvalvet">
        <div className="sv-hero-inner">
          <div>
            <div className="sv-hero-new-chip">
              <span className="sv-hero-new-badge">NYTT</span>
              <span className="sv-hero-chip-text">Refurbished N64 — nu i lager med 90 dagars garanti</span>
              <ArrowRight size={13} />
            </div>

            <h1 className="sv-hero-h1">
              Köp{' '}
              <span className="sv-hero-accent-red">Pokémon-kort</span>,<br />
              spel, konsoler och{' '}
              <span className="sv-hero-accent-blue">refurbished</span>.
            </h1>

            <p className="sv-hero-body">
              Nya och gamla Pokémon-kort, retrogaming, konsoler och renoverade
              klassiker — allt på ett ställe med snabb leverans och 14 dagars prislöfte.
            </p>

            <div className="sv-hero-ctas">
              <a className="sv-btn-primary" href="#new-in-stock">
                Se alla produkter
                <ArrowRight size={16} />
              </a>
              <a className="sv-btn-ghost" href="#refurbished">
                Utforska Refurbished
              </a>
            </div>

            <div className="sv-hero-stats">
              <div>
                <div className="sv-stat-value">20K+</div>
                <div className="sv-stat-label">Nöjda samlare</div>
              </div>
              <div>
                <div className="sv-stat-value">
                  4.9
                  <StarIcon />
                </div>
                <div className="sv-stat-label">Trustpilot</div>
              </div>
              <div>
                <div className="sv-stat-value">48h</div>
                <div className="sv-stat-label">Snabbleverans</div>
              </div>
              <div>
                <div className="sv-stat-value">100%</div>
                <div className="sv-stat-label">Äkthetsgaranti</div>
              </div>
            </div>
          </div>

          {/* Hero showcase */}
          <div className="sv-hero-showcase" aria-hidden="true">
            <div className="sv-hero-backdrop" />

            {/* Charizard card */}
            <div className="sv-showcase-card sv-showcase-card-1" style={{ transform: 'rotate(-6deg)' }}>
              <div className="sv-card-img sv-card-img-ph-amber" style={{ height: 240 }}>
                <img
                  src="/shop-icons/2020POKEMONSWSHBLACKSTARPROMO_050CHARIZARDVCHMPN.PATHELITETRNR.BOX_PSA10_FRONT.webp"
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div className="sv-card-meta">
                <p className="sv-card-sku mono">POKÉMON · #BS-004</p>
                <p className="sv-card-name">Charizard</p>
                <p className="sv-card-sub">Base Set · Holo · PSA 10</p>
                <div className="sv-card-footer">
                  <span className="sv-card-price mono">1 249 kr</span>
                  <span className="sv-card-stock">I lager</span>
                </div>
              </div>
            </div>

            {/* GameBoy card */}
            <div className="sv-showcase-card sv-showcase-card-2" style={{ transform: 'rotate(4deg)' }}>
              <div className="sv-card-img sv-card-img-ph-blue" style={{ height: 130 }}>
                <img
                  src="/shop-icons/N64-Retro-Gaming-Console.webp"
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div style={{ padding: '10px 6px 4px' }}>
                <p className="sv-card-sku mono" style={{ marginBottom: 4 }}>REFURBISHED · #N64-R-07</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Nintendo 64 · Refurbished</span>
                  <span className="sv-card-price mono" style={{ fontSize: 14 }}>1 295 kr</span>
                </div>
              </div>
            </div>

            {/* Booster pack card */}
            <div className="sv-showcase-card sv-showcase-card-3" style={{ transform: 'rotate(-3deg)' }}>
              <div className="sv-card-img sv-card-img-ph-mint" style={{ height: 175, display: 'grid', placeItems: 'center' }}>
                <img
                  src="/shop-icons/simisear-214-vstar-universe-raukcard-10.webp"
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div style={{ padding: '8px 4px 0' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>The Legend of Zelda · SNES</p>
                <p className="sv-card-price mono" style={{ fontSize: 13, margin: '2px 0 0' }}>395 kr</p>
              </div>
            </div>

            {/* Floating chip: authenticity */}
            <div className="sv-showcase-chip sv-chip-auth">
              <div className="sv-chip-auth-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span className="sv-chip-auth-text">Äkthet garanterad</span>
            </div>

            {/* Floating chip: deal */}
            <div className="sv-showcase-chip sv-chip-deal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="8" cy="9" r="1.2" fill="var(--amber)"/>
              </svg>
              <div>
                <span className="sv-chip-deal-label">DAGENS FYND</span>
                <span className="sv-chip-deal-value">−25% på sleeves</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Category Grid ---- */}
      <section id="categories" aria-labelledby="cat-title">
        <div className="sv-category-section">
          <div className="sv-section-head">
            <div>
              <p className="sv-section-kicker">01 — KATEGORIER</p>
              <h2 id="cat-title" className="sv-section-title">Hitta din samling.</h2>
              <p className="sv-section-subtitle">
                Pokémon-kort, spel, konsoler och refurbished — vi kontrollerar skick och äkthet
                på varje produkt så att du slipper gissa.
              </p>
            </div>
            <a className="sv-section-link" href="#new-in-stock">
              Se alla kategorier
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7"/><path d="M8 7h9v9"/>
              </svg>
            </a>
          </div>

          <div className="sv-category-grid">
            {CATEGORY_DATA.map((cat, i) => (
              <a
                key={cat.id}
                id={cat.id}
                href={`#${cat.id}`}
                className="sv-cat-card"
              >
                <div className="sv-cat-image" style={{ borderBottomColor: cat.color }}>
                  <img src={cat.image} alt={cat.name} />
                  <div
                    className="sv-cat-badge"
                    style={{ color: cat.color, borderColor: cat.color }}
                  >
                    {cat.icon} {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="sv-cat-icon-bg" style={{ color: cat.color }} aria-hidden="true">
                    {cat.icon}
                  </div>
                </div>
                <div className="sv-cat-content">
                  <div className="sv-cat-title-row">
                    <h3 className="sv-cat-title">{cat.name}</h3>
                    <span className="sv-cat-count">{cat.count}</span>
                  </div>
                  <p className="sv-cat-desc">{cat.desc}</p>
                  <div className="sv-cat-link" style={{ color: cat.color }}>
                    Bläddra <ArrowRight size={13} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Product Grid ---- */}
      <section id="new-in-stock" aria-labelledby="products-title">
        <div className="sv-product-section">
          <div className="sv-section-head">
            <div>
              <p className="sv-section-kicker">02 — POPULÄRT JUST NU</p>
              <h2 id="products-title" className="sv-section-title">Färska släpp & samlarguld.</h2>
              <p className="sv-section-subtitle">
                Nya och begagnade produkter från hela sortimentet. Allt skickas inom 24 timmar.
              </p>
            </div>
            <Link className="sv-section-link" to="/produkter">
              Se hela sortimentet
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7"/><path d="M8 7h9v9"/>
              </svg>
            </Link>
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
            ) : (
              newInStock.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdding={addingProductId === product.id}
                  added={addedSkus.has(product.id)}
                  onAddToCart={handleAddToCart}
                  imageUrl={productImageUrls[product.id]}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ---- Best Sellers Strip ---- */}
      <section id="best-sellers" className="sv-bestsellers-section" aria-labelledby="bs-title">
        <div className="sv-bestsellers-inner">
          <div className="sv-section-head">
            <div>
              <p className="sv-section-kicker">03 — TOPPLISTAN · DENNA VECKA</p>
              <h2 id="bs-title" className="sv-section-title">Mest köpt just nu.</h2>
              <p className="sv-section-subtitle">
                Uppdaterad varje måndag kl 09:00. Ranking baserad på antal sålda enheter senaste 7 dagarna.
              </p>
            </div>
            <a className="sv-section-link" href="#reviews">
              Se hela topplistan
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7"/><path d="M8 7h9v9"/>
              </svg>
            </a>
          </div>

          <div className="sv-bestsellers-grid">
            {(isLoadingProducts ? [] : bestSellers).map((product, i) => {
              const cat = BESTSELLER_CATS[i % BESTSELLER_CATS.length]
              return (
                <article key={`bs-${product.id}`} className="sv-bs-card">
                  <div className="sv-bs-top-row">
                    <div className="sv-bs-rank" style={{ background: cat.color }}>
                      <span className="sv-bs-rank-hash">#</span>
                      <span className="sv-bs-rank-num">{i + 1}</span>
                    </div>
                    <span className="sv-bs-change">↑ {BESTSELLER_CHANGES[i]}</span>
                  </div>
                  <div className="sv-bs-image">
                    <img
                      src={BESTSELLER_IMAGES[i % BESTSELLER_IMAGES.length]}
                      alt={product.name}
                    />
                  </div>
                  <div>
                    <div className="sv-bs-cat-label" style={{ color: cat.color }}>{cat.label}</div>
                    <div className="sv-bs-name">{product.name}</div>
                  </div>
                  <div className="sv-bs-footer">
                    <span className="sv-bs-price mono">
                      {new Intl.NumberFormat('sv-SE', {
                        style: 'currency',
                        currency: product.currency,
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </span>
                    <a className="sv-bs-link" href={`/products/${product.id}`}>
                      Visa <ArrowRight size={12} />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---- Reviews ---- */}
      <section id="reviews" aria-labelledby="reviews-title">
        <div className="sv-reviews-section">
          <div className="sv-section-head">
            <div>
              <p className="sv-section-kicker">04 — RECENSIONER · TRUSTPILOT 4.9</p>
              <h2 id="reviews-title" className="sv-section-title">20 000+ samlare. En butik.</h2>
              <p className="sv-section-subtitle">
                Vi läser varje recension och svarar inom 24 timmar. Tack för att ni hjälper oss bli bättre.
              </p>
            </div>
          </div>

          <div
            className={`sv-reviews-carousel${isReviewCarouselPaused ? ' sv-reviews-carousel--paused' : ''}`}
            aria-label="Kundrecensioner"
            aria-roledescription="carousel"
            onBlur={() => setIsReviewCarouselPaused(false)}
            onFocus={() => setIsReviewCarouselPaused(true)}
            onMouseEnter={() => setIsReviewCarouselPaused(true)}
            onMouseLeave={() => setIsReviewCarouselPaused(false)}
          >
            <button
              type="button"
              className="sv-review-nav-btn sv-review-nav-btn--prev"
              onClick={goToPreviousReview}
              aria-label="Visa föregående recension"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" /><path d="m11 6-6 6 6 6" />
              </svg>
            </button>

            <div className="sv-reviews-viewport">
              <div
                className="sv-reviews-track"
                style={{ transform: `translateX(-${activeReviewIndex * 100}%)` }}
              >
                {REVIEW_DATA.map((review, i) => (
                  <blockquote
                    key={review.name}
                    className={`sv-review-card${activeReviewIndex === i ? ' sv-review-card--active' : ''}`}
                    aria-label={`Recension ${i + 1} av ${reviewCount}`}
                    aria-roledescription="slide"
                  >
                    <div className="sv-review-badge" style={{ background: review.color }}>
                      VERIFIERAD KÖPARE
                    </div>
                    <div className="sv-review-stars">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <StarIcon key={j} />
                      ))}
                      <span className="sv-review-stars-count mono">{review.rating}.0 / 5.0</span>
                    </div>
                    <p className="sv-review-quote">"{review.quote}"</p>
                    <footer className="sv-review-footer">
                      <div className="sv-review-avatar" style={{ background: review.color }}>
                        {review.name[0]}
                      </div>
                      <div>
                        <div className="sv-review-name">{review.name}</div>
                        <div className="sv-review-role">{review.role}</div>
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="sv-review-nav-btn sv-review-nav-btn--next"
              onClick={goToNextReview}
              aria-label="Visa nästa recension"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
              </svg>
            </button>

            <div className="sv-review-dots" role="tablist" aria-label="Välj recension">
              {REVIEW_DATA.map((review, i) => (
                <button
                  key={review.name}
                  type="button"
                  className={`sv-review-dot${activeReviewIndex === i ? ' sv-review-dot--active' : ''}`}
                  onClick={() => setActiveReviewIndex(i)}
                  aria-current={activeReviewIndex === i ? 'true' : undefined}
                  aria-label={`Visa recension ${i + 1} av ${reviewCount}`}
                >
                  <span className="sv-review-dot-label mono">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="sv-review-dot-name">{review.name}</span>
                </button>
              ))}
            </div>
            <div className="sv-review-progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${(activeReviewIndex + 1) / reviewCount})` }} />
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />

      {/* Toast */}
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

export default DashboardPage
