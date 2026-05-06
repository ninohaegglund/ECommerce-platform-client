import { Link } from 'react-router-dom'
import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  isAdding: boolean
  onAddToCart: (product: Product) => Promise<void>
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

function ProductCard({ product, isAdding, onAddToCart }: ProductCardProps) {
  const profile = getProductProfile(product)

  return (
    <article className={`product-card product-card-${profile.tone}`}>
      <div className="product-thumbnail" aria-hidden="true">
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
