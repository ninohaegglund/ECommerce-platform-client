import { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Appearance } from '@stripe/stripe-js'

type StripePaymentFormProps = {
  clientSecret: string
  onPaymentSuccess: (paymentIntentId: string) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

type StripePaymentFormInnerProps = {
  onPaymentSuccess: (paymentIntentId: string) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null
const stripeAppearance: Appearance = {
  theme: 'flat',
  variables: {
    colorPrimary: '#d94a34',
    colorText: '#17181d',
    colorTextSecondary: '#4b4d57',
    colorDanger: '#d94a34',
    colorBackground: '#ffffff',
    fontFamily: "'Inter Tight', Inter, system-ui, sans-serif",
    spacingUnit: '4px',
    borderRadius: '8px',
  },
}

function StripePaymentFormInner({
  onPaymentSuccess,
  onCancel,
  disabled,
}: StripePaymentFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage('Stripe ar inte redo an. Vanta ett ogonblick.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message ?? 'Betalningen kunde inte bekraftas.')
      setIsSubmitting(false)
      return
    }

    if (!paymentIntent) {
      setErrorMessage('Ingen betalning kunde bekraftas.')
      setIsSubmitting(false)
      return
    }

    if (
      paymentIntent.status !== 'succeeded' &&
      paymentIntent.status !== 'processing' &&
      paymentIntent.status !== 'requires_capture'
    ) {
      setErrorMessage('Betalningen kunde inte genomforas. Forsok igen.')
      setIsSubmitting(false)
      return
    }

    try {
      await onPaymentSuccess(paymentIntent.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Betalningen kunde inte slutforas.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = disabled || isSubmitting || !stripe || !elements

  return (
    <form className="stripe-form" onSubmit={handleSubmit}>
      <div className="stripe-element">
        <PaymentElement />
      </div>

      {errorMessage && <p className="feedback error">{errorMessage}</p>}

      <div className="stripe-actions">
        <button type="submit" className="submit-btn" disabled={isDisabled}>
          {isSubmitting ? 'Bekraftar betalning...' : 'Betala med kort'}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={onCancel}
          disabled={disabled || isSubmitting}
        >
          Avbryt betalning
        </button>
      </div>
    </form>
  )
}

function StripePaymentForm({
  clientSecret,
  onPaymentSuccess,
  onCancel,
  disabled,
}: StripePaymentFormProps) {
  if (!stripePromise) {
    return (
      <p className="feedback error">
        Stripe-nyckel saknas. Lagg till VITE_STRIPE_PUBLISHABLE_KEY i .env.
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: stripeAppearance }}
      key={clientSecret}
    >
      <StripePaymentFormInner
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
        disabled={disabled}
      />
    </Elements>
  )
}

export default StripePaymentForm
