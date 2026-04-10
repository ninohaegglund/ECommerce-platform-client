import AppNavbar from '../components/AppNavbar'
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
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="hero-panel">
        <h2>{title}</h2>
        <p>{description}</p>
      </section>
    </main>
  )
}

export default SimplePage
