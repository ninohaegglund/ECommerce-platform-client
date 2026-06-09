import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmEmail } from '../services/authApi'

type VerificationStatus = 'loading' | 'success' | 'error'

function getVerificationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('invalid') ||
    normalizedMessage.includes('expired')
  ) {
    return 'Verifieringslänken är ogiltig eller har gått ut.'
  }

  return message || 'Kunde inte verifiera email-adressen just nu.'
}

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')?.trim() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''
  const hasSubmittedRef = useRef(false)

  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('Verifierar email-adressen...')

  useEffect(() => {
    if (hasSubmittedRef.current) {
      return
    }

    hasSubmittedRef.current = true

    if (!email || !token) {
      setStatus('error')
      setMessage('Verifieringslänken saknar email eller token.')
      return
    }

    const verifyEmail = async () => {
      setStatus('loading')
      setMessage('Verifierar email-adressen...')

      try {
        await confirmEmail({ email, token })
        setStatus('success')
        setMessage('Email-adressen är verifierad. Du kan nu logga in.')
      } catch (error) {
        setStatus('error')
        setMessage(getVerificationErrorMessage(error))
      }
    }

    void verifyEmail()
  }, [email, token])

  return (
    <main className="auth-page">
      <section className="auth-card" aria-live="polite">
        <h1>Verifiera email</h1>

        <p className="subtitle">
          {email
            ? `Vi kontrollerar verifieringslänken för ${email}.`
            : 'Vi kontrollerar verifieringslänken.'}
        </p>

        <p className={`feedback ${status === 'success' ? 'success' : status === 'error' ? 'error' : ''}`}>
          {message}
        </p>

        <div className="auth-actions">
          <Link className={status === 'success' ? 'submit-btn' : 'guest-btn'} to="/login">
            Till login
          </Link>
          {status === 'error' && (
            <Link className="guest-btn" to="/register">
              Skapa konto
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

export default VerifyEmailPage
