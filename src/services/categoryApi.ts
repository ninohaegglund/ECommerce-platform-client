import type { Category } from '../types/category'
import { request } from './apiClient'
import { slugifyCategoryName } from '../utils/category'

const CATALOG_API_BASE_URL =
  import.meta.env.VITE_CATALOG_API_URL ?? 'https://localhost:7019'

export type CatalogCategoryResponse = {
  id: string
  parentCategoryId?: string | null
  childCategoryIds?: string[]
  name: string
  slug?: string
  description?: string
  productCount?: number
  isActive?: boolean
}

export function mapCatalogCategory(item: CatalogCategoryResponse): Category {
  const name = item.name ?? ''

  return {
    id: item.id,
    parentCategoryId: item.parentCategoryId ?? null,
    childCategoryIds: item.childCategoryIds ?? [],
    name,
    slug: item.slug?.trim() || slugifyCategoryName(name),
    description: item.description ?? '',
    productCount: item.productCount ?? 0,
    isActive: item.isActive ?? true,
  }
}

export async function getCatalogCategories(): Promise<Category[]> {
  const payload = await request<CatalogCategoryResponse[]>(
    '/api/Categories',
    { method: 'GET' },
    CATALOG_API_BASE_URL,
    'https://localhost:7019',
  )

  return payload.map(mapCatalogCategory).filter((category) => category.isActive)
}
