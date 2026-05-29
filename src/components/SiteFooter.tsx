import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_PREFERENCES_KEY = 'spelvalvetCookiePreferences'

type CookiePreferenceKey = 'necessary' | 'analytics' | 'marketing' | 'personalization'
type EditableCookiePreferenceKey = Exclude<CookiePreferenceKey, 'necessary'>

type CookiePreferences = Record<CookiePreferenceKey, boolean>

const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
}

const COOKIE_OPTIONS: Array<{
  key: CookiePreferenceKey
  title: string
  description: string
  required?: boolean
}> = [
  {
    key: 'necessary',
    title: 'Nödvändiga cookies',
    description: 'Behövs för varukorg, inloggning, kassa och säkerhet. De går inte att stänga av.',
    required: true,
  },
  {
    key: 'analytics',
    title: 'Analyscookies',
    description: 'Hjälper oss förstå hur butiken används så vi kan förbättra sortiment, sidor och flöden.',
  },
  {
    key: 'marketing',
    title: 'Marknadsföringscookies',
    description: 'Gör att vi kan visa relevanta erbjudanden och mäta kampanjer i våra annonskanaler.',
  },
  {
    key: 'personalization',
    title: 'Personalisering',
    description: 'Sparar val som gör butiken mer personlig, till exempel rekommendationer och visningsläge.',
  },
]

function readCookiePreferences() {
  try {
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)

    if (!storedPreferences) {
      return DEFAULT_COOKIE_PREFERENCES
    }

    const parsedPreferences = JSON.parse(storedPreferences) as Partial<CookiePreferences>

    return {
      necessary: true,
      analytics: Boolean(parsedPreferences.analytics),
      marketing: Boolean(parsedPreferences.marketing),
      personalization: Boolean(parsedPreferences.personalization),
    }
  } catch {
    return DEFAULT_COOKIE_PREFERENCES
  }
}

function hasStoredCookiePreferences() {
  try {
    return Boolean(localStorage.getItem(COOKIE_PREFERENCES_KEY))
  } catch {
    return false
  }
}

function SiteFooter() {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(
    () => !hasStoredCookiePreferences(),
  )
  const [preferences, setPreferences] = useState<CookiePreferences>(() => readCookiePreferences())
  const [hasSavedPreferences, setHasSavedPreferences] = useState(() =>
    hasStoredCookiePreferences(),
  )
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const cookieDialogRef = useRef<HTMLDivElement>(null)

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
  ]

  useEffect(() => {
    if (!isCookieModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCookieModalOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    cookieDialogRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCookieModalOpen])

  const openCookieModal = () => {
    setPreferences(readCookiePreferences())
    setIsCookieModalOpen(true)
  }

  const updatePreference = (key: EditableCookiePreferenceKey, value: boolean) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }))
  }

  const savePreferences = (nextPreferences: CookiePreferences) => {
    const preferencesToSave = {
      ...nextPreferences,
      necessary: true,
      savedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferencesToSave))
    } catch {
      // Consent should still apply in-memory if storage is unavailable.
    }
    window.dispatchEvent(
      new CustomEvent('spelvalvet-cookie-preferences-changed', {
        detail: preferencesToSave,
      }),
    )
    setPreferences({
      necessary: true,
      analytics: nextPreferences.analytics,
      marketing: nextPreferences.marketing,
      personalization: nextPreferences.personalization,
    })
    setHasSavedPreferences(true)
    setIsCookieModalOpen(false)
  }

  const saveSelectedPreferences = () => {
    savePreferences(preferences)
  }

  const allowAllCookies = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    })
  }

  const allowNecessaryCookies = () => {
    savePreferences(DEFAULT_COOKIE_PREFERENCES)
  }

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newsletterEmail.trim()) {
      setNewsletterMessage('Fyll i din e-postadress först.')
      return
    }

    setNewsletterEmail('')
    setNewsletterMessage('Tack! Du är uppskriven på nyhetsbrevet.')
  }

  return (
    <footer className="sv-footer">
      <div className="sv-footer-inner">
        <div className="sv-footer-grid">
          {/* Brand column */}
          <div className="sv-footer-company">
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

          <nav className="sv-footer-mobile-links" aria-label="Footer navigation">
            {columns.map((col) => (
              <details key={col.title} className="sv-footer-mobile-group">
                <summary>{col.title}</summary>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </nav>

          <div className="sv-footer-newsletter">
            <span className="sv-footer-col-title">Nyhetsbrev</span>
            <h3>Spelvalvets nyhetsbrev</h3>
            <p>Få nya släpp, kampanjer och samlartips direkt i inkorgen.</p>
            <form className="sv-footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
              <label className="sr-only" htmlFor="footer-newsletter-email">
                E-postadress
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value)
                  setNewsletterMessage('')
                }}
                aria-describedby={
                  newsletterMessage ? 'footer-newsletter-message' : undefined
                }
              />
              <button type="submit">Skriv upp mig!</button>
            </form>
            {newsletterMessage && (
              <p className="sv-footer-newsletter-message" id="footer-newsletter-message" role="status">
                {newsletterMessage}
              </p>
            )}
          </div>
        </div>

        <div className="sv-footer-bottom">
          <div className="sv-footer-copyright">
            <span>© 2026 Spelvalvet AB</span>
            <a href="#">Integritetspolicy</a>
            <a href="#">Användarvillkor</a>
            <button className="sv-footer-link" type="button" onClick={openCookieModal}>
              Cookies
            </button>
          </div>
          <div className="sv-footer-payments">
            <span className="sv-pay-label">BETALA TRYGGT</span>
            {['Klarna', 'Swish', 'Visa', 'MC', 'Trustly'].map((p) => (
              <span key={p} className="sv-pay-chip">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {isCookieModalOpen && (
        <div
          className="sv-cookie-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCookieModalOpen(false)
            }
          }}
        >
          <div
            className="sv-cookie-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            tabIndex={-1}
            ref={cookieDialogRef}
          >
            <div className="sv-cookie-header">
              <div>
                <span className="sv-cookie-kicker">Cookieinställningar</span>
                <h2 id="cookie-preferences-title">Välj cookies för Spelvalvet</h2>
              </div>
              <button
                className="sv-cookie-close"
                type="button"
                onClick={() => setIsCookieModalOpen(false)}
                aria-label="Stäng cookieinställningar"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <p className="sv-cookie-intro">
              Vi använder cookies för att butiken ska fungera och, om du godkänner det,
              för analys, marknadsföring och personliga rekommendationer.
            </p>

            <p className="sv-cookie-status" aria-live="polite">
              {hasSavedPreferences
                ? 'Du har redan sparade cookieval. Ändra dem och spara igen om du vill.'
                : 'Inga cookieval är sparade ännu.'}
            </p>

            <div className="sv-cookie-options">
              {COOKIE_OPTIONS.map((option) => {
                const isEditable = !option.required

                return (
                  <label
                    className={`sv-cookie-option${option.required ? ' required' : ''}`}
                    key={option.key}
                  >
                    <input
                      type="checkbox"
                      checked={preferences[option.key]}
                      disabled={!isEditable}
                      onChange={(event) => {
                        if (isEditable) {
                          updatePreference(
                            option.key as EditableCookiePreferenceKey,
                            event.target.checked,
                          )
                        }
                      }}
                    />
                    <span className="sv-cookie-option-copy">
                      <span className="sv-cookie-option-title">
                        {option.title}
                        {option.required && <span>Alltid aktiv</span>}
                      </span>
                      <span className="sv-cookie-option-description">{option.description}</span>
                    </span>
                    <span className="sv-cookie-toggle" aria-hidden="true">
                      <span />
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="sv-cookie-actions">
              <button className="sv-cookie-secondary" type="button" onClick={allowNecessaryCookies}>
                Endast nödvändiga
              </button>
              <button className="sv-cookie-secondary" type="button" onClick={allowAllCookies}>
                Tillåt alla
              </button>
              <button className="sv-cookie-primary" type="button" onClick={saveSelectedPreferences}>
                Spara val
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default SiteFooter
