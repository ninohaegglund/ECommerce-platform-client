import SimplePage from './SimplePage'
import type { AuthUser } from '../types/auth'

type AboutPageProps = {
  user: AuthUser
  isAdmin: boolean
  onLogout: () => void
}

function AboutPage({ user, isAdmin, onLogout }: AboutPageProps) {
  return (
    <SimplePage
      user={user}
      isAdmin={isAdmin}
      onLogout={onLogout}
      title="Om Spelvalvet"
      description="Spelvalvet är skapat av Max, Elias och Nino, tre livslånga samlare som ville skapa en trygg plats för Pokémon-kort och retrospel. Vi började som en liten byteskväll 2018 och växte till en butik med fokus på äkthet, kvalitet och community."
    >
      <div className="sv-info-grid">
        <div className="sv-info-card">
          <h3>Ägarna</h3>
          <p>Max leder inköp och kurering av TCG-sortimentet.</p>
          <p>Elias ansvarar för community, events och lanseringar.</p>
          <p>Nino leder verkstaden och refurb-processen för konsoler.</p>
        </div>
        <div className="sv-info-card">
          <h3>Så startade vi</h3>
          <p>Allt började i en källare i Hornstull med en månadlig byteskväll.</p>
          <p>2019 öppnade vi webbutiken för att göra hobbyloppet nationellt.</p>
        </div>
        <div className="sv-info-card">
          <h3>Vår metod</h3>
          <p>Varje kort fotograferas, granskas och registreras innan det läggs ut.</p>
          <p>Konsoler stresstestas i tre steg med uppdaterad firmware och nya slitdelar.</p>
        </div>
        <div className="sv-info-card">
          <h3>Äkthetslöftet</h3>
          <p>Vi dubbelkollar samtliga TCG-kort och sparar inspektionsprotokoll.</p>
          <p>Refurbished konsoler levereras med 90 dagars garanti.</p>
        </div>
        <div className="sv-info-card">
          <h3>Community först</h3>
          <p>Vi arrangerar turneringar, bytarkvällar och lanseringar i Stockholm.</p>
          <p>Vill du gå med? Vi tipsar i vårt nyhetsbrev varje vecka.</p>
        </div>
        <div className="sv-info-card">
          <h3>Besök oss</h3>
          <p>Götgatan 24, 116 21 Stockholm.</p>
          <p>Butik & kundservice: Mån · Fre 10 · 18.</p>
        </div>
      </div>
    </SimplePage>
  )
}

export default AboutPage
