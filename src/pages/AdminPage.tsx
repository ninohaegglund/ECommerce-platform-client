import { useEffect, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import type { Product } from '../data/products'
import { getCatalogProducts } from '../services/catalogApi'
import { getInventoryStock, setInventoryStock } from '../services/inventoryApi'
import type { AuthUser } from '../types/auth'
import type { InventoryStock } from '../types/inventory'

type AdminPageProps = {
  user: AuthUser
  onLogout: () => void
}

function AdminPage({ user, onLogout }: AdminPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [stockValue, setStockValue] = useState('0')
  const [currentStock, setCurrentStock] = useState<InventoryStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getCatalogProducts()
        setProducts(data)
        setSelectedProductId((current) => current || data[0]?.id || '')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load catalog products.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadProducts()
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
      </section>
    </main>
  )
}

export default AdminPage
