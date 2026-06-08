import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { subscribeToNewsletter } from '../services/newsletterApi'
import type {
  AuthMode,
  AuthSubmitResult,
  LoginPayload,
  RegisterPayload,
} from '../types/auth'

type AuthPageProps = {
  mode: AuthMode
  isLoading: boolean
  onContinueAsGuest?: () => void
  onSubmit: (
    mode: AuthMode,
    payload: LoginPayload | RegisterPayload,
    rememberMe: boolean,
  ) => Promise<AuthSubmitResult>
  onResendVerification?: (email: string) => Promise<AuthSubmitResult>
}

function AuthPage({
  mode,
  isLoading,
  onContinueAsGuest,
  onSubmit,
  onResendVerification,
}: AuthPageProps) {
  const navigate = useNavigate()

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [canResendVerification, setCanResendVerification] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)

  const isRegister = mode === 'register'

  const title = useMemo(
    () => (isRegister ? 'Skapa konto' : 'Logga in'),
    [isRegister],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setResendMessage('')
    setCanResendVerification(false)

    const trimmedEmail = email.trim()

    const payload = isRegister
      ? {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: trimmedEmail,
          password,
          confirmPassword,
        }
      : {
          email: trimmedEmail,
          password,
        }

    const result = await onSubmit(mode, payload, isRegister ? true : rememberMe)

    if (!result.ok) {
      setErrorMessage(result.message)
      setCanResendVerification(Boolean(result.isUnverifiedEmail))
      return
    }

    if (isRegister && newsletterOptIn) {
      void subscribeToNewsletter({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }).catch(() => {
        console.warn('Newsletter subscription failed after successful registration.')
      })
    }

    setSuccessMessage(result.message)

    if (isRegister) {
      navigate(
        `/check-email?email=${encodeURIComponent(result.email ?? trimmedEmail)}`,
        {
          replace: true,
          state: { message: result.message },
        },
      )
      return
    }

    navigate('/dashboard', { replace: true })
  }

  const handleResendVerification = async () => {
    if (!onResendVerification) {
      return
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage('Fyll i din email-adress först.')
      return
    }

    setIsResendingVerification(true)
    setErrorMessage('')
    setResendMessage('')

    try {
      const result = await onResendVerification(trimmedEmail)
      if (result.ok) {
        setResendMessage(result.message)
      } else {
        setErrorMessage(result.message)
      }
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{title}</h1>
      

        <div className="mode-switch" role="tablist" aria-label="Auth mode">
          <Link className={!isRegister ? 'active' : ''} to="/login" replace>
            Logga in
          </Link>
          <Link className={isRegister ? 'active' : ''} to="/register" replace>
            Skapa konto
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <label>
                Förnamn
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </label>
              <label>
                Efternamn
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Lösenord
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {isRegister && (
            <label>
              Bekräfta lösenord
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          )}

          {isRegister && (
            <label className="remember-row">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                className="remember-check"
              />
              Jag vill få nyheter och erbjudanden via mail
            </label>
          )}

          {!isRegister && (
            <div className="auth-form-footer">
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="remember-check"
                />
                Kom ihåg mig
              </label>
              <Link className="auth-inline-link" to="/forgot-password">
                Glömt lösenord?
              </Link>
            </div>
          )}

          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : isRegister ? 'Skapa konto' : 'Logga in'}
          </button>

          {!isRegister && onContinueAsGuest && (
            <button
              className="guest-btn"
              type="button"
              onClick={() => {
                setErrorMessage('')
                setSuccessMessage('')
                onContinueAsGuest()
                navigate('/dashboard', { replace: true })
              }}
            >
              Fortsätt som gäst
            </button>
          )}
        </form>

        {errorMessage && <p className="feedback error">{errorMessage}</p>}
        {canResendVerification && onResendVerification && (
          <button
            className="guest-btn auth-resend-btn"
            type="button"
            onClick={handleResendVerification}
            disabled={isResendingVerification || isLoading}
          >
            {isResendingVerification ? 'Skickar...' : 'Skicka verifieringsmail igen'}
          </button>
        )}
        {resendMessage && <p className="feedback success">{resendMessage}</p>}
        {successMessage && <p className="feedback success">{successMessage}</p>}

      </section>
    </main>
  )
}

export default AuthPage
