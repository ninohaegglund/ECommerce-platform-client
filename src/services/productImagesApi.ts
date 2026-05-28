import { request as apiRequest } from './apiClient'
import type { ProductImage } from '../types/product-image'

const CATALOG_API_BASE_URL = import.meta.env.VITE_CATALOG_API_URL ?? 'https://localhost:7019'

export interface CreateProductImageRequest {
  imageUrl: string
  altText?: string
  sortOrder?: number
  isPrimary?: boolean
}

export async function createProductImage(
  productId: string,
  request: CreateProductImageRequest,
): Promise<ProductImage> {
  const payload = {
    imageUrl: request.imageUrl,
    ...(request.altText ? { altText: request.altText } : {}),
    ...(request.sortOrder !== undefined ? { sortOrder: request.sortOrder } : {}),
    ...(request.isPrimary !== undefined ? { isPrimary: request.isPrimary } : {}),
  }

  return apiRequest<ProductImage>(
    `/api/Products/${encodeURIComponent(productId)}/images`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    CATALOG_API_BASE_URL,
  )
}

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const response = await fetch(
    `${CATALOG_API_BASE_URL}/api/Products/${encodeURIComponent(productId)}/images`,
    {
      method: 'GET',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to load product images (${response.status})`)
  }

  return (await response.json()) as ProductImage[]
}
