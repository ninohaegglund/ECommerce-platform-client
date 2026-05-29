import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import ProductCard from '../components/ProductCard'
import SiteFooter from '../components/SiteFooter'
import { addCartItem } from '../services/cartApi'
import { getCatalogCategories } from '../services/categoryApi'
import { getCatalogProduct, getCatalogProducts } from '../services/catalogApi'
import { getInventoryStock } from '../services/inventoryApi'
import { getProductImages } from '../services/productImagesApi'
import { addWishlistItem, getWishlist, removeWishlistItem } from '../services/wishlistApi'
import type { Product } from '../data/products'
import type { AuthUser } from '../types/auth'
import type { Category } from '../types/category'
import type { InventoryStock } from '../types/inventory'
import type { ProductImage } from '../types/product-image'
import type { Wishlist } from '../types/wishlist'
import { getStoredAuth } from '../utils/authStorage'
import { slugifyCategoryName } from '../utils/category'
import { getProductImagePath, getProductProfile } from '../utils/productCard'

type ProductDetailPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function getProductImageCandidates(images: ProductImage[]) {
  return images
    .filter((img) => img.imageUrl.trim().length > 0)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
      return a.sortOrder - b.sortOrder
    })
    .map((img) => img.imageUrl.trim())
}

async function resolveWorkingImageUrl(candidates: string[]) {
  for (const candidate of candidates) {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = candidate
    })
    if (ok) return candidate
  }
  return ''
}

async function resolveProductImageUrl(product: Product) {
  const images = product.images?.length ? product.images : await getProductImages(product.id)
  return resolveWorkingImageUrl(getProductImageCandidates(images))
}

function normalizeMatchKey(value: string | undefined | null) {
  return value?.trim().toLowerCase() ?? ''
}

function makeCategoryMap(categories: Category[]) {
  return new Map(categories.map((category) => [normalizeMatchKey(category.id), category] as const))
}

function getProductCategory(product: Product, categoryById: Map<string, Category>) {
  return product.category ?? categoryById.get(normalizeMatchKey(product.categoryId)) ?? null
}

function getProductCategoryIds(product: Product) {
  return new Set(
    [product.categoryId, product.category?.id]
      .map(normalizeMatchKey)
      .filter(Boolean),
  )
}

function getCategoryTextKeys(product: Product, categoryById: Map<string, Category>) {
  const category = getProductCategory(product, categoryById)
  const profile = getProductProfile(product)

  return new Set(
    [
      category?.id,
      category?.slug,
      category?.name,
      product.category?.slug,
      product.category?.name,
      profile.label,
      profile.tone,
    ]
      .map((value) => slugifyCategoryName(value ?? ''))
      .filter(Boolean),
  )
}

function getCategoryFamilyIds(
  product: Product,
  categoryById: Map<string, Category>,
  categories: Category[],
) {
  const ids = new Set(getProductCategoryIds(product))
  const queue = [...ids]

  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index]
    const category = categoryById.get(id)

    if (category?.parentCategoryId) {
      const parentId = normalizeMatchKey(category.parentCategoryId)
      if (parentId && !ids.has(parentId)) {
        ids.add(parentId)
        queue.push(parentId)
      }
    }

    categories.forEach((item) => {
      const itemId = normalizeMatchKey(item.id)
      const parentId = normalizeMatchKey(item.parentCategoryId)

      if (parentId === id && itemId && !ids.has(itemId)) {
        ids.add(itemId)
        queue.push(itemId)
      }
    })
  }

  return ids
}

function intersects<T>(left: Set<T>, right: Set<T>) {
  for (const item of left) {
    if (right.has(item)) return true
  }

  return false
}

function getRelatedProductScore(
  product: Product,
  currentProduct: Product,
  categoryById: Map<string, Category>,
  categories: Category[],
) {
  const currentCategoryIds = getProductCategoryIds(currentProduct)
  const productCategoryIds = getProductCategoryIds(product)

  if (intersects(productCategoryIds, currentCategoryIds)) return 4

  const currentTextKeys = getCategoryTextKeys(currentProduct, categoryById)
  const productTextKeys = getCategoryTextKeys(product, categoryById)

  if (intersects(productTextKeys, currentTextKeys)) return 3

  const currentFamilyIds = getCategoryFamilyIds(currentProduct, categoryById, categories)
  const productFamilyIds = getCategoryFamilyIds(product, categoryById, categories)

  if (intersects(productCategoryIds, currentFamilyIds) || intersects(productFamilyIds, currentCategoryIds)) {
    return 2
  }

  const currentProfile = getProductProfile(currentProduct)
  const productProfile = getProductProfile(product)

  if (
    currentProfile.label === productProfile.label ||
    currentProfile.tone === productProfile.tone
  ) {
    return 1
  }

  return 0
}

function getRelatedProducts(
  products: Product[],
  currentProduct: Product,
  categories: Category[] = [],
) {
  const categoryById = makeCategoryMap(categories)

  return products
    .map((item) => {
      if (item.id === currentProduct.id) return null
      const score = getRelatedProductScore(item, currentProduct, categoryById, categories)
      return score > 0 ? { product: item, score } : null
    })
    .filter((item): item is { product: Product; score: number } => item !== null)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'sv-SE'))
    .map((item) => item.product)
    .slice(0, 4)
}

function ProductDetailPage({ user, isAdmin, onLogout }: ProductDetailPageProps) {
  const { productId = '' } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [stock, setStock] = useState<InventoryStock | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [relatedProductImageUrls, setRelatedProductImageUrls] = useState<Record<string, string>>({})
  const [productImageUrl, setProductImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [relatedAddingProductId, setRelatedAddingProductId] = useState('')
  const [relatedAddedSkus, setRelatedAddedSkus] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [wishlistError, setWishlistError] = useState('')
  const [wishlistUpdatingIds, setWishlistUpdatingIds] = useState<Set<string>>(new Set())
  const isAuthenticated = user.id !== 'guest' && Boolean(getStoredAuth().token)

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError('')
      setProduct(null)
      setStock(null)
      setRelatedProducts([])
      setRelatedProductImageUrls({})
      setProductImageUrl('')

      try {
        let selectedProduct: Product | null = null
        let loadedProducts: Product[] | null = null

        try {
          selectedProduct = await getCatalogProduct(productId)
        } catch {
          loadedProducts = await getCatalogProducts()
          selectedProduct = loadedProducts.find((item) => item.id === productId) ?? null
        }

        if (!selectedProduct) {
          throw new Error('Produkten hittades inte.')
        }

        setProduct(selectedProduct)
        try {
          setStock(await getInventoryStock(selectedProduct.id))
        } catch {
          setStock(null)
        }

        try {
          const url = await resolveProductImageUrl(selectedProduct)
          setProductImageUrl(url)
        } catch {
          setProductImageUrl('')
        }

        try {
          const [products, categories] = await Promise.all([
            loadedProducts ? Promise.resolve(loadedProducts) : getCatalogProducts(),
            getCatalogCategories().catch(() => [] as Category[]),
          ])
          setRelatedProducts(getRelatedProducts(products, selectedProduct, categories))
        } catch {
          setRelatedProducts([])
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kunde inte ladda produktdetaljer.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      void loadProduct()
    }
  }, [productId])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let cancelled = false

    const loadWishlist = async () => {
      setWishlistError('')
      try {
        const data = await getWishlist()
        if (!cancelled) {
          setWishlist(data)
        }
      } catch (err) {
        if (!cancelled) {
          setWishlistError(err instanceof Error ? err.message : 'Kunde inte ladda \u00f6nskelistan.')
        }
      }
    }

    void loadWishlist()
    return () => { cancelled = true }
  }, [isAuthenticated])

  useEffect(() => {
    if (relatedProducts.length === 0) {
      return
    }

    let cancelled = false

    const loadImages = async () => {
      const entries = await Promise.all(
        relatedProducts.map(async (relatedProduct) => {
          try {
            const url = await resolveProductImageUrl(relatedProduct)
            return url ? [relatedProduct.id, url] : null
          } catch {
            return null
          }
        }),
      )

      if (cancelled) return

      setRelatedProductImageUrls(
        Object.fromEntries(entries.filter((entry): entry is [string, string] => entry !== null)),
      )
    }

    void loadImages()
    return () => { cancelled = true }
  }, [relatedProducts])

  const formattedPrice = useMemo(() => {
    if (!product) {
      return '-'
    }

    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: product.currency,
      maximumFractionDigits: 2,
    }).format(product.price)
  }, [product])

  const fallbackImageUrl = useMemo(() => {
    if (!product) return ''
    const profile = getProductProfile(product)
    return getProductImagePath(product, profile.tone)
  }, [product])

  const productDescription =
    product?.description.trim() ||
    product?.shortDescription.trim() ||
    'Ingen beskrivning tillg\u00e4nglig.'

  const availableQuantity = stock?.quantityAvailable ?? product?.stockQuantity ?? 0
  const isOutOfStock = availableQuantity <= 0

  const wishlistItemsByProductId = useMemo(
    () => new Map((wishlist?.items ?? []).map((item) => [item.productId, item] as const)),
    [wishlist],
  )

  const handleAddToCart = async () => {
    if (!product) {
      return
    }

    setIsAdding(true)
    setError('')
    setSuccess('')

    try {
      if (availableQuantity <= 0) {
        throw new Error('Den h\u00e4r produkten \u00e4r slut i lager.')
      }

      await addCartItem({
        productId: product.id,
        quantity: 1,
        currency: product.currency,
      })
      setSuccess(`${product.name} har lagts i varukorgen.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte l\u00e4gga produkten i varukorgen.'
      setError(message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRelatedAddToCart = async (relatedProduct: Product) => {
    setRelatedAddingProductId(relatedProduct.id)
    setError('')
    setSuccess('')

    try {
      await addCartItem({
        productId: relatedProduct.id,
        quantity: 1,
        currency: relatedProduct.currency,
      })
      setRelatedAddedSkus((current) => new Set(current).add(relatedProduct.id))
      setSuccess(`${relatedProduct.name} har lagts i varukorgen.`)
      window.setTimeout(() => {
        setRelatedAddedSkus((current) => {
          const next = new Set(current)
          next.delete(relatedProduct.id)
          return next
        })
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte l\u00e4gga produkten i varukorgen.'
      setError(message)
    } finally {
      setRelatedAddingProductId('')
    }
  }

  const handleToggleWishlist = async (relatedProduct: Product) => {
    if (!isAuthenticated) {
      setError('Logga in f\u00f6r att spara i \u00f6nskelistan.')
      return
    }

    const existingItem = wishlistItemsByProductId.get(relatedProduct.id)
    setError('')
    setSuccess('')
    setWishlistError('')
    setWishlistUpdatingIds((current) => new Set(current).add(relatedProduct.id))

    try {
      if (existingItem) {
        await removeWishlistItem(existingItem.id)
        setWishlist((current) => (current
          ? { ...current, items: current.items.filter((item) => item.id !== existingItem.id) }
          : current
        ))
        setSuccess(`${relatedProduct.name} borttagen fr\u00e5n \u00f6nskelistan.`)
      } else {
        const updated = await addWishlistItem(relatedProduct.id)
        setWishlist(updated)
        setSuccess(`${relatedProduct.name} sparad i \u00f6nskelistan.`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte uppdatera \u00f6nskelistan.'
      setError(message)
    } finally {
      setWishlistUpdatingIds((current) => {
        const next = new Set(current)
        next.delete(relatedProduct.id)
        return next
      })
    }
  }

  const fallbackRelatedImageUrl = (relatedProduct: Product) => {
    const profile = getProductProfile(relatedProduct)
    return getProductImagePath(relatedProduct, profile.tone)
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="product-detail-page">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Produktdetaljer</p>
            <h1>{product?.name ?? 'Laddar produkt'}</h1>
          </div>
          <Link className="ghost-btn" to="/dashboard">
            Tillbaka till produkter
          </Link>
        </div>

        {error && <p className="feedback error">{error}</p>}
        {wishlistError && <p className="feedback error">{wishlistError}</p>}
        {success && <p className="feedback success">{success}</p>}

        {isLoading ? (
          <p>Laddar produkt...</p>
        ) : product ? (
          <>
            <div className="product-detail-grid">
              <div className="product-detail-media-panel">
                <div className="product-detail-image">
                  <img
                    src={productImageUrl || fallbackImageUrl}
                    alt={product.name}
                    onError={(event) => {
                      if (fallbackImageUrl && event.currentTarget.dataset.fallbackApplied !== 'true') {
                        event.currentTarget.dataset.fallbackApplied = 'true'
                        event.currentTarget.src = fallbackImageUrl
                      }
                    }}
                  />
                </div>
              </div>

              <article className="hero-panel product-detail-info">
                <h2>{product.name}</h2>
                <p className="product-detail-description">{productDescription}</p>
                <p className="price">{formattedPrice}</p>

                <div className="product-detail-meta-grid">
                  <div>
                    <span>{'Tillg\u00e4ngliga'}</span>
                    <strong>{availableQuantity}</strong>
                  </div>
                </div>

                {isOutOfStock && (
                  <p className="feedback error">
                    {'Slut i lager. Produkten kan inte l\u00e4ggas till just nu.'}
                  </p>
                )}

                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => void handleAddToCart()}
                  disabled={isAdding || isOutOfStock}
                >
                  {isOutOfStock ? 'Slut i lager' : isAdding ? 'L\u00e4gger till...' : 'L\u00e4gg i varukorgen'}
                </button>
              </article>
            </div>

            {relatedProducts.length > 0 && (
              <section className="related-products" aria-labelledby="related-products-title">
                <div className="related-products-heading">
                  <p className="eyebrow">Samma kategori</p>
                  <h2 id="related-products-title">Liknande produkter</h2>
                </div>
                <div className="related-grid">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard
                      key={relatedProduct.id}
                      product={relatedProduct}
                      isAdding={relatedAddingProductId === relatedProduct.id}
                      added={relatedAddedSkus.has(relatedProduct.id)}
                      onAddToCart={handleRelatedAddToCart}
                      isWishlisted={wishlistItemsByProductId.has(relatedProduct.id)}
                      isWishlistLoading={wishlistUpdatingIds.has(relatedProduct.id)}
                      onToggleWishlist={handleToggleWishlist}
                      imageUrl={
                        relatedProductImageUrls[relatedProduct.id] ??
                        fallbackRelatedImageUrl(relatedProduct)
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  )
}

export default ProductDetailPage
