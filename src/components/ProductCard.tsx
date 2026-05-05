import { Link } from 'react-router-dom'
import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  isAdding: boolean
  onAddToCart: (product: Product) => Promise<void>
}

function getProductKind(product: Product) {
  const searchable = `${product.name} ${product.shortDescription}`.toLowerCase()

  if (searchable.includes('pokemon') || searchable.includes('card')) {
    return 'Trading Cards'
  }

  if (
    searchable.includes('console') ||
    searchable.includes('game boy') ||
    searchable.includes('nintendo') ||
    searchable.includes('playstation') ||
    searchable.includes('sega')
  ) {
    return 'Retro Console'
  }

  return 'Collector Drop'
}

function ProductCard({ product, isAdding, onAddToCart }: ProductCardProps) {
  const productKind = getProductKind(product)

  return (
    <article className="product-card">
      <div className="product-art" aria-hidden="true">
        <span className="product-art-screen" />
        <span className="product-art-card" />
        <span className="product-art-button" />
      </div>

      <div className="product-card-content">
        <p className="chip">{productKind}</p>
        <h3>{product.name}</h3>
        <p className="subtitle">{product.shortDescription || 'Fresh from the vault.'}</p>
        <p className="price">
          {new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: product.currency,
            maximumFractionDigits: 2,
          }).format(product.price)}
        </p>
      </div>

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
          Stock details
        </Link>
      </div>
    </article>
  )
}

export default ProductCard
