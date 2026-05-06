import { getStoredAuth } from '../utils/authStorage'

export function getAuthToken(): string {
  return getStoredAuth().token || localStorage.getItem('authToken') || ''
}

export function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }

    if ('title' in payload && typeof payload.title === 'string') {
      return payload.title
    }
  }

  return fallback
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  baseUrl?: string,
): Promise<T> {
  const token = getAuthToken()
  const resolvedBaseUrl = baseUrl ?? 'https://localhost:7043'
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${resolvedBaseUrl}${path}`, {
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

export async function requestMultipart<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, 'body'>,
  baseUrl?: string,
): Promise<T> {
  const token = getAuthToken()
  const resolvedBaseUrl = baseUrl ?? 'https://localhost:7043'
  const headers = new Headers(init?.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Don't set Content-Type for multipart - let the browser set it with boundary
  const response = await fetch(`${resolvedBaseUrl}${path}`, {
    ...init,
    method: 'POST',
    body: formData,
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
