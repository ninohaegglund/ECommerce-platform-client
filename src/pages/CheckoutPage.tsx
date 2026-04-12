import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import { checkoutCart } from '../services/cartApi'
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

  const [paymentProvider, setPaymentProvider] = useState('Manual')
  const [paymentTransactionId, setPaymentTransactionId] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    setSuccess('')
    setIsSubmitting(true)

    const payload: CheckoutRequest = {
      shippingAddress,
      billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
      paymentProvider,
      paymentTransactionId,
    }

    try {
      await checkoutCart(payload)
      setSuccess('Checkout completed. Redirecting to orders...')
      navigate('/orders', {
        replace: true,
        state: { checkoutSuccess: 'Order placed successfully from cart checkout.' },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed.'
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
        <p className="subtitle">Enter shipping, billing, and payment reference details.</p>

        {error && <p className="feedback error">{error}</p>}
        {success && <p className="feedback success">{success}</p>}

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

          <fieldset className="checkout-address-block">
            <legend>Payment</legend>
            <div className="checkout-grid">
              <label>
                Payment Provider
                <input
                  required
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                />
              </label>
              <label>
                Payment Transaction Id
                <input
                  required
                  value={paymentTransactionId}
                  onChange={(e) => setPaymentTransactionId(e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting checkout...' : 'Place order from cart'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default CheckoutPage
