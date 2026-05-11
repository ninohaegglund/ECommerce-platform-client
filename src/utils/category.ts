import type { Category } from '../types/category'

export function slugifyCategoryName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'och')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getCategorySlug(category: Pick<Category, 'id' | 'name' | 'slug'>) {
  return category.slug.trim() || slugifyCategoryName(category.name) || category.id
}

export function getCategoryPath(category: Pick<Category, 'id' | 'name' | 'slug'>) {
  return `/${getCategorySlug(category)}`
}

export function categoryMatchesSlug(
  category: Pick<Category, 'id' | 'name' | 'slug'> | undefined | null,
  slug: string,
) {
  if (!category) return false

  const normalizedSlug = slugifyCategoryName(slug)
  return (
    category.id.toLowerCase() === slug.toLowerCase() ||
    slugifyCategoryName(category.slug) === normalizedSlug ||
    slugifyCategoryName(category.name) === normalizedSlug
  )
}
