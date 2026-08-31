export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface RefreshTokenRequest {
  accessToken?: string
  refreshToken?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
