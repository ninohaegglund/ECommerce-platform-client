export type Product = {
  productId: string
  productName: string
  sku: string
  unitPrice: number
  currency: string
  category: string
}

export const demoProducts: Product[] = [
  {
    productId: 'e6ea98ab-dab6-4f82-aa6d-1a0f5f8d2011',
    productName: 'Essential Hoodie',
    sku: 'HOODIE-001',
    unitPrice: 49,
    currency: 'SEK',
    category: 'Apparel',
  },
  {
    productId: '2d85f16d-7f0f-45e2-8e85-1d9a311f8432',
    productName: 'Minimal Sneakers',
    sku: 'SHOES-001',
    unitPrice: 89,
    currency: 'SEK',
    category: 'Footwear',
  },
  {
    productId: '90757b2b-4dfe-4af2-81ba-a8f9bf63bf3d',
    productName: 'Everyday Backpack',
    sku: 'BAG-001',
    unitPrice: 59,
    currency: 'SEK',
    category: 'Accessories',
  },
  {
    productId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    productName: 'Wireless Earbuds',
    sku: 'EARBUDS-001',
    unitPrice: 79,
    currency: 'SEK',
    category: 'Electronics',
  },
]
