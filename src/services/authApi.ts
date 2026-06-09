import type {
  AuthMessageResponse,
  AuthResponse,
  ConfirmEmailPayload,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
} from '../types/auth'
import {
  fetchWithFallback,
  getErrorMessage,
  normalizeBaseUrl,
} from './apiClient'

const IDENTITY_AUTH_API_BASE_URL =
  import.meta.env.VITE_IDENTITY_API_URL ?? 'https://localhost:5001/api/auth'
const IDENTITY_AUTH_API_FALLBACK_URL = 'https://localhost:5001/api/auth'

async function authRequest<T>(path: string, payload: unknown): Promise<T> {
  const baseUrl = normalizeBaseUrl(IDENTITY_AUTH_API_BASE_URL)
  const fallbackUrl = normalizeBaseUrl(IDENTITY_AUTH_API_FALLBACK_URL)
  const response = await fetchWithFallback(
    `${baseUrl}${path}`,
    `${fallbackUrl}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
  const text = await response.text()
  let data: unknown = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Request failed (${response.status})`))
  }

  return (data ?? {}) as T
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/login', payload)
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return authRequest<RegisterResponse>('/register', payload)
}

export function confirmEmail(
  payload: ConfirmEmailPayload,
): Promise<AuthMessageResponse> {
  return authRequest<AuthMessageResponse>('/confirm-email', payload)
}

export function resendEmailVerification(
  email: string,
): Promise<AuthMessageResponse> {
  return authRequest<AuthMessageResponse>('/resend-email-verification', { email })
}

export function forgotPassword(email: string): Promise<AuthMessageResponse> {
  return authRequest<AuthMessageResponse>('/forgot-password', { email })
}

export function resetPassword(
  payload: ResetPasswordPayload,
): Promise<AuthMessageResponse> {
  return authRequest<AuthMessageResponse>('/reset-password', payload)
}
