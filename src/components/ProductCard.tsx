import { Link } from 'react-router-dom'
import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  isAdding: boolean
  onAddToCart: (product: Product) => Promise<void>
  imageUrl?: string
}

function getProductProfile(product: Product) {
  const searchable = `${product.name} ${product.shortDescription}`.toLowerCase()

  if (searchable.includes('pokemon') || searchable.includes('card')) {
    return {
      label: 'Card game',
      tone: 'cards',
      detail: 'Collector pick',
    }
  }

  if (
    searchable.includes('console') ||
    searchable.includes('game boy') ||
    searchable.includes('nintendo') ||
    searchable.includes('playstation') ||
    searchable.includes('sega')
  ) {
    return {
      label: 'Retro console',
      tone: 'console',
      detail: 'Hardware tested',
    }
  }

  return {
    label: 'Accessory',
    tone: 'drop',
    detail: 'Fast moving',
  }
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

function ProductCard({ product, isAdding, onAddToCart, imageUrl }: ProductCardProps) {
  const profile = getProductProfile(product)
  const fallbackImagePath = getProductImagePath(product, profile.tone)
  const resolvedImagePath = imageUrl?.trim() ? imageUrl : fallbackImagePath

  return (
    <article className={`product-card product-card-${profile.tone}`}>
      <div className="product-thumbnail" aria-hidden="true">
        <img
          src={resolvedImagePath}
          alt={`${product.name} product`}
          onError={(event) => {
            if (event.currentTarget.src !== fallbackImagePath) {
              event.currentTarget.src = fallbackImagePath
            }
          }}
        />
        <span>{profile.label}</span>
      </div>

      <div className="product-card-content">
        <div className="product-card-topline">
          <p className="chip">{profile.detail}</p>
        </div>

        <h3>{product.name}</h3>
        <p className="subtitle">{product.shortDescription || 'Fresh in stock.'}</p>
      </div>

      <div className="product-card-footer">
        <p className="price">
          {new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: product.currency,
            maximumFractionDigits: 2,
          }).format(product.price)}
        </p>

        <div className="product-card-actions">
          <button
            type="button"
            className="buy-btn"
            onClick={() => void onAddToCart(product)}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
          <Link className="product-link" to={`/products/${product.id}`}>
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
