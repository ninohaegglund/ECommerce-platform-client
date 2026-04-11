import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  isAdding: boolean
  onAddToCart: (product: Product) => Promise<void>
}

function ProductCard({ product, isAdding, onAddToCart }: ProductCardProps) {
  return (
    <article className="product-card">
      <p className="chip">{product.category}</p>
      <h3>{product.productName}</h3>
      <p className="price">
        {new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: product.currency,
          maximumFractionDigits: 2,
        }).format(product.unitPrice)}
      </p>
      <button
        type="button"
        className="buy-btn"
        onClick={() => void onAddToCart(product)}
        disabled={isAdding}
      >
        {isAdding ? 'Adding...' : 'Add to cart'}
      </button>
    </article>
  )
}

export default ProductCard
