import SimplePage from './SimplePage'
import type { AuthUser } from '../types/auth'

type PrivacyPolicyPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function PrivacyPolicyPage({ user, isAdmin, onLogout }: PrivacyPolicyPageProps) {
  return (
    <SimplePage
      user={user}
      isAdmin={isAdmin}
      onLogout={onLogout}
      title="Integritetspolicy"
      description="Här beskriver vi hur Spelvalvet AB samlar in, använder och skyddar personuppgifter när du handlar, skapar konto, kontaktar oss eller använder våra digitala tjänster. Senast uppdaterad: 24 juni 2026."
    >
      <div className="sv-info-grid">
        <div className="sv-info-card">
          <h3>Personuppgiftsansvarig</h3>
          <p>Spelvalvet AB, org.nr 559214-9876, är personuppgiftsansvarig.</p>
          <p>Adress: Götgatan 24, 116 21 Stockholm.</p>
          <p>Kontakt: integritet@spelvalvet.se.</p>
        </div>
        <div className="sv-info-card">
          <h3>Uppgifter vi behandlar</h3>
          <p>Vi behandlar uppgifter som namn, e-post, adress, telefonnummer, orderhistorik, kundserviceärenden och kontoinställningar.</p>
          <p>Vid betalning hanteras betalningsuppgifter av vår betalpartner. Vi sparar inte fullständiga kortnummer.</p>
        </div>
        <div className="sv-info-card">
          <h3>Varför vi använder uppgifter</h3>
          <p>Vi använder personuppgifter för att hantera köp, leverans, returer, reklamationer, kundkonto, support och säkerhet.</p>
          <p>Med ditt samtycke kan vi även skicka nyhetsbrev och använda valbara cookies för analys, marknadsföring och personalisering.</p>
        </div>
        <div className="sv-info-card">
          <h3>Rättslig grund</h3>
          <p>Behandlingen sker när den behövs för avtal, rättsliga skyldigheter, berättigat intresse eller samtycke.</p>
          <p>Du kan när som helst återkalla samtycke för nyhetsbrev och valbara cookies.</p>
        </div>
        <div className="sv-info-card">
          <h3>Delning med andra</h3>
          <p>Vi delar bara uppgifter när det behövs med exempelvis betalningsleverantörer, fraktbolag, e-postleverantörer, IT-drift och myndigheter.</p>
          <p>Våra leverantörer får endast använda uppgifterna enligt våra instruktioner och gällande dataskyddsregler.</p>
        </div>
        <div className="sv-info-card">
          <h3>Lagringstid</h3>
          <p>Order- och bokföringsuppgifter sparas så länge lagen kräver. Kundkonto sparas tills kontot avslutas eller uppgifterna inte längre behövs.</p>
          <p>Supportärenden sparas normalt i upp till 24 månader och nyhetsbrev sparas tills du avslutar prenumerationen.</p>
        </div>
        <div className="sv-info-card">
          <h3>Dina rättigheter</h3>
          <p>Du kan begära tillgång, rättelse, radering, begränsning, dataportabilitet och invända mot viss behandling.</p>
          <p>Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten.</p>
        </div>
        <div className="sv-info-card">
          <h3>Cookies</h3>
          <p>Nödvändiga cookies används för att butiken ska fungera, till exempel varukorg, inloggning och säkerhet.</p>
          <p>Valbara cookies används bara om du tillåter dem i cookieinställningarna i sidfoten.</p>
        </div>
      </div>
    </SimplePage>
  )
}

export default PrivacyPolicyPage
