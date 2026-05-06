import { Link } from 'react-router-dom'

function SiteFooter() {
  const productLinks = [
    { label: 'Pokemon', to: '/dashboard#pokemon' },
    { label: 'Magic: The Gathering', to: '/dashboard#magic' },
    { label: 'One Piece', to: '/dashboard#one-piece' },
    { label: 'Yu-Gi-Oh!', to: '/dashboard#yu-gi-oh' },
    { label: 'Lorcana', to: '/dashboard#lorcana' },
    { label: 'Accessories', to: '/dashboard#accessories' },
  ]

  const customerLinks = [
    { label: 'Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Account', to: '/account' },
    { label: 'Notifications', to: '/notifications' },
  ]

  return (
    <footer className="site-footer">
      <section className="service-strip" aria-label="Store guarantees">
        <article>
          <h2>Free shipping</h2>
          <p>On purchases over 2999 SEK</p>
        </article>
        <article>
          <h2>Price guarantee</h2>
          <p>14 day price promise</p>
        </article>
        <article>
          <h2>Secure payments</h2>
          <p>Card, Swish and Klarna</p>
        </article>
        <article>
          <h2>Open purchase</h2>
          <p>14 days open purchase</p>
        </article>
      </section>

      <div className="footer-main">
        <section className="footer-brand-block" aria-label="NovaCart TCG">
          <Link className="footer-brand" to="/dashboard">
            NovaCart TCG
          </Link>
          <p>
            Your online trading card store for Pokemon, Magic, One Piece, retro
            consoles and trusted collector accessories.
          </p>
          <p className="footer-note">Your passion, our range.</p>
        </section>

        <nav className="footer-column" aria-label="Products">
          <h2>Products</h2>
          {productLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label="Customer">
          <h2>Customer</h2>
          {customerLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
          <Link to="/about">About us</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>NovaCart TCG 2026</span>
        <span>Sweden's collector-first store experience</span>
      </div>
    </footer>
  )
}

export default SiteFooter
