import { Link } from 'react-router-dom'
import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  isAdding: boolean
  added: boolean
  onAddToCart: (product: Product) => Promise<void>
  imageUrl?: string
}

type ProductProfile = {
  label: string
  tone: string
  color: string
  refurbished: boolean
}

function getProductProfile(product: Product): ProductProfile {
  const s = `${product.name} ${product.shortDescription}`.toLowerCase()

  const refurbished =
    s.includes('refurbished') ||
    s.includes('renoverad') ||
    s.includes('refurb')

  if (s.includes('pokemon') || s.includes('pokémon')) {
    return { label: 'Pokémon-kort', tone: 'cards', color: 'var(--red)', refurbished }
  }
  if (
    s.includes('spel') ||
    s.includes('game') ||
    s.includes('zelda') ||
    s.includes('mario') ||
    s.includes('sonic') ||
    s.includes('snes') ||
    s.includes('nes ') ||
    s.includes('mega drive') ||
    s.includes('game boy')
  ) {
    return { label: 'Spel', tone: 'cards', color: 'var(--blue)', refurbished }
  }
  if (
    s.includes('konsol') ||
    s.includes('console') ||
    s.includes('nintendo') ||
    s.includes('playstation') ||
    s.includes('xbox') ||
    s.includes('sega') ||
    s.includes('n64') ||
    s.includes('switch')
  ) {
    return { label: refurbished ? 'Refurbished' : 'Konsoler', tone: 'console', color: refurbished ? 'var(--mint)' : 'var(--ink-2)', refurbished }
  }
  return { label: 'Spel & Konsoler', tone: 'drop', color: 'var(--ink-2)', refurbished }
}

function getProductImagePath(product: Product, tone: string) {
  const cards = [
    '/shop-icons/pokemon-surging-sparks-booster-box.webp',
    '/shop-icons/pokemon-151-japansk-booster-box.webp',
    '/shop-icons/cynthias-garchump-ex-087-sar-raukcard-10-pokemon-kort.webp',
    '/shop-icons/simisear-214-vstar-universe-raukcard-10.webp',
  ]
  const consoles = [
    '/shop-icons/N64-Retro-Gaming-Console.webp',
    '/shop-icons/Nintendo64KontrollTredjepartOrange_8cc0d6a1-427d-4f0f-95c7-d0e65a8cd766.webp',
  ]
  const accessories = [
    '/shop-icons/img20260422_15443916.webp',
    '/shop-icons/wyf1f4xupwlelyxoksio.jpg',
  ]

  const source = tone === 'cards' ? cards : tone === 'console' ? consoles : accessories
  const seed = product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return source[seed % source.length]
}

function ProductCard({ product, isAdding, added, onAddToCart, imageUrl }: ProductCardProps) {
  const profile = getProductProfile(product)
  const fallbackImagePath = getProductImagePath(product, profile.tone)
  const resolvedImagePath = imageUrl?.trim() ? imageUrl : fallbackImagePath

  const formattedPrice = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: product.currency,
    maximumFractionDigits: 0,
  }).format(product.price)

  return (
    <article className="sv-product-card">
      <div className="sv-product-image">
        <img
          src={resolvedImagePath}
          alt={product.name}
          onError={(e) => {
            if (e.currentTarget.src !== fallbackImagePath) {
              e.currentTarget.src = fallbackImagePath
            }
          }}
        />
        <div className="sv-product-badges">
          <span
            className="sv-product-cat-chip"
            style={{ color: profile.color, borderColor: profile.color }}
          >
            {profile.label.toUpperCase()}
          </span>
          {profile.refurbished && (
            <span
              className="sv-product-badge-chip"
              style={{ background: 'var(--mint)' }}
            >
              REFURBISHED
            </span>
          )}
        </div>
        <button type="button" className="sv-product-heart" aria-label="Lägg till i önskelista">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z"/>
          </svg>
        </button>
        <div className="sv-product-sku">› {product.id.slice(0, 12).toUpperCase()}</div>
      </div>

      <div className="sv-product-body">
        <h3 className="sv-product-name">{product.name}</h3>
        <p className="sv-product-desc">{product.shortDescription || 'Ny i lager.'}</p>

        <div className="sv-product-divider">
          <div className="sv-product-price-row">
            <span className="sv-product-price mono">{formattedPrice}</span>
            <span
              className="sv-stock-label"
              style={{ color: 'var(--mint)' }}
            >
              <span className="sv-stock-dot" />
              I lager
            </span>
          </div>

          <button
            type="button"
            className={`sv-add-btn${added ? ' sv-add-btn--added' : ''}`}
            onClick={() => void onAddToCart(product)}
            disabled={isAdding}
          >
            {added ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>
                </svg>
                Tillagd i varukorg
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {isAdding ? 'Lägger till…' : 'Lägg i varukorg'}
              </>
            )}
          </button>
        </div>
      </div>

      <Link
        className="sv-product-detail-link sr-only"
        to={`/products/${product.id}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        Visa detaljer
      </Link>
    </article>
  )
}

export default ProductCard
