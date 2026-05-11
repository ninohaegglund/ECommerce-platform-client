import type { Category } from '../types/category'
import type { ProductImage } from '../types/product-image'

export type Product = {
  id: string
  categoryId: string
  category?: Category
  name: string
  shortDescription: string
  description: string
  price: number
  currency: string
  stockQuantity: number
  images?: ProductImage[]
}
