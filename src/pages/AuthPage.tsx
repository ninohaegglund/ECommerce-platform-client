import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthMode, LoginPayload, RegisterPayload } from '../types/auth'

type AuthPageProps = {
  mode: AuthMode
  endpoint: string
  isLoading: boolean
  onSubmit: (
    mode: AuthMode,
    payload: LoginPayload | RegisterPayload,
  ) => Promise<{ ok: boolean; message: string }>
}

function AuthPage({ mode, endpoint, isLoading, onSubmit }: AuthPageProps) {
  const navigate = useNavigate()

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const isRegister = mode === 'register'

  const title = useMemo(
    () => (isRegister ? 'Create account' : 'Sign in'),
    [isRegister],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const payload = isRegister
      ? {
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
        }
      : {
          email,
          password,
        }

    const result = await onSubmit(mode, payload)

    if (!result.ok) {
      setErrorMessage(result.message)
      return
    }

    setSuccessMessage(result.message)
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Identity Service Connection</p>
        <h1>{title}</h1>
        <p className="subtitle">
          Endpoint: <span>{endpoint}</span>
        </p>

        <div className="mode-switch" role="tablist" aria-label="Auth mode">
          <Link className={!isRegister ? 'active' : ''} to="/login" replace>
            Sign in
          </Link>
          <Link className={isRegister ? 'active' : ''} to="/register" replace>
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <label>
                First Name
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </label>
              <label>
                Last Name
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
            Password
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
              Confirm Password
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          )}

          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {errorMessage && <p className="feedback error">{errorMessage}</p>}
        {successMessage && <p className="feedback success">{successMessage}</p>}

      </section>
    </main>
  )
}

export default AuthPage
