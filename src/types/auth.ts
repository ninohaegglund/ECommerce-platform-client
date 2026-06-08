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

export type RegisterResponse = {
  message: string
  emailVerificationRequired: boolean
  user: AuthUser
}

export type AuthMessageResponse = {
  message: string
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

export type ConfirmEmailPayload = {
  email: string
  token: string
}

export type ResetPasswordPayload = {
  email: string
  token: string
  newPassword: string
  confirmPassword: string
}

export type AuthSubmitResult = {
  ok: boolean
  message: string
  email?: string
  isUnverifiedEmail?: boolean
  emailVerificationRequired?: boolean
}
