import { Link } from 'react-router-dom'
import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  isAdding: boolean
  onAddToCart: (product: Product) => Promise<void>
}

function ProductCard({ product, isAdding, onAddToCart }: ProductCardProps) {
  return (
    <article className="product-card">
      <h3>{product.name}</h3>
      <p className="subtitle">{product.shortDescription || 'No description available.'}</p>
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
        onClick={() => void onAddToCart(product)}
        disabled={isAdding}
      >
        {isAdding ? 'Adding...' : 'Add to cart'}
      </button>
      <Link className="product-link" to={`/products/${product.id}`}>
        View stock details
      </Link>
    </article>
  )
}

export default ProductCard
