import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { resendEmailVerification } from '../services/authApi'

type CheckEmailLocationState = {
  message?: string
}

const RESEND_VERIFICATION_CONFIRMATION =
  'Om kontot finns och inte är verifierat har ett nytt mail skickats.'

function CheckEmailPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const state = location.state as CheckEmailLocationState | null
  const email = searchParams.get('email')?.trim() ?? ''

  const [feedbackMessage, setFeedbackMessage] = useState(state?.message ?? '')
  const [errorMessage, setErrorMessage] = useState('')
  const [isResending, setIsResending] = useState(false)

  const handleResendVerification = async () => {
    if (!email) {
      setErrorMessage('Vi saknar email-adressen som verifieringsmailet ska skickas till.')
      return
    }

    setIsResending(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      await resendEmailVerification(email)
      setFeedbackMessage(RESEND_VERIFICATION_CONFIRMATION)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Kunde inte skicka verifieringsmailet just nu.',
      )
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Kontrollera din email</h1>
        <p className="subtitle">
          Kontot är skapat. Kontrollera din inkorg och verifiera din email innan du
          loggar in.
        </p>

        {email && (
          <p className="auth-support-text">
            Vi skickade verifieringslänken till <span>{email}</span>.
          </p>
        )}

        {!email && (
          <p className="feedback error">
            Vi saknar email-adressen för det nya kontot. Gå tillbaka till
            registreringen om du vill skapa kontot igen.
          </p>
        )}

        <div className="auth-actions">
          <Link className="submit-btn" to="/login">
            Till login
          </Link>
          {email && (
            <button
              className="guest-btn"
              type="button"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? 'Skickar...' : 'Skicka verifieringsmail igen'}
            </button>
          )}
        </div>

        {errorMessage && <p className="feedback error">{errorMessage}</p>}
        {feedbackMessage && <p className="feedback success">{feedbackMessage}</p>}
      </section>
    </main>
  )
}

export default CheckEmailPage
