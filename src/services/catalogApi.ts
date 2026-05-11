import type { Product } from '../data/products'
import { mapCatalogCategory, type CatalogCategoryResponse } from './categoryApi'
import type { ProductImage } from '../types/product-image'

const CATALOG_API_BASE_URL =
  import.meta.env.VITE_CATALOG_API_URL ?? 'https://localhost:7019'

type CatalogProductResponse = {
  id: string
  categoryId?: string
  category?: CatalogCategoryResponse
  name: string
  shortDescription?: string
  description?: string
  price: number
  currency?: string
  stockQuantity?: number
  images?: ProductImage[]
}

function mapCatalogProduct(item: CatalogProductResponse): Product {
  return {
    id: item.id,
    categoryId: item.categoryId ?? item.category?.id ?? '',
    category: item.category ? mapCatalogCategory(item.category) : undefined,
    name: item.name,
    shortDescription: item.shortDescription ?? '',
    description: item.description ?? '',
    price: item.price,
    currency: item.currency ?? 'SEK',
    stockQuantity: item.stockQuantity ?? 0,
    images: item.images ?? [],
  }
}

export async function getCatalogProducts(): Promise<Product[]> {
  const response = await fetch(`${CATALOG_API_BASE_URL}/api/products`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`)
  }

  const payload = (await response.json()) as CatalogProductResponse[]

  return payload.map(mapCatalogProduct)
}

export async function getCatalogProduct(productId: string): Promise<Product> {
  const response = await fetch(
    `${CATALOG_API_BASE_URL}/api/products/${encodeURIComponent(productId)}`,
    {
      method: 'GET',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to load product (${response.status})`)
  }

  return mapCatalogProduct((await response.json()) as CatalogProductResponse)
}
