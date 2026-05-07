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
    id: 'pokemon',
    name: 'Pokémon TCG',
    desc: 'Booster boxes, ETBs och singles från Base Set till Surging Sparks.',
    color: 'var(--red)',
    count: '1 248 produkter',
    icon: '★',
    image: '/shop-icons/pokemon-surging-sparks-booster-box.webp',
  },
  {
    id: 'magic',
    name: 'Magic: The Gathering',
    desc: 'Commander, draft och vintage. Allt från Alpha till senaste setet.',
    color: 'var(--blue)',
    count: '892 produkter',
    icon: '✦',
    image: '/shop-icons/simisear-214-vstar-universe-raukcard-10.webp',
  },
  {
    id: 'one-piece',
    name: 'One Piece TCG',
    desc: 'Den nya storheten. OP01 till OP09 plus förbokningar och promos.',
    color: 'var(--amber)',
    count: '417 produkter',
    icon: '✪',
    image: '/shop-icons/642461276_99944b76-c506-4fa4-93ee-a00502756c0a.jpg',
  },
  {
    id: 'yu-gi-oh',
    name: 'Yu-Gi-Oh!',
    desc: 'Strukturpaket, klassiker och meta-kort till turneringsspelaren.',
    color: 'var(--ink)',
    count: '634 produkter',
    icon: '✧',
    image: '/shop-icons/cynthias-garchump-ex-087-sar-raukcard-10-pokemon-kort.webp',
  },
  {
    id: 'lorcana',
    name: 'Lorcana',
    desc: 'Disneys magiska kortspel — från First Chapter till Azurite Sea.',
    color: 'var(--mint)',
    count: '289 produkter',
    icon: '❀',
    image: '/shop-icons/pokemon-151-japansk-booster-box.webp',
  },
  {
    id: 'consoles',
    name: 'Retro-konsoler',
    desc: 'NES, SNES, GameBoy, Mega Drive och PS1 — testade och garanterade.',
    color: 'var(--ink-2)',
    count: '186 produkter',
    icon: '▸',
    image: '/shop-icons/N64-Retro-Gaming-Console.webp',
  },
]

const REVIEW_DATA = [
  {
    rating: 5,
    quote:
      'Beställde en Charizard på onsdag kväll, hade den i brevlådan torsdag lunch. Skicket var bättre än beskrivet — Spelvalvet är min nya husbutik.',
    name: 'Erik N.',
    role: 'Pokémon-samlare',
    color: 'var(--red)',
  },
  {
    rating: 5,
    quote:
      'Hittade en originalförpackad SNES här som jag letat efter i åratal. Bra kommunikation, snygg paketering och prisvärd leverans.',
    name: 'Linnea S.',
    role: 'Retro-entusiast',
    color: 'var(--blue)',
  },
  {
    rating: 5,
    quote:
      'Bästa One Piece-utbudet i Sverige. Förbokningar levereras alltid på release-dagen och kundservicen är otroligt trevlig.',
    name: 'Kalle M.',
    role: 'OP TCG-spelare',
    color: 'var(--amber)',
  },
]

const BESTSELLER_IMAGES = [
  '/shop-icons/pokemon-151-japansk-booster-box.webp',
  '/shop-icons/pokemon-surging-sparks-booster-box.webp',
  '/shop-icons/N64-Retro-Gaming-Console.webp',
  '/shop-icons/Nintendo64KontrollTredjepartOrange_8cc0d6a1-427d-4f0f-95c7-d0e65a8cd766.webp',
]

const BESTSELLER_CATS = [
  { label: 'Pokémon', color: 'var(--red)' },
  { label: 'Lorcana', color: 'var(--mint)' },
  { label: 'Magic', color: 'var(--blue)' },
  { label: 'Tillbehör', color: 'var(--amber)' },
]

const BESTSELLER_CHANGES = ['+412 sålda', '+298 sålda', '+241 sålda', '+187 sålda']

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

function DashboardPage({ user, isAdmin, token: _token, expiresAt: _expiresAt, onLogout }: DashboardPageProps) {
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

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id)
    setCartError('')
    try {
      await addCartItem({ productId: product.id, quantity: 1, currency: product.currency })
      setAddedSkus((prev) => new Set(prev).add(product.id))
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

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      {/* ---- Hero ---- */}
      <section className="sv-hero" aria-label="Välkommen till Spelvalvet">
        <div className="sv-hero-inner">
          <div>
            <div className="sv-hero-new-chip">
              <span className="sv-hero-new-badge">NYTT</span>
              <span className="sv-hero-chip-text">Pokémon TCG: Prismatic Evolutions ute nu</span>
              <ArrowRight size={13} />
            </div>

            <h1 className="sv-hero-h1">
              Allt inom{' '}
              <span className="sv-hero-accent-red">samlarkort</span>,<br />
              tillbehör och{' '}
              <span className="sv-hero-accent-blue">retro-fynd</span>.
            </h1>

            <p className="sv-hero-body">
              Från första boostern till sällsynta GameBoy-kassetter — Sveriges trevligaste
              samlarbutik med snabb leverans, garanterad äkthet och prislöfte i 14 dagar.
            </p>

            <div className="sv-hero-ctas">
              <a className="sv-btn-primary" href="#new-in-stock">
                Handla nya släpp
                <ArrowRight size={16} />
              </a>
              <a className="sv-btn-ghost" href="#best-sellers">
                Utforska retro-konsoler
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
                <p className="sv-card-sku mono">POKÉMON · #PSV-038</p>
                <p className="sv-card-name">Charizard ex</p>
                <p className="sv-card-sub">Prismatic Evolutions · Holo</p>
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
                <p className="sv-card-sku mono" style={{ marginBottom: 4 }}>RETRO · #GB-CLR-12</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>GameBoy Color</span>
                  <span className="sv-card-price mono" style={{ fontSize: 14 }}>895 kr</span>
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
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Magic: Bloomburrow</p>
                <p className="sv-card-price mono" style={{ fontSize: 13, margin: '2px 0 0' }}>4 690 kr</p>
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
                Sju kategorier, en butik. Vi katalogiserar varje produkt själva — du får skick,
                äkthet och tillgänglighet utan gissningar.
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
                Handplockat ur lagret den här veckan. Allt skickas inom 24 timmar från Stockholm.
              </p>
            </div>
            <a className="sv-section-link" href="#best-sellers">
              Se hela sortimentet
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7"/><path d="M8 7h9v9"/>
              </svg>
            </a>
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

          <div className="sv-reviews-grid">
            {REVIEW_DATA.map((review, i) => (
              <blockquote key={i} className="sv-review-card">
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
