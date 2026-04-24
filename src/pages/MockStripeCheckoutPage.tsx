import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPayment, processPayment, updateOrderStatus } from '../services/cartApi'
import type { AuthUser } from '../types/auth'

type MockStripeCheckoutPageProps = {
  user: AuthUser
}

function MockStripeCheckoutPage({ user }: MockStripeCheckoutPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId') ?? ''
  const amountRaw = searchParams.get('amount') ?? '0'

  const amount = useMemo(() => {
    const parsed = Number(amountRaw)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0
    }

    return parsed
  }, [amountRaw])

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        maximumFractionDigits: 2,
      }).format(amount),
    [amount],
  )

  const generateTransactionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `STRIPE-MOCK-${crypto.randomUUID()}`
    }

    return `STRIPE-MOCK-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  }

  const handlePay = async () => {
    if (!orderId) {
      setError('Missing orderId. Please restart checkout.')
      return
    }

    setError('')
    setIsPaying(true)

    try {
      const payment = await createPayment({
        orderId,
        userId: user.id,
        amount,
        paymentProvider: 'Stripe',
      })

      const paymentId = payment.id ?? payment.paymentId
      if (!paymentId) {
        throw new Error('Payment was created but no payment ID was returned.')
      }

      await processPayment(paymentId, {
        isSuccessful: true,
        paymentTransactionId: generateTransactionId(),
      })

      await updateOrderStatus(orderId, 2)

      navigate('/order-success', {
        replace: true,
        state: {
          orderId,
          amount,
          message: 'Payment successful. Your order is confirmed.',
        },
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Payment failed. Please try again or restart checkout.'
      setError(message)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="payment-shell">
      <section className="stripe-card">
        <p className="stripe-badge">Stripe Hosted Checkout (Simulation)</p>
        <h1>Secure payment</h1>
        <p className="subtitle">Order ID: {orderId || '-'}</p>

        <div className="stripe-amount-row">
          <span>Total amount due</span>
          <strong>{formattedAmount}</strong>
        </div>

        <div className="fake-card-line">4242 4242 4242 4242</div>

        {error && <p className="feedback error">{error}</p>}

        <button
          type="button"
          className="submit-btn"
          onClick={() => void handlePay()}
          disabled={isPaying}
        >
          {isPaying ? 'Processing payment...' : 'Pay with Stripe'}
        </button>

        <p className="subtitle">
          Return to <Link to="/checkout">checkout</Link>
        </p>
      </section>
    </main>
  )
}

export default MockStripeCheckoutPage
