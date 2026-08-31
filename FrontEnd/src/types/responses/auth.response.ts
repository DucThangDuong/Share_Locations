import type { UserDto } from '../models/user.model'
import type { ApiSuccessResponse } from './common.response'

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  refreshTokenExpiryTime: string
  user: UserDto
}

export type LoginResponse = ApiSuccessResponse<AuthTokenResponse>
export type RegisterResponse = ApiSuccessResponse<number>
export type GoogleLoginResponse = ApiSuccessResponse<AuthTokenResponse>
export type RefreshTokenResponse = ApiSuccessResponse<AuthTokenResponse>
export type LogoutResponse = ApiSuccessResponse<boolean>
