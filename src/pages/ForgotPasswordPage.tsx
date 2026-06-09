import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authApi'

const FORGOT_PASSWORD_CONFIRMATION =
  'Om kontot finns har ett mail skickats med instruktioner.'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await forgotPassword(email.trim())
      setSuccessMessage(FORGOT_PASSWORD_CONFIRMATION)
    } catch {
      setErrorMessage('Kunde inte skicka återställningsmailet just nu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Glömt lösenord?</h1>
        <p className="subtitle">
          Ange email-adressen för kontot så skickar vi instruktioner om kontot
          finns.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
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

          <button className="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Skickar...' : 'Skicka återställningsmail'}
          </button>
        </form>

        {errorMessage && <p className="feedback error">{errorMessage}</p>}
        {successMessage && <p className="feedback success">{successMessage}</p>}

        <div className="auth-actions">
          <Link className="guest-btn" to="/login">
            Till login
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
