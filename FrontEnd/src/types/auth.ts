export * from './responses/common.response'

export interface UserDto {
  id: number
  email: string
  fullName: string
  avatarUrl?: string | null
  coverUrl?: string | null
  bio?: string | null
  phone?: string | null
  role: string | number
  status: number
  rankLevel: string
  reputationScore: number
}

export interface UserProfileData {
  id?: number
  email?: string
  fullName: string
  avatarUrl?: string | null
  coverUrl?: string | null
  bio?: string | null
  phone?: string | null
  role?: string | number
  status?: number
  rankLevel?: string
  reputationScore?: number
}

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

export interface UpdateProfileRequest {
  fullName?: string | null
  phone?: string | null
  bio?: string | null
  avatarFile?: File | null
  coverFile?: File | null
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  refreshTokenExpiryTime: string
  user: UserDto
}
