import { useCallback, useEffect, useMemo, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import { checkoutCart, getCart, removeCartItem, updateCartItem } from '../services/cartApi'
import type { AuthUser } from '../types/auth'
import type { Cart, CartItem } from '../types/cart'

type CartPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function CartPage({ user, isAdmin, onLogout }: CartPageProps) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [activeItemId, setActiveItemId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCart = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getCart()
      setCart(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cart.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCart()
  }, [loadCart])

  const formattedSubtotal = useMemo(() => {
    if (!cart) {
      return '-'
    }

    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: cart.currency || 'SEK',
      maximumFractionDigits: 2,
    }).format(cart.subtotalAmount)
  }, [cart])

  const changeQuantity = async (item: CartItem, nextQuantity: number) => {
    if (nextQuantity < 1) {
      return
    }

    setActiveItemId(item.id)
    setError('')
    setSuccess('')

    try {
      await updateCartItem(item.id, { quantity: nextQuantity })
      await loadCart()
      setSuccess('Cart item quantity updated.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update quantity.'
      setError(message)
    } finally {
      setActiveItemId('')
    }
  }

  const removeItem = async (itemId: string) => {
    setActiveItemId(itemId)
    setError('')
    setSuccess('')

    try {
      await removeCartItem(itemId)
      await loadCart()
      setSuccess('Item removed from cart.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove item.'
      setError(message)
    } finally {
      setActiveItemId('')
    }
  }

  const handleCheckout = async () => {
    setIsCheckoutLoading(true)
    setError('')
    setSuccess('')

    try {
      await checkoutCart()
      await loadCart()
      setSuccess('Checkout completed. Order created and cart was cleared.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed.'
      setError(message)
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="cart-page">
        <h1>Your Cart</h1>
        <p className="subtitle">Review, edit, and checkout your cart.</p>

        {error && <p className="feedback error">{error}</p>}
        {success && <p className="feedback success">{success}</p>}

        {isLoading ? (
          <p>Loading cart...</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="hero-panel">
            <h2>Cart is empty</h2>
            <p>Add products from the dashboard to get started.</p>
          </div>
        ) : (
          <>
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{item.sku}</td>
                      <td>
                        <div className="qty-controls">
                          <button
                            type="button"
                            onClick={() => void changeQuantity(item, item.quantity - 1)}
                            disabled={activeItemId === item.id || item.quantity <= 1}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => void changeQuantity(item, item.quantity + 1)}
                            disabled={activeItemId === item.id}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{item.unitPrice.toFixed(2)}</td>
                      <td>{item.lineTotal.toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => void removeItem(item.id)}
                          disabled={activeItemId === item.id}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cart-summary">
              <p>
                <strong>Subtotal:</strong> {formattedSubtotal}
              </p>
              <button
                type="button"
                className="submit-btn"
                onClick={() => void handleCheckout()}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? 'Processing checkout...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default CartPage
