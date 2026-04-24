import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage'
import AdminPage from './pages/AdminPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import DashboardPage from './pages/DashboardPage'
import MockStripeCheckoutPage from './pages/MockStripeCheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrdersPage from './pages/OrdersPage'
import SimplePage from './pages/SimplePage'
import type {
  AuthMode,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from './types/auth'
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './utils/authStorage'

const API_BASE_URL =
  import.meta.env.VITE_IDENTITY_API_URL ?? 'https://localhost:5001/api/auth'

function App() {
  const initialAuth = getStoredAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authToken, setAuthToken] = useState(initialAuth.token)
  const [authUser, setAuthUser] = useState(initialAuth.user)
  const [authExpiresAt, setAuthExpiresAt] = useState(initialAuth.expiresAt)

  const isAuthenticated = Boolean(authToken && authUser)
  const isAdmin = Boolean(
    authUser?.roles?.some((role) => role.toLowerCase() === 'admin'),
  )

  const handleLogout = () => {
    clearStoredAuth()
    setAuthToken('')
    setAuthUser(null)
    setAuthExpiresAt('')
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
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage
              mode="login"
              endpoint={loginEndpoint}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
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
          isAuthenticated && authUser ? (
            <DashboardPage
              user={authUser}
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
        path="/cart"
        element={
          isAuthenticated && authUser ? (
            <CartPage user={authUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/checkout"
        element={
          isAuthenticated && authUser ? (
            <CheckoutPage user={authUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/checkout/payment-simulation"
        element={
          isAuthenticated && authUser ? (
            <MockStripeCheckoutPage user={authUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/order-success"
        element={
          isAuthenticated ? <OrderSuccessPage /> : <Navigate to="/login" replace />
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
          isAuthenticated && authUser ? (
            <OrdersPage user={authUser} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/wishlist"
        element={
          isAuthenticated && authUser ? (
            <SimplePage
              user={authUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Your Wishlist"
              description="This is a simple placeholder page for saved products."
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/account"
        element={
          isAuthenticated && authUser ? (
            <SimplePage
              user={authUser}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              title="Account Settings"
              description="This is a simple placeholder page for profile details and preferences."
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
