import { getStoredAuth } from '../utils/authStorage'
import type {
  AddCartItemRequest,
  Cart,
  CheckoutRequest,
  CheckoutResponse,
  UpdateCartItemRequest,
} from '../types/cart'
import type { OrderDetails, OrderSummary } from '../types/order'
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  ProcessPaymentRequest,
} from '../types/payment'

const ORDER_API_BASE_URL =
  import.meta.env.VITE_ORDER_API_URL ?? 'https://localhost:7043'
const PAYMENT_API_BASE_URL =
  import.meta.env.VITE_PAYMENT_API_URL ?? 'https://localhost:7082'

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

async function request<T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = ORDER_API_BASE_URL,
): Promise<T> {
  const token = getAuthToken()

  const response = await fetch(`${baseUrl}${path}`, {
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

export async function checkoutCart(payload: CheckoutRequest): Promise<CheckoutResponse | void> {
  return request<CheckoutResponse | void>('/api/cart/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getOrders(userId: string): Promise<OrderSummary[]> {
  return request<OrderSummary[]>(`/api/orders/user/${userId}`, {
    method: 'GET',
  })
}

export async function getOrderById(id: string): Promise<OrderDetails> {
  return request<OrderDetails>(`/api/orders/${id}`, {
    method: 'GET',
  })
}

export async function updateOrderStatus(orderId: string, status: number): Promise<void> {
  return request<void>(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function createPayment(
  payload: CreatePaymentRequest,
): Promise<CreatePaymentResponse> {
  return request<CreatePaymentResponse>(
    '/api/Payments',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    PAYMENT_API_BASE_URL,
  )
}

export async function processPayment(
  paymentId: string,
  payload: ProcessPaymentRequest,
): Promise<void> {
  return request<void>(
    `/api/Payments/${paymentId}/process`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    PAYMENT_API_BASE_URL,
  )
}
