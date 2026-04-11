export type CartItem = {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type Cart = {
  id: string
  userId: string
  currency: string
  subtotalAmount: number
  items: CartItem[]
}

export type AddCartItemRequest = {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  currency: string
}

export type UpdateCartItemRequest = {
  quantity: number
}
