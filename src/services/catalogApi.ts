import type { Product } from '../data/products'

const CATALOG_API_BASE_URL =
  import.meta.env.VITE_CATALOG_API_URL ?? 'https://localhost:7019'

type CatalogProductResponse = {
  id: string
  name: string
  shortDescription: string
  price: number
}

export async function getCatalogProducts(): Promise<Product[]> {
  const response = await fetch(`${CATALOG_API_BASE_URL}/api/products`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`)
  }

  const payload = (await response.json()) as CatalogProductResponse[]

  return payload.map((item) => ({
    id: item.id,
    name: item.name,
    shortDescription: item.shortDescription,
    price: item.price,
    currency: 'SEK',
  }))
}
