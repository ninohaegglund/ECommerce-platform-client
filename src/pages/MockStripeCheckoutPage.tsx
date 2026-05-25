import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { createPayment, processPayment, updateOrderPayment } from '../services/cartApi'
import { confirmInventoryReservation, releaseInventoryReservation } from '../services/inventoryApi'
import { useNotificationCenter } from '../context/notificationCenter'
import type { AuthUser } from '../types/auth'
import { OrderStatusCode, PaymentStatusCode } from '../types/order'

type MockStripeCheckoutPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function MockStripeCheckoutPage({ user, isAdmin, onLogout }: MockStripeCheckoutPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshNotifications } = useNotificationCenter()

  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId') ?? ''
  const reservationIds = (searchParams.get('reservationIds') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
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

  const buildOrderSuccessUrl = () => {
    const params = new URLSearchParams()
    if (orderId) {
      params.set('orderId', orderId)
    }
    if (Number.isFinite(amount)) {
      params.set('amount', String(amount))
    }

    const query = params.toString()
    return query ? `/order-success?${query}` : '/order-success'
  }

  const generateTransactionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `STRIPE-MOCK-${crypto.randomUUID()}`
    }

    return `STRIPE-MOCK-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  }

  const releaseReservations = async () => {
    if (reservationIds.length === 0) {
      return
    }

    for (const reservationId of reservationIds) {
      try {
        await releaseInventoryReservation(reservationId)
      } catch {
        // Ignore release errors after a failed payment attempt.
      }
    }
  }

  const handleCancel = async () => {
    await releaseReservations()
    navigate('/checkout', { replace: true })
  }

  const handlePay = async () => {
    if (!orderId) {
      setError('Order saknas. Starta om kassan.')
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
        throw new Error('Betalningen skapades men inget betalnings-ID returnerades.')
      }

      const transactionId = generateTransactionId()

      await processPayment(paymentId, {
        isSuccessful: true,
        paymentTransactionId: transactionId,
      })

      for (const reservationId of reservationIds) {
        await confirmInventoryReservation(reservationId)
      }

      await updateOrderPayment(orderId, {
        paymentStatus: PaymentStatusCode.Paid,
        paymentTransactionId: transactionId,
        paymentProvider: 'Stripe',
        status: OrderStatusCode.Paid,
      })
      await refreshNotifications()

      navigate(buildOrderSuccessUrl(), {
        replace: true,
        state: {
          orderId,
          amount,
          message: 'Betalning genomförd. Din beställning är bekräftad.',
        },
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Betalningen misslyckades. Försök igen eller starta om kassan.'
      setError(message)
      await releaseReservations()
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section>
        <div className="sv-payment-center">
          <section className="stripe-card">
            <p className="stripe-badge">Stripe-betalning (simulering)</p>
            <h1>Säker betalning</h1>
            <p className="subtitle">Ordernummer: {orderId || '-'}</p>

            <div className="stripe-amount-row">
              <span>Att betala</span>
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
              {isPaying ? 'Bearbetar betalning...' : 'Betala med Stripe'}
            </button>

            <button type="button" className="ghost-btn" onClick={() => void handleCancel()}>
              Avbryt betalning
            </button>

            <p className="subtitle">
              <Link to="/checkout">Tillbaka till kassan</Link>
            </p>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default MockStripeCheckoutPage
