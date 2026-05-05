import { Link } from 'react-router-dom'

function SiteFooter() {
  const links = [
    { label: 'Shop drops', to: '/dashboard' },
    { label: 'Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Support', to: '/about' },
  ]

  return (
    <footer className="site-footer">
      <div className="footer-brand-block">
        <Link className="footer-brand" to="/dashboard">
          NovaCart Arcade
        </Link>
        <p>
          Retro consoles, Pokemon cards, and collector gear packed with a clean
          checkout flow.
        </p>
      </div>

      <nav className="footer-links" aria-label="Footer navigation">
        {links.map((link) => (
          <Link key={link.label} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="footer-status" aria-label="Store policies">
        <span>EU shipping</span>
        <span>Graded-card care</span>
        <span>Console tested</span>
      </div>
    </footer>
  )
}

export default SiteFooter
