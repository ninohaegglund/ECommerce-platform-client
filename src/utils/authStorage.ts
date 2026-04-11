import type { AuthUser } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
const AUTH_EXPIRES_AT_KEY = 'authExpiresAt'

const AUTH_KEYS = [AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_EXPIRES_AT_KEY]

export type StoredAuth = {
  token: string
  user: AuthUser | null
  expiresAt: string
}

function clearFromStorage(storage: Storage) {
  AUTH_KEYS.forEach((key) => storage.removeItem(key))
}

function getRawAuth(storage: Storage): StoredAuth {
  const token = storage.getItem(AUTH_TOKEN_KEY) ?? ''
  const expiresAt = storage.getItem(AUTH_EXPIRES_AT_KEY) ?? ''

  const rawUser = storage.getItem(AUTH_USER_KEY)
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

function isExpired(expiresAt: string): boolean {
  if (!expiresAt) {
    return false
  }

  const expirationTime = Date.parse(expiresAt)
  if (Number.isNaN(expirationTime)) {
    return false
  }

  return expirationTime <= Date.now()
}

export function getStoredAuth(): StoredAuth {
  const localAuth = getRawAuth(localStorage)
  const sessionAuth = getRawAuth(sessionStorage)
  const selectedAuth = localAuth.token ? localAuth : sessionAuth

  if (!selectedAuth.token || !selectedAuth.user) {
    return { token: '', user: null, expiresAt: '' }
  }

  if (isExpired(selectedAuth.expiresAt)) {
    clearStoredAuth()
    return { token: '', user: null, expiresAt: '' }
  }

  return selectedAuth
}

export function setStoredAuth(
  token: string,
  user: AuthUser,
  expiresAt: string,
  rememberMe: boolean,
) {
  clearStoredAuth()

  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(AUTH_TOKEN_KEY, token)
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  storage.setItem(AUTH_EXPIRES_AT_KEY, expiresAt)
}

export function clearStoredAuth() {
  clearFromStorage(localStorage)
  clearFromStorage(sessionStorage)
}
