import AppNavbar from '../components/AppNavbar'
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
            <p className="eyebrow">Notifications</p>
            <h1>Notification Center</h1>
            <p className="subtitle">Recent order and payment updates for your account.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="ghost-btn" onClick={() => void refreshNotifications()}>
              Refresh
            </button>
            <button type="button" className="ghost-btn" onClick={markAllNotificationsAsRead}>
              Mark all read
            </button>
          </div>
        </div>

        {error && <p className="feedback error">{error}</p>}

        {isLoading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="hero-panel">
            <h2>No notifications yet</h2>
            <p>Order confirmations and payment alerts will appear here.</p>
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
                  {!notification.isRead && <span className="notification-pill">New</span>}
                </div>
                <p>{notification.message || 'You have a new notification.'}</p>
                {!notification.isRead && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default NotificationsPage