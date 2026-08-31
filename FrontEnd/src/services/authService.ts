import apiClient from './apiClient'
import type { 
  ApiSuccessResponse, 
  AuthTokenResponse, 
  LoginRequest, 
  RegisterRequest, 
  GoogleLoginRequest 
} from '@/types/auth'

export const authService = {
  async login(payload: LoginRequest): Promise<ApiSuccessResponse<AuthTokenResponse>> {
    const response = await apiClient.post<ApiSuccessResponse<AuthTokenResponse>>('/api/auth/login', payload)
    return response.data
  },

  async register(payload: RegisterRequest): Promise<ApiSuccessResponse<number>> {
    const response = await apiClient.post<ApiSuccessResponse<number>>('/api/auth/register', payload)
    return response.data
  },

  async googleLogin(payload: GoogleLoginRequest): Promise<ApiSuccessResponse<AuthTokenResponse>> {
    const response = await apiClient.post<ApiSuccessResponse<AuthTokenResponse>>('/api/auth/google', payload)
    return response.data
  },

  async refreshToken(): Promise<ApiSuccessResponse<AuthTokenResponse>> {
    const response = await apiClient.post<ApiSuccessResponse<AuthTokenResponse>>('/api/auth/refresh-token')
    return response.data
  },

  async logout(): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>('/api/auth/logout')
    return response.data
  }
}
