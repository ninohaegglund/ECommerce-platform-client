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
