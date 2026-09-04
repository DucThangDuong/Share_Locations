export * from './responses/common.response'

export interface UserDto {
  id: number
  email: string
  fullName: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  phone?: string
  reputationScore: number
  rankLevel: string
  role: string
  isActive?: boolean
  createdAt?: string
}

export interface UserProfileData {
  id?: number
  email?: string
  fullName: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  phone?: string
  reputationScore?: number
  rankLevel?: string
  role?: string
}

export interface LoginRequest {
  email?: string
  userName?: string
  password?: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  userName?: string
  email: string
  password?: string
  confirmPassword?: string
  fullName: string
  phone?: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface UpdateProfileRequest {
  fullName?: string | null
  phone?: string | null
  bio?: string | null
  avatarFile?: File | null
  coverFile?: File | null
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  user: UserDto
}
