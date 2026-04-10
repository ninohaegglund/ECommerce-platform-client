import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <p className="chip">{product.category}</p>
      <h3>{product.name}</h3>
      <p className="price">{product.price}</p>
      <button type="button" className="buy-btn">
        Add to cart
      </button>
    </article>
  )
}

export default ProductCard
