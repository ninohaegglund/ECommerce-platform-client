import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { getOrderById, verifyStripeCheckoutSession } from '../services/cartApi'
import type { AuthUser } from '../types/auth'

type SuccessState = {
  orderId?: string
  amount?: number
  message?: string
}

type OrderSuccessPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function OrderSuccessPage({ user, isAdmin, onLogout }: OrderSuccessPageProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = (location.state as SuccessState | null) ?? null

  const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId') ?? ''
  const orderIdFromQuery = searchParams.get('orderId') ?? searchParams.get('order_id') ?? ''
  const amountFromQuery = searchParams.get('amount') ?? ''

  const [verificationState, setVerificationState] = useState<
    'idle' | 'verifying' | 'verified' | 'error'
  >('idle')
  const [verificationError, setVerificationError] = useState('')
  const [resolvedOrderId, setResolvedOrderId] = useState(
    state?.orderId ?? orderIdFromQuery,
  )
  const [orderNumber, setOrderNumber] = useState('')
  const orderIdForVerification = state?.orderId ?? orderIdFromQuery

  useEffect(() => {
    if (!sessionId || verificationState !== 'idle') {
      return
    }

    let isCurrent = true

    const verify = async () => {
      setVerificationState('verifying')
      setVerificationError('')

      try {
        const response = await verifyStripeCheckoutSession({
          sessionId,
          orderId: orderIdForVerification || undefined,
        })

        if (!isCurrent) {
          return
        }

        if (response.orderId) {
          setResolvedOrderId(response.orderId)
        }

        setVerificationState('verified')
      } catch (err) {
        if (!isCurrent) {
          return
        }

        const message =
          err instanceof Error ? err.message : 'Kunde inte verifiera betalningen.'
        setVerificationError(message)
        setVerificationState('error')
      }
    }

    void verify()

    return () => {
      isCurrent = false
    }
  }, [sessionId, orderIdForVerification, verificationState])

  useEffect(() => {
    if (!resolvedOrderId) {
      setOrderNumber('')
      return
    }

    let isCurrent = true

    const loadOrder = async () => {
      try {
        const order = await getOrderById(resolvedOrderId)
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
  }, [resolvedOrderId])

  const resolvedAmount = useMemo(() => {
    if (Number.isFinite(state?.amount)) {
      return state?.amount ?? 0
    }

    const parsed = Number(amountFromQuery)
    return Number.isFinite(parsed) ? parsed : null
  }, [amountFromQuery, state?.amount])

  const orderId = resolvedOrderId || '-'
  const amount = Number.isFinite(resolvedAmount)
    ? new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        maximumFractionDigits: 2,
      }).format(resolvedAmount ?? 0)
    : '-'

  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section>
        <div className="sv-empty-state success-celebrate">
          <div className="success-check" aria-hidden="true">
            ✓
          </div>
          <p className="stripe-badge">Beställning klar</p>
          <h1>Tack för din beställning!</h1>
          <p>{state?.message ?? 'Din betalning har genomförts.'}</p>

          {verificationState === 'verifying' && (
            <p className="note">Verifierar betalningen...</p>
          )}
          {verificationState === 'verified' && sessionId && (
            <p className="feedback success">Betalningen är verifierad.</p>
          )}
          {verificationState === 'error' && verificationError && (
            <p className="feedback error">{verificationError}</p>
          )}

          <div className="success-info">
            <p>
              <strong>Ordernummer:</strong> {orderNumber || '-'}
            </p>
            <p>
              <strong>Order-ID:</strong> {orderId}
            </p>
            <p>
              <strong>Betalat belopp:</strong> {amount}
            </p>
          </div>

          <div className="sv-empty-actions success-actions">
            <Link className="sv-btn-ghost" to="/orders">
              Visa beställningar
            </Link>
            <Link className="sv-btn-primary" to="/dashboard">
              Fortsätt handla
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default OrderSuccessPage
