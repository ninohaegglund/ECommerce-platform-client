import { Link } from 'react-router-dom'

function SiteFooter() {
  const shopLinks = [
    { label: 'Latest drops', to: '/dashboard#drop-grid' },
    { label: 'Retro consoles', to: '/dashboard#consoles' },
    { label: 'Pokemon cards', to: '/dashboard#cards' },
    { label: 'Preorders', to: '/dashboard#preorders' },
  ]

  const accountLinks = [
    { label: 'Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Account', to: '/account' },
    { label: 'Notifications', to: '/notifications' },
  ]

  const supportLinks = [
    { label: 'About the vault', to: '/about' },
    { label: 'Trade-ins', to: '/dashboard#trade-ins' },
    { label: 'Checkout', to: '/checkout' },
  ]

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section className="footer-brand-block" aria-label="NovaCart Vault">
          <Link className="footer-brand" to="/dashboard">
            NovaCart Vault
          </Link>
          <p>
            A cleaner place for retro consoles, Pokemon cards, and display-ready
            collector stock.
          </p>
          <div className="footer-promise-row" aria-label="Store promises">
            <span>Tested hardware</span>
            <span>Secure card mailers</span>
            <span>EU shipping</span>
          </div>
        </section>

        <nav className="footer-column" aria-label="Shop">
          <h2>Shop</h2>
          {shopLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label="Account">
          <h2>Account</h2>
          {accountLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label="Support">
          <h2>Support</h2>
          {supportLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <span>Built for collectors who care about condition.</span>
        <span>NovaCart Vault 2026</span>
      </div>
    </footer>
  )
}

export default SiteFooter
