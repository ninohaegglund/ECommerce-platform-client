import { Link, useLocation } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
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

          <div className="success-info">
            <p>
              <strong>Ordernummer:</strong> {orderId}
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
