import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationCenter } from '../context/notificationCenter'
import type { AuthUser } from '../types/auth'

type AppNavbarProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function AppNavbar({ user, isAdmin, onLogout }: AppNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const { unreadCount } = useNotificationCenter()

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()

  const navItems = [
    { label: 'New drops', to: '/dashboard#drop-grid' },
    { label: 'Consoles', to: '/dashboard#consoles' },
    { label: 'Pokemon cards', to: '/dashboard#cards' },
    { label: 'Preorders', to: '/dashboard#preorders' },
    { label: 'Trade-ins', to: '/dashboard#trade-ins' },
    { label: 'Support', to: '/about' },
  ]

  return (
    <header className="site-header">
      <div className="header-utility" aria-label="Store highlights">
        <span>Drop room open</span>
        <span>Console tested</span>
        <span>Card-safe packing</span>
      </div>

      <div className="app-navbar">
        <Link className="brand" to="/dashboard" aria-label="NovaCart Vault home">
          <span className="brand-mark" aria-hidden="true">
            NC
          </span>
          <span className="brand-copy">
            <strong>NovaCart Vault</strong>
            <small>Retro games and cards</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setIsNavOpen((value) => !value)}
            aria-expanded={isNavOpen}
            aria-controls="nav-drawer"
            aria-label="Open navigation menu"
          >
            <span className="nav-toggle-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <Link className="notification-btn" to="/notifications" aria-label="Notifications">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 22a2.2 2.2 0 0 0 2.1-1.5H9.9A2.2 2.2 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Zm-2 1H7v-5a5 5 0 1 1 10 0v5Z"
                fill="currentColor"
              />
            </svg>
            <span className="sr-only">Open notifications</span>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </Link>

          <Link className="cart-btn" to="/cart" aria-label="Shopping cart">
            <img src="/cart-icon.svg" alt="" aria-hidden="true" />
            <span>Bag</span>
          </Link>

          <div className="profile-menu">
            <button
              type="button"
              className="profile-btn"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <img className="profile-image" src="/profile-avatar.svg" alt="Profile" />
              <span className="profile-initials">{initials || 'U'}</span>
            </button>

            {isMenuOpen && (
              <div className="profile-dropdown" role="menu">
                <p className="profile-name">{user.firstName} {user.lastName}</p>
                <p className="profile-email">{user.email}</p>
                <Link to="/orders" role="menuitem" onClick={() => setIsMenuOpen(false)}>
                  Orders
                </Link>
                <Link to="/wishlist" role="menuitem" onClick={() => setIsMenuOpen(false)}>
                  Wishlist
                </Link>
                <Link to="/account" role="menuitem" onClick={() => setIsMenuOpen(false)}>
                  Account settings
                </Link>
                {isAdmin && (
                  <Link to="/admin" role="menuitem" onClick={() => setIsMenuOpen(false)}>
                    Admin panel
                  </Link>
                )}
                <button
                  type="button"
                  className="dropdown-logout"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onLogout()
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="nav-drawer" className={`nav-drawer ${isNavOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <Link key={`mobile-${item.label}`} to={item.to} onClick={() => setIsNavOpen(false)}>
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <Link to="/admin" onClick={() => setIsNavOpen(false)}>
            Admin
          </Link>
        )}
      </div>
    </header>
  )
}

export default AppNavbar
