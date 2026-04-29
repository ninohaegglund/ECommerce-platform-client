import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import { checkoutCart, getCart } from '../services/cartApi'
import { getInventoryStock, reserveInventory } from '../services/inventoryApi'
import type { AuthUser } from '../types/auth'
import type { AddressInput, CheckoutRequest } from '../types/cart'

type CheckoutPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

const EMPTY_ADDRESS: AddressInput = {
  firstName: '',
  lastName: '',
  company: '',
  streetLine1: '',
  streetLine2: '',
  city: '',
  postalCode: '',
  region: '',
  countryCode: 'SE',
  phoneNumber: '',
}

function CheckoutPage({ user, isAdmin, onLogout }: CheckoutPageProps) {
  const navigate = useNavigate()

  const [shippingAddress, setShippingAddress] = useState<AddressInput>(EMPTY_ADDRESS)
  const [billingAddress, setBillingAddress] = useState<AddressInput>(EMPTY_ADDRESS)
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const billingPreview = useMemo(
    () => (billingSameAsShipping ? shippingAddress : billingAddress),
    [billingAddress, billingSameAsShipping, shippingAddress],
  )

  const handleAddressChange = (
    section: 'shipping' | 'billing',
    field: keyof AddressInput,
    value: string,
  ) => {
    if (section === 'shipping') {
      setShippingAddress((prev) => ({ ...prev, [field]: value }))
      return
    }

    setBillingAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const payload: CheckoutRequest = {
      shippingAddress,
      billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
      paymentProvider: 'Stripe',
      paymentTransactionId: 'PENDING',
    }

    try {
      const cartBeforeCheckout = await getCart()
      const checkoutResult = await checkoutCart(payload)

      const orderId = checkoutResult?.orderId ?? checkoutResult?.OrderId ?? checkoutResult?.id
      if (!orderId) {
        throw new Error('Order was created but no order ID was returned.')
      }

      const amount =
        checkoutResult?.totalAmount ??
        checkoutResult?.amount ??
        cartBeforeCheckout.subtotalAmount

      for (const item of cartBeforeCheckout.items) {
        const stock = await getInventoryStock(item.productId)
        if (stock.quantityAvailable < item.quantity) {
          throw new Error(
            `One of your items is out of stock. Only ${stock.quantityAvailable} left for product ${item.productId}.`,
          )
        }
      }

      const reservationIds: string[] = []

      for (const item of cartBeforeCheckout.items) {
        const reservation = await reserveInventory({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
        })

        const reservationId = reservation.reservationId ?? reservation.id
        if (!reservationId) {
          throw new Error('Reservation was created but no reservation ID was returned.')
        }

        reservationIds.push(reservationId)
      }

      navigate(
        `/checkout/payment-simulation?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(String(amount))}&reservationIds=${encodeURIComponent(reservationIds.join(','))}`,
        {
          replace: true,
        },
      )
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : ''
      const message =
        rawMessage.toLowerCase().includes('stock') || rawMessage.toLowerCase().includes('out of stock')
          ? 'This product is out of stock.'
          : rawMessage || 'Could not create order before payment. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderAddressFields = (
    section: 'shipping' | 'billing',
    title: string,
    values: AddressInput,
  ) => (
    <fieldset className="checkout-address-block">
      <legend>{title}</legend>
      <div className="checkout-grid">
        <label>
          First Name
          <input
            required
            value={values.firstName}
            onChange={(e) => handleAddressChange(section, 'firstName', e.target.value)}
          />
        </label>
        <label>
          Last Name
          <input
            required
            value={values.lastName}
            onChange={(e) => handleAddressChange(section, 'lastName', e.target.value)}
          />
        </label>
        <label>
          Company
          <input
            value={values.company}
            onChange={(e) => handleAddressChange(section, 'company', e.target.value)}
          />
        </label>
        <label>
          Phone Number
          <input
            required
            value={values.phoneNumber}
            onChange={(e) => handleAddressChange(section, 'phoneNumber', e.target.value)}
          />
        </label>
        <label>
          Street Line 1
          <input
            required
            value={values.streetLine1}
            onChange={(e) => handleAddressChange(section, 'streetLine1', e.target.value)}
          />
        </label>
        <label>
          Street Line 2
          <input
            value={values.streetLine2}
            onChange={(e) => handleAddressChange(section, 'streetLine2', e.target.value)}
          />
        </label>
        <label>
          City
          <input
            required
            value={values.city}
            onChange={(e) => handleAddressChange(section, 'city', e.target.value)}
          />
        </label>
        <label>
          Postal Code
          <input
            required
            value={values.postalCode}
            onChange={(e) => handleAddressChange(section, 'postalCode', e.target.value)}
          />
        </label>
        <label>
          Region
          <input
            required
            value={values.region}
            onChange={(e) => handleAddressChange(section, 'region', e.target.value)}
          />
        </label>
        <label>
          Country Code
          <input
            required
            value={values.countryCode}
            onChange={(e) => handleAddressChange(section, 'countryCode', e.target.value)}
          />
        </label>
      </div>
    </fieldset>
  )

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="checkout-page">
        <h1>Checkout</h1>
        <p className="subtitle">Enter shipping and billing details before payment.</p>

        {error && <p className="feedback error">{error}</p>}

        <form className="checkout-form" onSubmit={handleSubmit}>
          {renderAddressFields('shipping', 'Shipping Address', shippingAddress)}

          <label className="remember-row">
            <input
              className="remember-check"
              type="checkbox"
              checked={billingSameAsShipping}
              onChange={(e) => setBillingSameAsShipping(e.target.checked)}
            />
            Billing address same as shipping
          </label>

          {!billingSameAsShipping &&
            renderAddressFields('billing', 'Billing Address', billingAddress)}

          {billingSameAsShipping && (
            <div className="checkout-summary">
              <p className="subtitle">Billing address preview (same as shipping)</p>
              <p>{billingPreview.firstName} {billingPreview.lastName}</p>
              <p>{billingPreview.streetLine1}</p>
              <p>{billingPreview.postalCode} {billingPreview.city}</p>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating order...' : 'Proceed to Payment'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default CheckoutPage
