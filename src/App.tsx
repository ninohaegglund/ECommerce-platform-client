import { useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { NotificationCenterProvider } from './context/notificationCenter'
import AuthPage from './pages/AuthPage'
import AdminPage from './pages/AdminPage'
import AllProductsPage from './pages/AllProductsPage'
import AboutPage from './pages/AboutPage'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import DashboardPage from './pages/DashboardPage'
import JobsPage from './pages/JobsPage'
import StripeCheckoutPage from './pages/StripeCheckoutPage'
import NotificationsPage from './pages/NotificationsPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrdersPage from './pages/OrdersPage'
import ProductDetailPage from './pages/ProductDetailPage'
import WishlistPage from './pages/WishlistPage'
import SimplePage from './pages/SimplePage'
import CheckEmailPage from './pages/CheckEmailPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import type {
  AuthUser,
  AuthMode,
  AuthSubmitResult,
  LoginPayload,
  RegisterPayload,
} from './types/auth'
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './utils/authStorage'
import {
  login,
  register,
  resendEmailVerification,
} from './services/authApi'

const GUEST_SESSION_KEY = 'guestModeEnabled'
const UNVERIFIED_EMAIL_BACKEND_MESSAGE = 'Email address has not been verified.'
const RESEND_VERIFICATION_CONFIRMATION =
  'Om kontot finns och inte är verifierat har ett nytt mail skickats.'

const GUEST_USER: AuthUser = {
  id: 'guest',
  firstName: 'Guest',
  lastName: 'User',
  email: 'guest@novacart.local',
  roles: [],
}

function App() {
  const initialAuth = getStoredAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authToken, setAuthToken] = useState(initialAuth.token)
  const [authUser, setAuthUser] = useState(initialAuth.user)
  const [authExpiresAt, setAuthExpiresAt] = useState(initialAuth.expiresAt)
  const [isGuestMode, setIsGuestMode] = useState(
    () =>
      sessionStorage.getItem(GUEST_SESSION_KEY) === '1' || !initialAuth.token,
  )

  const isAuthenticated = Boolean(authToken && authUser)
  const canAccessStore = Boolean(isAuthenticated || isGuestMode)
  const activeUser = authUser ?? (isGuestMode ? GUEST_USER : null)
  const isAdmin = Boolean(
    authUser?.roles?.some((role) => role.toLowerCase() === 'admin'),
  )

  const handleContinueAsGuest = () => {
    clearStoredAuth()
    setAuthToken('')
    setAuthUser(null)
    setAuthExpiresAt('')
    setIsGuestMode(true)
    sessionStorage.setItem(GUEST_SESSION_KEY, '1')
  }

  const handleLogout = () => {
    clearStoredAuth()
    setAuthToken('')
    setAuthUser(null)
    setAuthExpiresAt('')
    setIsGuestMode(false)
    sessionStorage.removeItem(GUEST_SESSION_KEY)
  }

  const handleSubmit = async (
    mode: AuthMode,
    payload: LoginPayload | RegisterPayload,
    rememberMe: boolean,
  ): Promise<AuthSubmitResult> => {
    setIsLoading(true)

    try {
      if (mode === 'register') {
        const registerData = await register(payload as RegisterPayload)
        return {
          ok: true,
          message:
            'Kontot är skapat. Kontrollera din inkorg och verifiera din email innan du loggar in.',
          email: registerData.user.email,
          emailVerificationRequired: registerData.emailVerificationRequired,
        }
      }

      const authData = await login(payload as LoginPayload)
      setStoredAuth(authData.token, authData.user, authData.expiresAt, rememberMe)

      setIsGuestMode(false)
      sessionStorage.removeItem(GUEST_SESSION_KEY)

      setAuthToken(authData.token)
      setAuthUser(authData.user)
      setAuthExpiresAt(authData.expiresAt)

      return {
        ok: true,
        message: `Welcome back, ${authData.user.firstName}!`,
      }
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : ''
      const isUnverifiedEmail =
        rawMessage === UNVERIFIED_EMAIL_BACKEND_MESSAGE ||
        rawMessage.toLowerCase().includes('not been verified')

      return {
        ok: false,
        email: payload.email,
        isUnverifiedEmail,
        message: isUnverifiedEmail
          ? 'Du behöver verifiera din email innan du kan logga in.'
          : rawMessage || 'Could not reach identity service. Check API URL/CORS.',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async (
    email: string,
  ): Promise<AuthSubmitResult> => {
    try {
      await resendEmailVerification(email)
      return {
        ok: true,
        message: RESEND_VERIFICATION_CONFIRMATION,
        email,
      }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Kunde inte skicka verifieringsmailet just nu.',
        email,
      }
    }
  }

  return (
    <NotificationCenterProvider userId={activeUser?.id ?? ''}>
      <Routes>
      <Route
        path="/"
        element={<Navigate to={canAccessStore ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="/login"
        element={
          <AuthPage
            mode="login"
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onResendVerification={handleResendVerification}
            onContinueAsGuest={handleContinueAsGuest}
          />
        }
      />
      <Route
        path="/register"
        element={
          <AuthPage
            mode="register"
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        }
      />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/dashboard"
        element={
          canAccessStore && activeUser ? (
            <DashboardPage
              user={activeUser}
              isAdmin={isAdmin}
              token={authToken}
              expiresAt={authExpiresAt}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/produkter"
        element={
          canAccessStore && activeUser ? (
            <AllProductsPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/products/:productId"
        element={
          canAccessStore && activeUser ? (
            <ProductDetailPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/cart"
        element={
          canAccessStore && activeUser ? (
            <CartPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/checkout"
        element={
          canAccessStore && activeUser ? (
            <CheckoutPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/checkout/payment"
        element={
          canAccessStore && activeUser ? (
            <StripeCheckoutPage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/checkout/payment-simulation"
        element={
          canAccessStore && activeUser ? (
            <StripeCheckoutPage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/notifications"
        element={
          canAccessStore && activeUser ? (
            <NotificationsPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/order-success"
        element={
          canAccessStore && activeUser ? (
            <OrderSuccessPage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={
          isAuthenticated && authUser ? (
            isAdmin ? (
              <AdminPage user={authUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/orders"
        element={
          canAccessStore && activeUser ? (
            <OrdersPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/wishlist"
        element={
          canAccessStore && activeUser ? (
            <WishlistPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/account"
        element={
          canAccessStore && activeUser ? (
            <SimplePage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Kontoinställningar"
              description="Hantera din e-postadress, leveransadress och lösenord. Här kan du också se din köphistorik och aktiva prenumerationer."
            >
              <div className="sv-info-grid">
                <div className="sv-info-card">
                  <h3>Kontouppgifter</h3>
                  <p>{activeUser.firstName} {activeUser.lastName}</p>
                  <p>{activeUser.email}</p>
                </div>
                <div className="sv-info-card">
                  <h3>Leveransadress</h3>
                  <p>Hantera din standardadress vid kassan så går det snabbare nästa gång.</p>
                </div>
                <div className="sv-info-card">
                  <h3>Lösenord</h3>
                  <p>Byt lösenord regelbundet för att hålla kontot säkert.</p>
                </div>
                <div className="sv-info-card">
                  <h3>Köphistorik</h3>
                  <p><Link to="/orders">Visa dina beställningar</Link></p>
                </div>
                <div className="sv-info-card">
                  <h3>Aviseringar</h3>
                  <p><Link to="/notifications">Öppna aviseringscenter</Link></p>
                </div>
                <div className="sv-info-card">
                  <h3>Prenumerationer</h3>
                  <p>Inga aktiva prenumerationer just nu.</p>
                </div>
              </div>
            </SimplePage>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/about"
        element={
          canAccessStore && activeUser ? (
            <AboutPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/jobba-hos-oss"
        element={
          <JobsPage
            user={activeUser ?? GUEST_USER}
            isAdmin={isAdmin}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/pokemon-kort"
        element={
          canAccessStore && activeUser ? (
            <CategoryPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} category="pokemon-kort" />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/spel"
        element={
          canAccessStore && activeUser ? (
            <CategoryPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} category="spel" />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/konsoler"
        element={
          canAccessStore && activeUser ? (
            <CategoryPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} category="konsoler" />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/refurbished"
        element={
          canAccessStore && activeUser ? (
            <CategoryPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} category="refurbished" />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/erbjudanden"
        element={
          canAccessStore && activeUser ? (
            <SimplePage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Erbjudanden"
              description="Veckans bästa deals på Pokémon-kort, spel och konsoler — uppdateras varje måndag. Missa inte dagens fynd och tidsbegränsade reapriser."
            >
              <div className="sv-empty-state">
                <svg
                  className="sv-empty-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <h2>Inga aktiva erbjudanden just nu</h2>
                <p>Veckans deals uppdateras varje måndag — kom tillbaka snart för att fynda Pokémon-kort, spel och refurbished konsoler.</p>
                <div className="sv-empty-actions">
                  <Link className="sv-btn-primary" to="/dashboard">Till butiken</Link>
                  <Link className="sv-btn-ghost" to="/refurbished">Refurbished</Link>
                </div>
              </div>
            </SimplePage>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/support"
        element={
          canAccessStore && activeUser ? (
            <SimplePage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Support"
              description="Frågor om din order, retur eller produkt? Kontakta oss på support@spelvalvet.se eller via chatten nedan. Vi svarar inom 24 timmar på vardagar."
            >
              <div className="sv-info-grid">
                <div className="sv-info-card">
                  <h3>Kontakt</h3>
                  <p>support@spelvalvet.se</p>
                  <p>Mån–Fre 09–17</p>
                </div>
                <div className="sv-info-card">
                  <h3>Returer & byten</h3>
                  <p>30 dagars öppet köp på alla produkter. Skicka tillbaka i originalförpackning så hanterar vi resten.</p>
                </div>
                <div className="sv-info-card">
                  <h3>Frakt & leverans</h3>
                  <p>Fri frakt över 499 kr. Standardleverans 1–3 arbetsdagar med spårning.</p>
                </div>
                <div className="sv-info-card">
                  <h3>Äkthetsgaranti</h3>
                  <p>Alla Pokémon-kort kontrolleras av våra experter. Refurbished konsoler har 90 dagars garanti.</p>
                </div>
                <div className="sv-info-card">
                  <h3>Hur spårar jag min order?</h3>
                  <p>Logga in och gå till <Link to="/orders">Mina beställningar</Link> för att se status och spårningsnummer.</p>
                </div>
                <div className="sv-info-card">
                  <h3>Kan jag ändra min beställning?</h3>
                  <p>Kontakta oss inom 1 timme efter köp så hjälper vi dig så långt det är möjligt innan paketet skickas.</p>
                </div>
              </div>
            </SimplePage>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/:categorySlug"
        element={
          canAccessStore && activeUser ? (
            <CategoryPage user={activeUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationCenterProvider>
  )
}

export default App
