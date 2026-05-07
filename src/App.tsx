import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { NotificationCenterProvider } from './context/notificationCenter'
import AuthPage from './pages/AuthPage'
import AdminPage from './pages/AdminPage'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import DashboardPage from './pages/DashboardPage'
import MockStripeCheckoutPage from './pages/MockStripeCheckoutPage'
import NotificationsPage from './pages/NotificationsPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrdersPage from './pages/OrdersPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SimplePage from './pages/SimplePage'
import type {
  AuthUser,
  AuthMode,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from './types/auth'
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './utils/authStorage'

const API_BASE_URL =
  import.meta.env.VITE_IDENTITY_API_URL ?? 'https://localhost:5001/api/auth'
const WELCOME_NOTIFICATION_FLAG_KEY = 'pendingWelcomeNotificationUserId'
const GUEST_SESSION_KEY = 'guestModeEnabled'

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
  ): Promise<{ ok: boolean; message: string }> => {
    setIsLoading(true)

    const endpoint = `${API_BASE_URL}/${mode === 'login' ? 'login' : 'register'}`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as AuthResponse | { message?: string }

      if (!response.ok) {
        const message =
          'message' in data && typeof data.message === 'string'
            ? data.message
            : 'Authentication failed.'
        return { ok: false, message }
      }

      const authData = data as AuthResponse
      setStoredAuth(authData.token, authData.user, authData.expiresAt, rememberMe)

      if (mode === 'register') {
        sessionStorage.setItem(WELCOME_NOTIFICATION_FLAG_KEY, authData.user.id)
      }

      setIsGuestMode(false)
      sessionStorage.removeItem(GUEST_SESSION_KEY)

      setAuthToken(authData.token)
      setAuthUser(authData.user)
      setAuthExpiresAt(authData.expiresAt)

      const message =
        mode === 'login'
          ? `Welcome back, ${authData.user.firstName}!`
          : 'Registration successful. You are now signed in.'
      return { ok: true, message }
    } catch {
      return {
        ok: false,
        message: 'Could not reach identity service. Check API URL/CORS.',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loginEndpoint = useMemo(() => `${API_BASE_URL}/login`, [])
  const registerEndpoint = useMemo(() => `${API_BASE_URL}/register`, [])

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
          canAccessStore ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage
              mode="login"
              endpoint={loginEndpoint}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onContinueAsGuest={handleContinueAsGuest}
            />
          )
        }
      />
      <Route
        path="/register"
        element={
          canAccessStore ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage
              mode="register"
              endpoint={registerEndpoint}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
          )
        }
      />
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
        path="/checkout/payment-simulation"
        element={
          canAccessStore && activeUser ? (
            <MockStripeCheckoutPage user={activeUser} />
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
          canAccessStore ? <OrderSuccessPage /> : <Navigate to="/login" replace />
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
            <SimplePage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Önskelista"
              description="Spara Pokémon-kort, spel och konsoler du vill ha — så hittar du dem snabbt nästa gång du besöker butiken."
            />
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
              description="Hantera din e-postadress, leveransadress och lösenord. Här kan du också se dina köphistorik och aktiva prenumerationer."
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/about"
        element={
          canAccessStore && activeUser ? (
            <SimplePage
              user={activeUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Om Spelvalvet"
              description="Vi säljer Pokémon-kort, spel, konsoler och refurbished klassiker — nya och gamla. Alla produkter kontrolleras av oss innan de skickas, och vi erbjuder 14 dagars prislöfte och 90 dagars garanti på refurbished konsoler."
            />
          ) : (
            <Navigate to="/login" replace />
          )
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
            />
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
            />
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
