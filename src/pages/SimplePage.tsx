import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import type { AuthUser } from '../types/auth'

type SimplePageProps = {
  user: AuthUser
  title: string
  description: string
  isAdmin: boolean
  onLogout: () => void
}

function SimplePage({ user, title, description, isAdmin, onLogout }: SimplePageProps) {
  return (
    <main className="sv-store">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section>
        <div className="sv-product-section">
          <h2 className="sv-section-title">{title}</h2>
          <p className="sv-section-subtitle">{description}</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default SimplePage
