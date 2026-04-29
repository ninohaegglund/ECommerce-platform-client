import { request } from './apiClient'
import type {
  InventoryStock,
  ReserveInventoryRequest,
  ReserveInventoryResponse,
  SetInventoryStockRequest,
} from '../types/inventory'

const INVENTORY_API_BASE_URL =
  import.meta.env.VITE_INVENTORY_API_URL ?? 'https://localhost:7078'

type InventoryStockResponse = {
  productId?: string
  quantityAvailable?: number
  quantityReserved?: number
  availableQuantity?: number
  reservedQuantity?: number
  stock?: number
  reserved?: number
}

function normalizeStock(productId: string, payload: InventoryStockResponse): InventoryStock {
  return {
    productId: payload.productId ?? productId,
    quantityAvailable:
      payload.quantityAvailable ?? payload.availableQuantity ?? payload.stock ?? 0,
    quantityReserved:
      payload.quantityReserved ?? payload.reservedQuantity ?? payload.reserved ?? 0,
  }
}

export async function getInventoryStock(productId: string): Promise<InventoryStock> {
  const payload = await request<InventoryStockResponse>(
    `/api/inventory/${encodeURIComponent(productId)}`,
    { method: 'GET' },
    INVENTORY_API_BASE_URL,
  )

  return normalizeStock(productId, payload)
}

export async function setInventoryStock(
  payload: SetInventoryStockRequest,
): Promise<InventoryStock> {
  const response = await request<InventoryStockResponse>(
    '/api/inventory/stock',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    INVENTORY_API_BASE_URL,
  )

  return normalizeStock(payload.productId, response)
}

export async function reserveInventory(
  payload: ReserveInventoryRequest,
): Promise<ReserveInventoryResponse> {
  return request<ReserveInventoryResponse>(
    '/api/inventory/reserve',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    INVENTORY_API_BASE_URL,
  )
}

export async function confirmInventoryReservation(reservationId: string): Promise<void> {
  await request<void>(
    `/api/inventory/confirm/${encodeURIComponent(reservationId)}`,
    { method: 'POST' },
    INVENTORY_API_BASE_URL,
  )
}

export async function releaseInventoryReservation(reservationId: string): Promise<void> {
  await request<void>(
    `/api/inventory/release/${encodeURIComponent(reservationId)}`,
    { method: 'POST' },
    INVENTORY_API_BASE_URL,
  )
}