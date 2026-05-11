import { useCallback, useEffect, useMemo, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import ProductImageUpload from '../components/ProductImageUpload'
import type { Product } from '../data/products'
import { getCatalogCategories } from '../services/categoryApi'
import { createCatalogProduct, getCatalogProducts } from '../services/catalogApi'
import { getInventoryStock, setInventoryStock } from '../services/inventoryApi'
import type { AuthUser } from '../types/auth'
import type { Category } from '../types/category'
import type { InventoryStock } from '../types/inventory'
import { slugifyCategoryName } from '../utils/category'

type AdminPageProps = {
  user: AuthUser
  onLogout: () => void
}

type CreateProductFormState = {
  categoryId: string
  name: string
  slug: string
  sku: string
  shortDescription: string
  description: string
  price: string
  compareAtPrice: string
  currency: string
  stockQuantity: string
  isActive: boolean
  status: string
  imageUrl: string
  imageAltText: string
}

const emptyProductForm: CreateProductFormState = {
  categoryId: '',
  name: '',
  slug: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: '',
  compareAtPrice: '',
  currency: 'SEK',
  stockQuantity: '0',
  isActive: true,
  status: '0',
  imageUrl: '',
  imageAltText: '',
}

function getCategoryOptions(categories: Category[]) {
  const childrenByParentId = new Map<string, Category[]>()
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'))

  sortedCategories.forEach((category) => {
    if (!category.parentCategoryId) return
    const children = childrenByParentId.get(category.parentCategoryId) ?? []
    children.push(category)
    childrenByParentId.set(category.parentCategoryId, children)
  })

  const rootCategories = sortedCategories.filter((category) => !category.parentCategoryId)
  const roots = rootCategories.length > 0 ? rootCategories : sortedCategories
  const options: Array<{ category: Category; depth: number }> = []

  const visit = (category: Category, depth: number) => {
    options.push({ category, depth })
    childrenByParentId.get(category.id)?.forEach((child) => visit(child, depth + 1))
  }

  roots.forEach((category) => visit(category, 0))

  return options
}

function AdminPage({ user, onLogout }: AdminPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [stockValue, setStockValue] = useState('0')
  const [currentStock, setCurrentStock] = useState<InventoryStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [productForm, setProductForm] = useState<CreateProductFormState>(emptyProductForm)
  const [createProductError, setCreateProductError] = useState('')
  const [createProductSuccess, setCreateProductSuccess] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const categoryOptions = useMemo(() => getCategoryOptions(categories), [categories])

  const loadProducts = useCallback(async (preferredProductId?: string) => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getCatalogProducts()
      setProducts(data)
      setSelectedProductId((current) => preferredProductId || current || data[0]?.id || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load catalog products.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true)

      try {
        const data = await getCatalogCategories()
        setCategories(data)
        setProductForm((current) => ({
          ...current,
          categoryId: current.categoryId || data[0]?.id || '',
        }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load categories.'
        setCreateProductError(message)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    void loadCategories()
  }, [])

  useEffect(() => {
    const loadStock = async () => {
      if (!selectedProductId) {
        setCurrentStock(null)
        return
      }

      try {
        setCurrentStock(await getInventoryStock(selectedProductId))
      } catch {
        setCurrentStock(null)
      }
    }

    void loadStock()
  }, [selectedProductId])

  useEffect(() => {
    if (currentStock) {
      setStockValue(String(currentStock.quantityAvailable))
      return
    }

    setStockValue('0')
  }, [currentStock])

  const handleSaveStock = async () => {
    if (!selectedProductId) {
      setError('Choose a product first.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const nextStock = Number(stockValue)
      if (!Number.isFinite(nextStock) || nextStock < 0) {
        throw new Error('Stock must be a non-negative number.')
      }

      const saved = await setInventoryStock({
        productId: selectedProductId,
        quantityAvailable: nextStock,
      })

      setCurrentStock(saved)
      setSuccess('Stock saved successfully.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save stock.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const updateProductForm = <Key extends keyof CreateProductFormState>(
    key: Key,
    value: CreateProductFormState[Key],
  ) => {
    setProductForm((current) => ({ ...current, [key]: value }))
  }

  const handleCreateProduct = async () => {
    setIsCreatingProduct(true)
    setCreateProductError('')
    setCreateProductSuccess('')
    setSuccess('')
    setError('')

    try {
      const name = productForm.name.trim()
      const categoryId = productForm.categoryId.trim()
      const price = Number(productForm.price)
      const compareAtPrice = productForm.compareAtPrice.trim()
        ? Number(productForm.compareAtPrice)
        : null
      const stockQuantity = Number(productForm.stockQuantity)
      const status = Number(productForm.status)

      if (!categoryId) {
        throw new Error('Choose a category.')
      }

      if (!name) {
        throw new Error('Product name is required.')
      }

      if (!productForm.sku.trim()) {
        throw new Error('SKU is required.')
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Price must be a non-negative number.')
      }

      if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
        throw new Error('Compare-at price must be a non-negative number.')
      }

      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        throw new Error('Stock quantity must be a non-negative whole number.')
      }

      if (!Number.isInteger(status) || status < 0) {
        throw new Error('Status must be a non-negative number.')
      }

      const imageUrl = productForm.imageUrl.trim()
      const created = await createCatalogProduct({
        categoryId,
        name,
        slug: productForm.slug.trim() || slugifyCategoryName(name),
        sku: productForm.sku.trim(),
        shortDescription: productForm.shortDescription.trim(),
        description: productForm.description.trim(),
        price,
        compareAtPrice,
        currency: productForm.currency.trim() || 'SEK',
        stockQuantity,
        isActive: productForm.isActive,
        status,
        images: imageUrl
          ? [
            {
              imageUrl,
              altText: productForm.imageAltText.trim() || name,
              sortOrder: 0,
              isPrimary: true,
            },
          ]
          : [],
      })

      setProductForm((current) => ({
        ...emptyProductForm,
        categoryId: current.categoryId,
      }))
      setSelectedProductId(created.id)
      setCreateProductSuccess(`${created.name} created successfully.`)
      await loadProducts(created.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create product.'
      setCreateProductError(message)
    } finally {
      setIsCreatingProduct(false)
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={true} onLogout={onLogout} />

      <section className="admin-panel">
        <p className="eyebrow">Admin</p>
        <h1>Admin Control Room</h1>
        <p className="subtitle">Only users with the Admin role can open this page.</p>

        <div className="admin-grid">
          <article className="admin-card">
            <h3>Orders Monitor</h3>
            <p>Track order statuses and manually resolve failed payments.</p>
          </article>
          <article className="admin-card">
            <h3>Inventory Manager</h3>
            <p>Add or update stock reservations and stock visibility.</p>
          </article>
          <article className="admin-card">
            <h3>User Access</h3>
            <p>Review user roles and account activity logs.</p>
          </article>
        </div>

        <div className="admin-stock-panel">
          <h2>Create product</h2>
          <p className="subtitle">Create a catalog product and assign it to a category from CatalogService.API.</p>

          {createProductError && <p className="feedback error">{createProductError}</p>}
          {createProductSuccess && <p className="feedback success">{createProductSuccess}</p>}

          <div className="admin-product-form">
            <label>
              Category
              <select
                value={productForm.categoryId}
                onChange={(event) => updateProductForm('categoryId', event.target.value)}
                disabled={isLoadingCategories || categoryOptions.length === 0}
              >
                {categoryOptions.length === 0 ? (
                  <option value="">No categories found</option>
                ) : (
                  categoryOptions.map(({ category, depth }) => (
                    <option key={category.id} value={category.id}>
                      {`${'-- '.repeat(depth)}${category.name}`}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              Product name
              <input
                type="text"
                value={productForm.name}
                onChange={(event) => updateProductForm('name', event.target.value)}
                placeholder="Silent Hill 3 - PlayStation 2"
              />
            </label>

            <label>
              Slug
              <input
                type="text"
                value={productForm.slug}
                onChange={(event) => updateProductForm('slug', event.target.value)}
                placeholder="Auto-generated from product name"
              />
            </label>

            <label>
              SKU
              <input
                type="text"
                value={productForm.sku}
                onChange={(event) => updateProductForm('sku', event.target.value)}
                placeholder="PS2-SH3"
              />
            </label>

            <label>
              Short description
              <input
                type="text"
                value={productForm.shortDescription}
                onChange={(event) => updateProductForm('shortDescription', event.target.value)}
                placeholder="Short card/dashboard text"
              />
            </label>

            <label className="admin-product-form__wide">
              Description
              <textarea
                value={productForm.description}
                onChange={(event) => updateProductForm('description', event.target.value)}
                rows={4}
                placeholder="Long product detail description"
              />
            </label>

            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(event) => updateProductForm('price', event.target.value)}
              />
            </label>

            <label>
              Compare-at price
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.compareAtPrice}
                onChange={(event) => updateProductForm('compareAtPrice', event.target.value)}
              />
            </label>

            <label>
              Currency
              <input
                type="text"
                value={productForm.currency}
                onChange={(event) => updateProductForm('currency', event.target.value.toUpperCase())}
              />
            </label>

            <label>
              Stock quantity
              <input
                type="number"
                min="0"
                step="1"
                value={productForm.stockQuantity}
                onChange={(event) => updateProductForm('stockQuantity', event.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={productForm.status}
                onChange={(event) => updateProductForm('status', event.target.value)}
              >
                <option value="0">Draft</option>
                <option value="1">Published</option>
              </select>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(event) => updateProductForm('isActive', event.target.checked)}
              />
              Active product
            </label>

            <label>
              Primary image URL
              <input
                type="url"
                value={productForm.imageUrl}
                onChange={(event) => updateProductForm('imageUrl', event.target.value)}
                placeholder="https://localhost:7019/uploads/products/image.jpg"
              />
            </label>

            <label>
              Image alt text
              <input
                type="text"
                value={productForm.imageAltText}
                onChange={(event) => updateProductForm('imageAltText', event.target.value)}
                placeholder="Defaults to product name"
              />
            </label>

            <button
              type="button"
              className="submit-btn admin-product-form__wide"
              onClick={() => void handleCreateProduct()}
              disabled={isCreatingProduct || isLoadingCategories || categoryOptions.length === 0}
            >
              {isCreatingProduct ? 'Creating product...' : 'Create product'}
            </button>
          </div>
        </div>

        <div className="admin-stock-panel">
          <h2>Set product stock</h2>
          <p className="subtitle">Write stock levels to InventoryService.API using the catalog product id.</p>

          {error && <p className="feedback error">{error}</p>}
          {success && <p className="feedback success">{success}</p>}

          {isLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="admin-stock-form">
              <label>
                Product
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Available stock
                <input
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                />
              </label>

              <button
                type="button"
                className="submit-btn"
                onClick={() => void handleSaveStock()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving stock...' : 'Save stock'}
              </button>
            </div>
          )}

          {currentStock && (
            <p className="subtitle">
              Current inventory: {currentStock.quantityAvailable} available,{' '}
              {currentStock.quantityReserved} reserved.
            </p>
          )}
        </div>

        {selectedProductId && !isLoading && (
          <div className="admin-images-panel">
            <ProductImageUpload productId={selectedProductId} />
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}

export default AdminPage
