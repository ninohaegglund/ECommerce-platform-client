import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authApi'

function getResetPasswordErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('invalid') ||
    normalizedMessage.includes('expired')
  ) {
    return 'Återställningslänken är ogiltig eller har gått ut.'
  }

  return message || 'Kunde inte återställa lösenordet just nu.'
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams])
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])
  const hasMissingParams = !email || !token

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(
    hasMissingParams ? 'Återställningslänken saknar email eller token.' : '',
  )
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (hasMissingParams) {
      setErrorMessage('Återställningslänken saknar email eller token.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Lösenorden matchar inte.')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({
        email,
        token,
        newPassword,
        confirmPassword,
      })
      setNewPassword('')
      setConfirmPassword('')
      setSuccessMessage('Lösenordet är återställt. Du kan nu logga in.')
    } catch (error) {
      setErrorMessage(getResetPasswordErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Återställ lösenord</h1>
        <p className="subtitle">
          Ange ett nytt lösenord för {email || 'kontot'}.
        </p>

        {!successMessage && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Nytt lösenord
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={hasMissingParams || isSubmitting}
              />
            </label>

            <label>
              Bekräfta nytt lösenord
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={hasMissingParams || isSubmitting}
              />
            </label>

            <button
              className="submit-btn"
              type="submit"
              disabled={hasMissingParams || isSubmitting}
            >
              {isSubmitting ? 'Sparar...' : 'Spara nytt lösenord'}
            </button>
          </form>
        )}

        {errorMessage && <p className="feedback error">{errorMessage}</p>}
        {successMessage && <p className="feedback success">{successMessage}</p>}

        <div className="auth-actions">
          <Link className={successMessage ? 'submit-btn' : 'guest-btn'} to="/login">
            Till login
          </Link>
          {hasMissingParams && (
            <Link className="guest-btn" to="/forgot-password">
              Begär ny länk
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

export default ResetPasswordPage
