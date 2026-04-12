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

export type AddressInput = {
  firstName: string
  lastName: string
  company: string
  streetLine1: string
  streetLine2: string
  city: string
  postalCode: string
  region: string
  countryCode: string
  phoneNumber: string
}

export type CheckoutRequest = {
  shippingAddress: AddressInput
  billingAddress: AddressInput
  paymentProvider: string
  paymentTransactionId: string
}

export type CheckoutResponse = {
  orderId?: string
  message?: string
}
