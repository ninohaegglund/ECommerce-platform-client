import type {
  AddCartItemRequest,
  Cart,
  CheckoutRequest,
  CheckoutResponse,
  UpdateCartItemRequest,
} from '../types/cart'
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  ProcessPaymentRequest,
} from '../types/payment'
import type { OrderDetails, OrderSummary } from '../types/order'
import { request } from './apiClient.ts'

const ORDER_API_BASE_URL = import.meta.env.VITE_ORDER_API_URL ?? 'https://localhost:7043'
const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL ?? 'https://localhost:7082'

export async function getCart(): Promise<Cart> {
  return request<Cart>('/api/cart', { method: 'GET' }, ORDER_API_BASE_URL)
}

export async function addCartItem(payload: AddCartItemRequest): Promise<Cart | void> {
  return request<Cart | void>(
    '/api/cart/items',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    ORDER_API_BASE_URL,
  )
}

export async function updateCartItem(
  itemId: string,
  payload: UpdateCartItemRequest,
): Promise<Cart | void> {
  return request<Cart | void>(
    `/api/cart/items/${itemId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    ORDER_API_BASE_URL,
  )
}

export async function removeCartItem(itemId: string): Promise<void> {
  return request<void>(
    `/api/cart/items/${itemId}`,
    {
      method: 'DELETE',
    },
    ORDER_API_BASE_URL,
  )
}

export async function checkoutCart(payload: CheckoutRequest): Promise<CheckoutResponse | void> {
  return request<CheckoutResponse | void>(
    '/api/cart/checkout',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    ORDER_API_BASE_URL,
  )
}

export async function getOrders(userId: string): Promise<OrderSummary[]> {
  return request<OrderSummary[]>(
    `/api/orders/user/${userId}`,
    {
      method: 'GET',
    },
    ORDER_API_BASE_URL,
  )
}

export async function getOrderById(id: string): Promise<OrderDetails> {
  return request<OrderDetails>(
    `/api/orders/${id}`,
    {
      method: 'GET',
    },
    ORDER_API_BASE_URL,
  )
}

export async function updateOrderStatus(orderId: string, status: number): Promise<void> {
  return request<void>(
    `/api/orders/${orderId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    ORDER_API_BASE_URL,
  )
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
