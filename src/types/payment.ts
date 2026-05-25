export type CreatePaymentRequest = {
  orderId: string
  userId: string
  amount: number
  paymentProvider: string
}

export type CreatePaymentResponse = {
  id?: string
  paymentId?: string
}

export type ProcessPaymentRequest = {
  isSuccessful: boolean
  paymentTransactionId: string
}

export type StripePaymentIntentResponse = {
  paymentId: string
  paymentIntentId: string
  clientSecret: string
  status: number
}

export type VerifyStripeCheckoutSessionRequest = {
  sessionId: string
  orderId?: string
}

export type VerifyStripeCheckoutSessionResponse = {
  orderId?: string
  paymentStatus?: number | string
  paymentTransactionId?: string
  paymentProvider?: string
  orderStatus?: number | string
}
