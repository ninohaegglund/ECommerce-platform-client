import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
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
        throw new Error('Beställningen skapades men inget ordernummer returnerades.')
      }

      const amount =
        checkoutResult?.totalAmount ??
        checkoutResult?.amount ??
        cartBeforeCheckout.subtotalAmount

      for (const item of cartBeforeCheckout.items) {
        const stock = await getInventoryStock(item.productId)
        if (stock.quantityAvailable < item.quantity) {
          throw new Error(
            `En av produkterna är slut i lager. Endast ${stock.quantityAvailable} kvar av produkt ${item.productId}.`,
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
          throw new Error('Reservation skapades men inget reservations-ID returnerades.')
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
        rawMessage.toLowerCase().includes('stock') ||
        rawMessage.toLowerCase().includes('out of stock') ||
        rawMessage.toLowerCase().includes('slut i lager')
          ? 'Produkten är slut i lager.'
          : rawMessage || 'Kunde inte skapa beställning. Försök igen.'
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
          Förnamn
          <input
            required
            value={values.firstName}
            onChange={(e) => handleAddressChange(section, 'firstName', e.target.value)}
          />
        </label>
        <label>
          Efternamn
          <input
            required
            value={values.lastName}
            onChange={(e) => handleAddressChange(section, 'lastName', e.target.value)}
          />
        </label>
        <label>
          Företag
          <input
            value={values.company}
            onChange={(e) => handleAddressChange(section, 'company', e.target.value)}
          />
        </label>
        <label>
          Telefonnummer
          <input
            required
            value={values.phoneNumber}
            onChange={(e) => handleAddressChange(section, 'phoneNumber', e.target.value)}
          />
        </label>
        <label>
          Gatuadress
          <input
            required
            value={values.streetLine1}
            onChange={(e) => handleAddressChange(section, 'streetLine1', e.target.value)}
          />
        </label>
        <label>
          Gatuadress (rad 2)
          <input
            value={values.streetLine2}
            onChange={(e) => handleAddressChange(section, 'streetLine2', e.target.value)}
          />
        </label>
        <label>
          Stad
          <input
            required
            value={values.city}
            onChange={(e) => handleAddressChange(section, 'city', e.target.value)}
          />
        </label>
        <label>
          Postnummer
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
          Landskod
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
        <h2 className="sv-section-title">Kassa</h2>
        <p className="sv-section-subtitle">Fyll i leverans- och fakturauppgifter innan betalning.</p>

        {error && <p className="feedback error">{error}</p>}

        <form className="checkout-form" onSubmit={handleSubmit}>
          {renderAddressFields('shipping', 'Leveransadress', shippingAddress)}

          <label className="remember-row">
            <input
              className="remember-check"
              type="checkbox"
              checked={billingSameAsShipping}
              onChange={(e) => setBillingSameAsShipping(e.target.checked)}
            />
            Fakturaadress är samma som leveransadress
          </label>

          {!billingSameAsShipping &&
            renderAddressFields('billing', 'Fakturaadress', billingAddress)}

          {billingSameAsShipping && (
            <div className="checkout-summary">
              <p className="subtitle">Fakturaadress (samma som leveransadress)</p>
              <p>{billingPreview.firstName} {billingPreview.lastName}</p>
              <p>{billingPreview.streetLine1}</p>
              <p>{billingPreview.postalCode} {billingPreview.city}</p>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Skapar beställning...' : 'Gå till betalning'}
          </button>
        </form>
      </section>

      <SiteFooter />
    </main>
  )
}

export default CheckoutPage
