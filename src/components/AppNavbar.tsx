import { useEffect, useRef, useState, type FocusEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useNotificationCenter } from '../context/notificationCenter'
import type { AuthUser } from '../types/auth'

type AppNavbarProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

const CATEGORIES = [
  { name: 'Pokémon-kort', color: 'var(--red)', count: '1 248' },
  { name: 'Spel', color: 'var(--blue)', count: '634' },
  { name: 'Konsoler', color: 'var(--ink-2)', count: '417' },
  { name: 'Refurbished', color: 'var(--mint)', count: '186' },
]

const mainNavItems = [
  { label: 'Produkter', to: '/dashboard' },
  { label: 'Pokémon-kort', to: '/pokemon-kort' },
  { label: 'Spel', to: '/spel' },
  { label: 'Konsoler', to: '/konsoler' },
  { label: 'Refurbished', to: '/refurbished' },
  { label: 'Erbjudanden', to: '/erbjudanden' },
  { label: 'Support', to: '/support' },
]

const productDropdownItems = [
  { label: 'Alla produkter', to: '/produkter' },
  { label: 'Pokémon-kort', to: '/pokemon-kort' },
  { label: 'Spel', to: '/spel' },
  { label: 'Konsoler', to: '/konsoler' },
  { label: 'Refurbished', to: '/refurbished' },
]

function AppNavbar({ user, isAdmin, onLogout }: AppNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const productsDropdownRef = useRef<HTMLDivElement>(null)
  const { unreadCount } = useNotificationCenter()
  const location = useLocation()
  const isGuest = user.id === 'guest'
  const productPaths = ['/dashboard', ...productDropdownItems.map((item) => item.to)]
  const isProductsActive = productPaths.includes(location.pathname)

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openProductsMenu = () => setIsProductsOpen(true)
  const closeProductsMenu = () => setIsProductsOpen(false)

  const handleProductsBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget as Node | null

    if (!nextFocusedElement || !event.currentTarget.contains(nextFocusedElement)) {
      closeProductsMenu()
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 0)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isProductsOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null

      if (target && productsDropdownRef.current?.contains(target)) return

      closeProductsMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      closeProductsMenu()
      productsDropdownRef.current?.querySelector('button')?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProductsOpen])

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()

  return (
    <header className="sv-header">
      {/* Utility bar */}
      {isAtTop && (
        <div className="sv-utility-bar">
          <div className="sv-utility-inner">
            <div className="sv-utility-left">
              <span className="sv-utility-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="8" cy="9" r="1.2" fill="var(--amber)"/>
                </svg>
                5% medlemsrabatt
              </span>
              <span className="sv-utility-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>
                </svg>
                1–4 dagars leverans
              </span>
              <span className="sv-utility-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>
                </svg>
                14 dagars prislöfte
              </span>
              <span className="sv-utility-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4a3.5 3.5 0 0 1 0 7"/><path d="M22 20a6 6 0 0 0-5-6"/>
                </svg>
                20 000+ nöjda samlare
              </span>
            </div>
            <div className="sv-utility-right">
              <span className="sv-locale mono">SE · SEK</span>
              <span className="sv-utility-divider" aria-hidden="true">|</span>
              <a href="#">Spåra order</a>
              <a href="#">Hjälp</a>
              {isGuest ? (
                <>
                  <Link to="/login">Logga in</Link>
                  <Link to="/register">Skapa konto</Link>
                </>
              ) : (
                <span className="sv-utility-user">Hej, {user.firstName}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main navbar row */}
      <div className="sv-navbar-main">
        <div className="sv-navbar-inner">
          {/* Logo */}
          <Link className="sv-logo" to="/dashboard" aria-label="Spelvalvet hem" onClick={handleLogoClick}>
            <div className="sv-logo-mark" aria-hidden="true">
              <div className="sv-logo-vault">
                <div className="sv-logo-dot" />
              </div>
            </div>
            <div className="sv-logo-copy">
              <strong>Spelvalvet</strong>
              <small className="mono">SAMLARENS HEM · EST. 2019</small>
            </div>
          </Link>

          {/* Search */}
          <form
            className={`sv-search${searchFocused ? ' sv-search--focused' : ''}`}
            role="search"
            aria-label="Sök produkter"
            onSubmit={(e) => e.preventDefault()}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Sök kort, set, konsol eller serie…"
              aria-label="Sök"
            />
            <kbd className="sv-kbd mono">⌘K</kbd>
          </form>

          {/* Actions */}
          <div className="sv-nav-actions">
            <button
              type="button"
              className="sv-nav-toggle"
              onClick={() => setIsNavOpen((v) => !v)}
              aria-expanded={isNavOpen}
              aria-label="Öppna meny"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>

            <button type="button" className="sv-icon-btn" aria-label="Önskelista">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z"/>
              </svg>
            </button>

            <Link
              className="sv-icon-btn sv-icon-btn--rel"
              to="/notifications"
              aria-label={`Aviseringar${unreadCount > 0 ? `, ${unreadCount} olästa` : ''}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="sv-badge sv-badge--red mono">{unreadCount}</span>
              )}
            </Link>

            <Link className="sv-cart-btn" to="/cart" aria-label="Varukorg">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.5L20.5 8H6"/><circle cx="9.5" cy="20" r="1.2"/><circle cx="17.5" cy="20" r="1.2"/>
              </svg>
              <span>Varukorg</span>
            </Link>

            {!isGuest && (
              <div className="sv-profile-menu">
                <button
                  type="button"
                  className="sv-avatar"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Kontomeny"
                >
                  {initials || 'U'}
                </button>
                {isMenuOpen && (
                  <div className="sv-profile-dropdown" role="menu">
                    <p className="sv-profile-name">{user.firstName} {user.lastName}</p>
                    <p className="sv-profile-email">{user.email}</p>
                    <Link to="/orders" role="menuitem" onClick={() => setIsMenuOpen(false)}>Mina ordrar</Link>
                    <Link to="/wishlist" role="menuitem" onClick={() => setIsMenuOpen(false)}>Önskelista</Link>
                    <Link to="/account" role="menuitem" onClick={() => setIsMenuOpen(false)}>Kontoinställningar</Link>
                    {isAdmin && (
                      <Link to="/admin" role="menuitem" onClick={() => setIsMenuOpen(false)}>Adminpanel</Link>
                    )}
                    <button
                      type="button"
                      className="sv-dropdown-logout"
                      onClick={() => { setIsMenuOpen(false); onLogout() }}
                    >
                      Logga ut
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav row 1 */}
      <div className="sv-nav-row1">
        <div className="sv-nav-row1-inner">
          <nav aria-label="Primär navigation">
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.to

              if (item.label === 'Produkter') {
                return (
                  <div
                    key={item.label}
                    ref={productsDropdownRef}
                    className="sv-nav-dropdown"
                    onBlur={handleProductsBlur}
                    onMouseEnter={openProductsMenu}
                    onMouseLeave={closeProductsMenu}
                  >
                    <button
                      type="button"
                      className={`sv-nav-link sv-nav-link--button${isProductsActive ? ' sv-nav-link--active' : ''}`}
                      onClick={() => setIsProductsOpen((v) => !v)}
                      onFocus={openProductsMenu}
                      aria-expanded={isProductsOpen}
                      aria-haspopup="menu"
                      aria-controls="products-menu"
                    >
                      Produkter
                      <svg className="sv-nav-caret" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isProductsOpen && (
                      <div id="products-menu" className="sv-nav-dropdown-menu" role="menu">
                        {productDropdownItems.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.label}
                            to={dropdownItem.to}
                            role="menuitem"
                            onClick={() => setIsProductsOpen(false)}
                          >
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`sv-nav-link${isActive ? ' sv-nav-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link to="/admin" className="sv-nav-link">Admin</Link>
            )}
          </nav>
          <div className="sv-new-release" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="m6 6 3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>
            </svg>
            <span>Nytt: <strong>refurbished N64</strong> nu i lager</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div id="nav-drawer" className={`sv-nav-drawer${isNavOpen ? ' open' : ''}`} role="dialog" aria-label="Navigation">
        {[...mainNavItems].map((item) => (
          <Link key={`mob-${item.label}`} to={item.to} onClick={() => setIsNavOpen(false)}>
            {item.label}
          </Link>
        ))}
        {CATEGORIES.map((cat) => (
          <Link key={`mob-cat-${cat.name}`} to={`/dashboard#${cat.name.toLowerCase()}`} onClick={() => setIsNavOpen(false)}>
            {cat.name}
          </Link>
        ))}
        {isAdmin && (
          <Link to="/admin" onClick={() => setIsNavOpen(false)}>Admin</Link>
        )}
      </div>
    </header>
  )
}

export default AppNavbar
