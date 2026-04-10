import AppNavbar from '../components/AppNavbar'
import type { AuthUser } from '../types/auth'

type AdminPageProps = {
  user: AuthUser
  onLogout: () => void
}

function AdminPage({ user, onLogout }: AdminPageProps) {
  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={true} onLogout={onLogout} />

      <section className="admin-panel">
        <p className="eyebrow">Admin</p>
        <h1>Admin Control Room</h1>
        <p className="subtitle">Only users with the Admin role can open this page.</p>

        <div className="admin-grid">
          <article className="admin-card">
            <h3>Orders Monitor</h3>
            <p>Track order statuses and manually resolve failed payments.</p>
          </article>
          <article className="admin-card">
            <h3>Catalog Manager</h3>
            <p>Add or update products, pricing, and stock visibility.</p>
          </article>
          <article className="admin-card">
            <h3>User Access</h3>
            <p>Review user roles and account activity logs.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default AdminPage
