import type { Product } from '../data/products'
import { mapCatalogCategory, type CatalogCategoryResponse } from './categoryApi'
import { request as apiRequest } from './apiClient'
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
  compareAtPrice?: number | null
  CompareAtPrice?: number | null
  currency?: string
  sku?: string
  Sku?: string
  stockQuantity?: number
  status?: number | string
  Status?: number | string
  createdAtUtc?: string
  CreatedAtUtc?: string
  updatedAtUtc?: string
  UpdatedAtUtc?: string
  images?: ProductImage[]
}

type CreateCatalogProductImageRequest = {
  imageUrl: string
  altText?: string
  sortOrder: number
  isPrimary: boolean
}

export type CreateCatalogProductRequest = {
  categoryId: string
  name: string
  slug: string
  sku: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number | null
  currency: string
  stockQuantity: number
  isActive: boolean
  status: number
  images: CreateCatalogProductImageRequest[]
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
    compareAtPrice: item.compareAtPrice ?? item.CompareAtPrice ?? null,
    currency: item.currency ?? 'SEK',
    sku: item.sku ?? item.Sku ?? '',
    stockQuantity: item.stockQuantity ?? 0,
    status: item.status ?? item.Status,
    createdAtUtc: item.createdAtUtc ?? item.CreatedAtUtc,
    updatedAtUtc: item.updatedAtUtc ?? item.UpdatedAtUtc,
    images: item.images ?? [],
  }
}

export async function getCatalogProducts(): Promise<Product[]> {
  const payload = await apiRequest<CatalogProductResponse[]>(
    '/api/products',
    { method: 'GET' },
    CATALOG_API_BASE_URL,
    'https://localhost:7019',
  )

  return payload.map(mapCatalogProduct)
}

export async function getCatalogProduct(productId: string): Promise<Product> {
  const payload = await apiRequest<CatalogProductResponse>(
    `/api/products/${encodeURIComponent(productId)}`,
    {
      method: 'GET',
    },
    CATALOG_API_BASE_URL,
    'https://localhost:7019',
  )

  return mapCatalogProduct(payload)
}

export async function createCatalogProduct(request: CreateCatalogProductRequest): Promise<Product> {
  return mapCatalogProduct(
    await apiRequest<CatalogProductResponse>(
      '/api/Products',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      CATALOG_API_BASE_URL,
      'https://localhost:7019',
    ),
  )
}
