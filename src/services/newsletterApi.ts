import { request } from './apiClient.ts'

const NEWSLETTER_API_BASE_URL =
  import.meta.env.VITE_NEWSLETTER_API_URL ?? 'http://localhost:5205'

export type NewsletterSubscribeRequest = {
  email: string
  firstName: string
  lastName: string
}

export async function subscribeToNewsletter(
  payload: NewsletterSubscribeRequest,
): Promise<void> {
  await request<void>(
    '/api/newsletter/subscribe',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    NEWSLETTER_API_BASE_URL,
  )
}
