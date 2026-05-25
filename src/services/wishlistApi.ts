import { request } from './apiClient'
import type { Wishlist } from '../types/wishlist'

const ORDER_API_BASE_URL = import.meta.env.VITE_ORDER_API_URL ?? 'https://localhost:7043'

type AddWishlistItemRequest = {
  productId: string
}

export async function getWishlist(): Promise<Wishlist> {
  return request<Wishlist>('/api/wishlist', { method: 'GET' }, ORDER_API_BASE_URL)
}

export async function addWishlistItem(productId: string): Promise<Wishlist> {
  const payload: AddWishlistItemRequest = { productId }
  return request<Wishlist>(
    '/api/wishlist/items',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    ORDER_API_BASE_URL,
  )
}

export async function removeWishlistItem(itemId: string): Promise<void> {
  return request<void>(
    `/api/wishlist/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
    },
    ORDER_API_BASE_URL,
  )
}
