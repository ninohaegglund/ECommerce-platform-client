import SimplePage from './SimplePage'
import type { AuthUser } from '../types/auth'

type TermsPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function TermsPage({ user, isAdmin, onLogout }: TermsPageProps) {
  return (
    <SimplePage
      user={user}
      isAdmin={isAdmin}
      onLogout={onLogout}
      title="Användarvillkor"
      description="Dessa villkor gäller när du använder Spelvalvet och handlar produkter från Spelvalvet AB. Senast uppdaterad: 24 juni 2026."
    >
      <div className="sv-info-grid">
        <div className="sv-info-card">
          <h3>Om Spelvalvet</h3>
          <p>Spelvalvet AB säljer trading cards, retrospel, konsoler och tillbehör via webbutik.</p>
          <p>Org.nr 559214-9876. Adress: Götgatan 24, 116 21 Stockholm.</p>
        </div>
        <div className="sv-info-card">
          <h3>Konto och användning</h3>
          <p>Du ansvarar för att uppgifterna i ditt konto är korrekta och att inloggningsuppgifter hålls säkra.</p>
          <p>Du får inte använda tjänsten på ett sätt som stör butiken, kringgår säkerhet eller bryter mot lag.</p>
        </div>
        <div className="sv-info-card">
          <h3>Beställning och avtal</h3>
          <p>En beställning blir bindande när vi har bekräftat köpet via e-post eller i ordervyn.</p>
          <p>Vi reserverar oss för slutförsäljning, uppenbara prisfel och tekniska fel som påverkar ordern.</p>
        </div>
        <div className="sv-info-card">
          <h3>Priser och betalning</h3>
          <p>Alla priser visas i SEK inklusive moms om inget annat anges.</p>
          <p>Betalning sker via de betalsätt som visas i kassan. Ordern skickas när betalningen är godkänd.</p>
        </div>
        <div className="sv-info-card">
          <h3>Leverans</h3>
          <p>Normal leveranstid är 1-4 arbetsdagar om inget annat anges på produktsidan eller i kassan.</p>
          <p>Du ansvarar för att ange rätt leveransadress och hämta ut paket inom transportörens tidsfrist.</p>
        </div>
        <div className="sv-info-card">
          <h3>Ångerrätt och returer</h3>
          <p>Som konsument har du normalt 14 dagars ångerrätt vid distansköp.</p>
          <p>Om varan har hanterats mer än nödvändigt för att fastställa egenskaper och funktion kan vi göra avdrag för värdeminskning.</p>
        </div>
        <div className="sv-info-card">
          <h3>Reklamation</h3>
          <p>Du kan reklamera en felaktig vara enligt konsumentköplagen. Kontakta oss så snart du upptäcker felet.</p>
          <p>Vid godkänd reklamation hjälper vi dig med reparation, ersättningsvara, prisavdrag eller återbetalning beroende på situation.</p>
        </div>
        <div className="sv-info-card">
          <h3>Samlarkort och skick</h3>
          <p>Skick, bilder och produktbeskrivningar är viktiga för samlarprodukter. Läs produktinformationen noggrant innan köp.</p>
          <p>Graderade produkter säljs enligt den gradering som anges av graderingsbolaget.</p>
        </div>
        <div className="sv-info-card">
          <h3>Tvist och kontakt</h3>
          <p>Kontakta oss först på support@spelvalvet.se om något inte känns rätt, så försöker vi lösa ärendet snabbt.</p>
          <p>Om vi inte kommer överens kan du vända dig till Allmänna reklamationsnämnden.</p>
        </div>
      </div>
    </SimplePage>
  )
}

export default TermsPage
