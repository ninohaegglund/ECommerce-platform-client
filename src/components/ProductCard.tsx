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
      label: 'Pokemon cards',
      tone: 'cards',
      detail: 'Sleeved and packed',
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
      detail: 'Power tested',
    }
  }

  return {
    label: 'Collector drop',
    tone: 'drop',
    detail: 'Vault selected',
  }
}

function ProductCard({ product, isAdding, onAddToCart }: ProductCardProps) {
  const profile = getProductProfile(product)

  return (
    <article className={`product-card product-card-${profile.tone}`}>
      <div className="product-art" aria-hidden="true">
        <span className="product-art-screen" />
        <span className="product-art-card" />
        <span className="product-art-button" />
        <span className="product-art-glint" />
      </div>

      <div className="product-card-content">
        <div className="product-card-topline">
          <p className="chip">{profile.label}</p>
          <span>{profile.detail}</span>
        </div>

        <h3>{product.name}</h3>
        <p className="subtitle">{product.shortDescription || 'Fresh from the vault.'}</p>
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
            {isAdding ? 'Adding...' : 'Add to bag'}
          </button>
          <Link className="product-link" to={`/products/${product.id}`}>
            Stock
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
