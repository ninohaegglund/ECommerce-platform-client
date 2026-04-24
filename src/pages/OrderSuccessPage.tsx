import { Link, useLocation } from 'react-router-dom'

type SuccessState = {
  orderId?: string
  amount?: number
  message?: string
}

function OrderSuccessPage() {
  const location = useLocation()
  const state = (location.state as SuccessState | null) ?? null

  const orderId = state?.orderId ?? '-'
  const amount = Number.isFinite(state?.amount)
    ? new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        maximumFractionDigits: 2,
      }).format(state?.amount ?? 0)
    : '-'

  return (
    <main className="payment-shell">
      <section className="success-card">
        <p className="stripe-badge">Order Completed</p>
        <h1>Payment Successful</h1>
        <p className="subtitle">{state?.message ?? 'Your payment has been processed successfully.'}</p>

        <div className="success-info">
          <p>
            <strong>Order ID:</strong> {orderId}
          </p>
          <p>
            <strong>Paid Amount:</strong> {amount}
          </p>
        </div>

        <div className="success-actions">
          <Link className="ghost-btn" to="/orders">
            View Orders
          </Link>
          <Link className="submit-btn success-primary" to="/dashboard">
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  )
}

export default OrderSuccessPage
