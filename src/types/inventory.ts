export type InventoryStock = {
  productId: string
  quantityAvailable: number
  quantityReserved: number
}

export type ReserveInventoryRequest = {
  orderId: string
  productId: string
  quantity: number
}

export type ReserveInventoryResponse = {
  reservationId?: string
  id?: string
  orderId?: string
  message?: string
}

export type SetInventoryStockRequest = {
  productId: string
  quantityAvailable: number
}