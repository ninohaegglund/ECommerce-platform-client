import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import StripePaymentForm from '../components/StripePaymentForm'
import {
  createPayment,
  createStripePaymentIntent,
  getOrderById,
  processPayment,
  updateOrderPayment,
} from '../services/cartApi'
import {
  confirmInventoryReservation,
  releaseInventoryReservation,
} from '../services/inventoryApi'
import { useNotificationCenter } from '../context/notificationCenter'
import type { AuthUser } from '../types/auth'
import { OrderStatusCode, PaymentStatusCode } from '../types/order'

type StripeCheckoutPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''

function StripeCheckoutPage({ user, isAdmin, onLogout }: StripeCheckoutPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshNotifications } = useNotificationCenter()

  const [clientSecret, setClientSecret] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [isPreparing, setIsPreparing] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  const orderId = searchParams.get('orderId') ?? ''
  const paymentIdFromQuery = searchParams.get('paymentId') ?? ''
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

  useEffect(() => {
    if (!orderId) {
      setOrderNumber('')
      return
    }

    let isCurrent = true

    const loadOrder = async () => {
      try {
        const order = await getOrderById(orderId)
        if (!isCurrent) {
          return
        }

        setOrderNumber(order.orderNumber || '')
      } catch {
        if (isCurrent) {
          setOrderNumber('')
        }
      }
    }

    void loadOrder()

    return () => {
      isCurrent = false
    }
  }, [orderId])

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

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!orderId) {
      throw new Error('Order saknas. Starta om kassan.')
    }

    if (!paymentId) {
      throw new Error('Betalnings-ID saknas. Starta om kassan.')
    }

    setIsFinalizing(true)

    try {
      await processPayment(paymentId, {
        isSuccessful: true,
        paymentTransactionId: paymentIntentId,
      })

      for (const reservationId of reservationIds) {
        await confirmInventoryReservation(reservationId)
      }

      await updateOrderPayment(orderId, {
        paymentStatus: PaymentStatusCode.Paid,
        paymentTransactionId: paymentIntentId,
        paymentProvider: 'Stripe',
        status: OrderStatusCode.Paid,
      })
      await refreshNotifications()

      navigate(buildOrderSuccessUrl(), {
        replace: true,
        state: {
          orderId,
          amount,
          message: 'Betalning genomford. Din bestallning ar bekraftad.',
        },
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Betalningen lyckades men ordern kunde inte slutfors.'
      throw new Error(message)
    } finally {
      setIsFinalizing(false)
    }
  }

  useEffect(() => {
    if (!orderId) {
      setError('Order saknas. Starta om kassan.')
      return
    }

    if (!STRIPE_PUBLISHABLE_KEY) {
      setError('Stripe-nyckel saknas. Lagg till VITE_STRIPE_PUBLISHABLE_KEY i .env.')
      return
    }

    if (!amount || amount <= 0) {
      setError('Beloppet saknas. Starta om kassan.')
      return
    }

    if (clientSecret) {
      return
    }

    let isCurrent = true

    const preparePayment = async () => {
      setIsPreparing(true)
      setError('')

      try {
        let paymentIdToUse = paymentIdFromQuery

        if (!paymentIdToUse) {
          const payment = await createPayment({
            orderId,
            userId: user.id,
            amount,
            paymentProvider: 'Stripe',
          })

          paymentIdToUse = payment.id ?? payment.paymentId
          if (!paymentIdToUse) {
            throw new Error('Betalningen skapades men inget betalnings-ID returnerades.')
          }
        }

        const intent = await createStripePaymentIntent(paymentIdToUse)
        const resolvedPaymentId = intent.paymentId || paymentIdToUse

        if (!intent.clientSecret) {
          throw new Error('Stripe kunde inte starta betalningen. Client secret saknas.')
        }

        if (!isCurrent) {
          return
        }

        setPaymentId(resolvedPaymentId)
        setClientSecret(intent.clientSecret)
      } catch (err) {
        if (!isCurrent) {
          return
        }

        const message =
          err instanceof Error
            ? err.message
            : 'Kunde inte starta Stripe-betalningen.'
        setError(message)
      } finally {
        if (isCurrent) {
          setIsPreparing(false)
        }
      }
    }

    void preparePayment()

    return () => {
      isCurrent = false
    }
  }, [orderId, amount, user.id, clientSecret, paymentIdFromQuery])

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section>
        <div className="sv-payment-center">
          <section className="stripe-card">
            <p className="stripe-badge">Stripe-betalning</p>
            <h1>Säker betalning</h1>
            <p className="subtitle">Ordernummer: {orderNumber || '-'}</p>
            <p className="subtitle">Order-ID: {orderId || '-'}</p>

            <div className="stripe-amount-row">
              <span>Att betala</span>
              <strong>{formattedAmount}</strong>
            </div>

            {error && <p className="feedback error">{error}</p>}
            {isPreparing && <p className="note">Forbereder Stripe-betalningen...</p>}
            {isFinalizing && <p className="note">Fardigstaller ordern...</p>}

            {clientSecret && !error && (
              <StripePaymentForm
                clientSecret={clientSecret}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
                disabled={isPreparing || isFinalizing}
              />
            )}
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default StripeCheckoutPage
