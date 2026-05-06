import { requestMultipart } from './apiClient'
import type { ProductImage } from '../types/product-image'

const CATALOG_API_BASE_URL = import.meta.env.VITE_CATALOG_API_URL ?? 'https://localhost:7019'

export interface UploadProductImageRequest {
  file: File
  altText?: string
  sortOrder?: number
  isPrimary?: boolean
}

export async function uploadProductImage(
  productId: string,
  request: UploadProductImageRequest,
): Promise<ProductImage> {
  const formData = new FormData()
  formData.append('Image', request.file)

  if (request.altText) {
    formData.append('AltText', request.altText)
  }

  if (request.sortOrder !== undefined) {
    formData.append('SortOrder', String(request.sortOrder))
  }

  if (request.isPrimary !== undefined) {
    formData.append('IsPrimary', String(request.isPrimary))
  }

  return requestMultipart<ProductImage>(
    `/api/products/${encodeURIComponent(productId)}/images`,
    formData,
    {},
    CATALOG_API_BASE_URL,
  )
}

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const response = await fetch(
    `${CATALOG_API_BASE_URL}/api/products/${encodeURIComponent(productId)}/images`,
    {
      method: 'GET',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to load product images (${response.status})`)
  }

  return (await response.json()) as ProductImage[]
}
