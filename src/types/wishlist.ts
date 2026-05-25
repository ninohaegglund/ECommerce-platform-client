export type WishlistItem = {
  id: string
  productId: string
  productName: string
  sku: string
  unitPrice: number
  currency: string
  createdAtUtc: string
}

export type Wishlist = {
  id: string
  userId: string
  items: WishlistItem[]
}
