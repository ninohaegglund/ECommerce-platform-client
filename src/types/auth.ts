export type AuthMode = 'login' | 'register'

export type AuthUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  roles: string[]
}

export type AuthResponse = {
  token: string
  expiresAt: string
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}
