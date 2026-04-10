import type { AuthUser } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
const AUTH_EXPIRES_AT_KEY = 'authExpiresAt'

export type StoredAuth = {
  token: string
  user: AuthUser | null
  expiresAt: string
}

export function getStoredAuth(): StoredAuth {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
  const expiresAt = localStorage.getItem(AUTH_EXPIRES_AT_KEY) ?? ''

  const rawUser = localStorage.getItem(AUTH_USER_KEY)
  if (!rawUser) {
    return { token, user: null, expiresAt }
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser
    return { token, user, expiresAt }
  } catch {
    return { token, user: null, expiresAt }
  }
}

export function setStoredAuth(token: string, user: AuthUser, expiresAt: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  localStorage.setItem(AUTH_EXPIRES_AT_KEY, expiresAt)
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY)
}
