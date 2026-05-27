import { getAuthToken, getErrorMessage } from './apiClient.ts'

const NEWSLETTER_API_BASE_URL =
  import.meta.env.VITE_NEWSLETTER_API_URL ?? 'http://localhost:5205'
const ADMIN_AUTH_ERROR = 'Du måste vara inloggad som admin.'

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

function getNewsletterApiBaseUrl(): string {
  const baseUrl = NEWSLETTER_API_BASE_URL.trim().replace(/\/+$/, '')

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error('VITE_NEWSLETTER_API_URL måste börja med http:// eller https://.')
  }

  return baseUrl
}

async function newsletterRequest<T>(
  path: string,
  init?: RequestInit,
  requireAdminToken = false,
): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (requireAdminToken) {
    const token = getAuthToken()
    if (!token) {
      throw new Error(ADMIN_AUTH_ERROR)
    }

    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${getNewsletterApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let payload: unknown = null

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    throw new Error(getErrorMessage(payload, `Request failed (${response.status})`))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export async function subscribeToNewsletter(
  payload: NewsletterSubscribeRequest,
): Promise<void> {
  await newsletterRequest<void>(
    '/api/newsletter/subscribe',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  return newsletterRequest<NewsletterSubscriber[]>(
    '/api/newsletter/subscribers',
    { method: 'GET' },
    true,
  )
}

export async function sendNewsletterTest(
  payload: NewsletterSendTestRequest,
): Promise<NewsletterSendResult> {
  const requestPayload: NewsletterSendTestRequest = {
    recipientEmail: payload.recipientEmail,
    subject: payload.subject,
    body: payload.body,
    ...(payload.htmlBody ? { htmlBody: payload.htmlBody } : {}),
  }

  return newsletterRequest<NewsletterSendResult>(
    '/api/newsletter/send-test',
    {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    },
    true,
  )
}

export async function sendNewsletter(
  payload: NewsletterSendRequest,
): Promise<NewsletterSendResult> {
  const requestPayload: NewsletterSendRequest = {
    subject: payload.subject,
    body: payload.body,
    ...(payload.htmlBody ? { htmlBody: payload.htmlBody } : {}),
  }

  return newsletterRequest<NewsletterSendResult>(
    '/api/newsletter/send',
    {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    },
    true,
  )
}
