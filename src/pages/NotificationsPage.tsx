import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import { useNotificationCenter } from '../context/notificationCenter'
import type { AuthUser } from '../types/auth'

type NotificationsPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function NotificationsPage({ user, isAdmin, onLogout }: NotificationsPageProps) {
  const {
    notifications,
    isLoading,
    error,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationCenter()

  return (
    <main className="store-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="notification-page">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aviseringar</p>
            <h1>Aviseringscenter</h1>
            <p className="subtitle">Senaste uppdateringar om dina ordrar och betalningar.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="ghost-btn" onClick={() => void refreshNotifications()}>
              Uppdatera
            </button>
            <button type="button" className="ghost-btn" onClick={markAllNotificationsAsRead}>
              Markera alla som lästa
            </button>
          </div>
        </div>

        {error && <p className="feedback error">{error}</p>}

        {isLoading ? (
          <p>Laddar aviseringar...</p>
        ) : notifications.length === 0 ? (
          <div className="sv-empty-state">
            <svg
              className="sv-empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h2>Inga aviseringar än</h2>
            <p>Orderbekräftelser och betalningsaviseringar visas här så snart de kommer in.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-card${notification.isRead ? ' is-read' : ''}`}
              >
                <div className="notification-topline">
                  <div>
                    <h3>{notification.title}</h3>
                    <p className="subtitle">
                      {new Date(notification.createdAtUtc).toLocaleString('sv-SE')}
                    </p>
                  </div>
                  {!notification.isRead && <span className="notification-pill">Ny</span>}
                </div>
                <p>{notification.message || 'Du har en ny avisering.'}</p>
                {!notification.isRead && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    Markera som läst
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}

export default NotificationsPage
