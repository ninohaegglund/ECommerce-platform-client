import { request } from './apiClient.ts'

const NEWSLETTER_API_BASE_URL =
  import.meta.env.VITE_NEWSLETTER_API_URL ?? 'http://localhost:5205'

export type NewsletterSubscribeRequest = {
  email: string
  firstName: string
  lastName: string
}

export type NewsletterSubscriber = {
  id?: string
  email: string
  firstName?: string
  lastName?: string
  isActive?: boolean
  subscribedAtUtc?: string
  unsubscribedAtUtc?: string | null
  createdAtUtc?: string
}

export type NewsletterSendRequest = {
  subject: string
  body: string
  htmlBody?: string
}

export type NewsletterSendTestRequest = NewsletterSendRequest & {
  recipientEmail: string
}

export type NewsletterRecipientResult =
  | string
  | {
      email?: string
      recipientEmail?: string
      status?: string
      error?: string
    }

export type NewsletterSendResult = {
  totalSubscribers?: number
  sentCount?: number
  failedCount?: number
  recipients?: NewsletterRecipientResult[]
  message?: string
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

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  return request<NewsletterSubscriber[]>(
    '/api/newsletter/subscribers',
    { method: 'GET' },
    NEWSLETTER_API_BASE_URL,
  )
}

export async function sendNewsletterTest(
  payload: NewsletterSendTestRequest,
): Promise<NewsletterSendResult> {
  return request<NewsletterSendResult>(
    '/api/newsletter/send-test',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    NEWSLETTER_API_BASE_URL,
  )
}

export async function sendNewsletter(
  payload: NewsletterSendRequest,
): Promise<NewsletterSendResult> {
  return request<NewsletterSendResult>(
    '/api/newsletter/send',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    NEWSLETTER_API_BASE_URL,
  )
}
