export type Product = {
  id: number
  name: string
  price: string
  category: string
}

export const demoProducts: Product[] = [
  { id: 1, name: 'Essential Hoodie', price: '$49', category: 'Apparel' },
  { id: 2, name: 'Minimal Sneakers', price: '$89', category: 'Footwear' },
  { id: 3, name: 'Everyday Backpack', price: '$59', category: 'Accessories' },
  { id: 4, name: 'Wireless Earbuds', price: '$79', category: 'Electronics' },
]
