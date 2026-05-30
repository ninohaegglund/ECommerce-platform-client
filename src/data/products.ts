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
  compareAtPrice?: number | null
  currency: string
  sku?: string
  stockQuantity: number
  status?: number | string
  createdAtUtc?: string
  updatedAtUtc?: string
  images?: ProductImage[]
}
