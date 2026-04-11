import { getStoredAuth } from '../utils/authStorage'
import type { AddCartItemRequest, Cart, UpdateCartItemRequest } from '../types/cart'

const ORDER_API_BASE_URL =
  import.meta.env.VITE_ORDER_API_URL ?? 'https://localhost:7043'

function getAuthToken(): string {
  const token = getStoredAuth().token || localStorage.getItem('authToken') || ''
  if (!token) {
    throw new Error('Missing auth token. Please sign in again.')
  }

  return token
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }

    if ('title' in payload && typeof payload.title === 'string') {
      return payload.title
    }
  }

  return fallback
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()

  const response = await fetch(`${ORDER_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let payload: unknown = null

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    throw new Error(getErrorMessage(payload, `Request failed (${response.status})`))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export async function getCart(): Promise<Cart> {
  return request<Cart>('/api/cart', { method: 'GET' })
}

export async function addCartItem(payload: AddCartItemRequest): Promise<Cart | void> {
  return request<Cart | void>('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCartItem(
  itemId: string,
  payload: UpdateCartItemRequest,
): Promise<Cart | void> {
  return request<Cart | void>(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function removeCartItem(itemId: string): Promise<void> {
  return request<void>(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  })
}

export async function checkoutCart(): Promise<void> {
  return request<void>('/api/cart/checkout', {
    method: 'POST',
  })
}
