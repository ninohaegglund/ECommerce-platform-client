export type Category = {
  id: string
  parentCategoryId?: string | null
  childCategoryIds: string[]
  name: string
  slug: string
  description: string
  productCount: number
  isActive: boolean
}
