import { Link } from 'react-router-dom'

function SiteFooter() {
  const columns = [
    {
      title: 'Handla',
      links: [
        { label: 'Pokémon TCG', to: '/dashboard#pokemon' },
        { label: 'Magic: The Gathering', to: '/dashboard#magic' },
        { label: 'One Piece', to: '/dashboard#one-piece' },
        { label: 'Yu-Gi-Oh!', to: '/dashboard#yu-gi-oh' },
        { label: 'Lorcana', to: '/dashboard#lorcana' },
        { label: 'Retro-konsoler', to: '/dashboard#consoles' },
        { label: 'Tillbehör', to: '/dashboard#accessories' },
      ],
    },
    {
      title: 'Service',
      links: [
        { label: 'Kontakta oss', to: '/about' },
        { label: 'Frakt & leverans', to: '/about' },
        { label: 'Retur & byten', to: '/about' },
        { label: 'Prislöfte', to: '/about' },
        { label: 'Äkthetsgaranti', to: '/about' },
        { label: 'Förbokning', to: '/dashboard#preorders' },
      ],
    },
    {
      title: 'Företag',
      links: [
        { label: 'Om Spelvalvet', to: '/about' },
        { label: 'Topplistan', to: '/dashboard#best-sellers' },
        { label: 'Recensioner', to: '/dashboard#reviews' },
        { label: 'Jobba hos oss', to: '/jobba-hos-oss' },
        { label: 'Hållbarhet', to: '/about' },
      ],
    },
    {
      title: 'Konto',
      links: [
        { label: 'Logga in', to: '/login' },
        { label: 'Skapa konto', to: '/register' },
        { label: 'Mina ordrar', to: '/orders' },
        { label: 'Mina favoriter', to: '/wishlist' },
        { label: 'Aviseringar', to: '/notifications' },
        { label: 'Presentkort', to: '/about' },
      ],
    },
  ]

  return (
    <footer className="sv-footer">
      <div className="sv-footer-inner">
        <div className="sv-footer-grid">
          {/* Brand column */}
          <div>
            <Link className="sv-footer-brand" to="/dashboard" aria-label="Spelvalvet hem">
              <div className="sv-footer-logo-mark" aria-hidden="true">
                <div className="sv-footer-logo-vault">
                  <div className="sv-footer-logo-dot" />
                </div>
              </div>
              <span className="sv-footer-brand-name">Spelvalvet</span>
            </Link>
            <p className="sv-footer-tagline">"Vi öppnar valvet, du fyller hyllan."</p>
            <p className="sv-footer-legal">
              Spelvalvet AB · Götgatan 24, 116 21 Stockholm · org.nr 559214-9876.
              Vi handlar och säljer trading cards, retro-konsoler och tillbehör sedan 2019.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.title} className="sv-footer-col" aria-label={col.title}>
              <span className="sv-footer-col-title">{col.title}</span>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="sv-footer-bottom">
          <div className="sv-footer-copyright">
            <span>© 2026 Spelvalvet AB</span>
            <a href="#">Integritetspolicy</a>
            <a href="#">Användarvillkor</a>
            <a href="#">Cookies</a>
          </div>
          <div className="sv-footer-payments">
            <span className="sv-pay-label">BETALA TRYGGT</span>
            {['Klarna', 'Swish', 'Visa', 'MC', 'Trustly'].map((p) => (
              <span key={p} className="sv-pay-chip">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
