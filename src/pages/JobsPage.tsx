import AppNavbar from '../components/AppNavbar'
import SiteFooter from '../components/SiteFooter'
import type { AuthUser } from '../types/auth'

type JobsPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function JobsPage({ user, isAdmin, onLogout }: JobsPageProps) {
  return (
    <main className="sv-store sv-jobs-page">
      <AppNavbar user={user} isAdmin={isAdmin} onLogout={onLogout} />

      <section className="sv-jobs-section" aria-labelledby="jobs-title">
        <div className="sv-jobs-brand" aria-label="Spelvalvet">
          <span className="sv-jobs-logo-mark" aria-hidden="true">
            <span className="sv-jobs-logo-vault" />
          </span>
          <span>Spelvalvet</span>
        </div>

        <h1 id="jobs-title">Jobba hos oss</h1>

        <div className="sv-jobs-copy">
          <p>
            Spelvalvet är en växande e-handelsbutik för samlarkort, retrospel och
            konsoler med fokus på Pokémon, Nintendo, Magic: The Gathering och andra
            populära samlarvärldar.
          </p>
          <p>
            Vårt mål är enkelt: att erbjuda ett av Sveriges bästa sortiment kombinerat
            med snabb leverans, ärlig produktinformation och en trygg köpupplevelse.
          </p>
        </div>

        <div className="sv-jobs-divider" aria-hidden="true" />

        <section className="sv-jobs-block" aria-labelledby="open-roles-title">
          <h2 id="open-roles-title">Lediga tjänster</h2>
          <p>Just nu har vi inga lediga tjänster tillgängliga.</p>
        </section>

        <div className="sv-jobs-divider" aria-hidden="true" />

        <section className="sv-jobs-block" aria-labelledby="spontaneous-title">
          <h2 id="spontaneous-title">Spontanansökan</h2>
          <p>Är du intresserad av att jobba med oss men hittar ingen tjänst som passar?</p>
          <p>
            Skicka en spontanansökan till:{' '}
            <a href="mailto:jobb@spelvalvet.se">jobb@spelvalvet.se</a>
          </p>
          <p>Berätta kort om dig själv och varför du vill jobba hos oss.</p>
        </section>
      </section>

      <SiteFooter />
    </main>
  )
}

export default JobsPage
