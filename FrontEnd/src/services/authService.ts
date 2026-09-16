import apiClient from './apiClient'
import type { 
  ApiSuccessResponse, 
  AuthTokenResponse, 
  LoginRequest, 
  RegisterRequest, 
  GoogleLoginRequest,
  UpdateProfileRequest,
  UserDto
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
  },

  async getProfile(): Promise<ApiSuccessResponse<UserDto>> {
    const response = await apiClient.get<ApiSuccessResponse<UserDto>>('/api/auth/profile')
    return response.data
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<ApiSuccessResponse<UserDto>> {
    const formData = new FormData()

    if (payload.fullName !== undefined && payload.fullName !== null) {
      formData.append('FullName', payload.fullName)
    }

    if (payload.phone !== undefined && payload.phone !== null) {
      formData.append('Phone', payload.phone)
    }

    if (payload.bio !== undefined && payload.bio !== null) {
      formData.append('Bio', payload.bio)
    }

    if (payload.avatarFile) {
      formData.append('AvatarFile', payload.avatarFile)
    }

    if (payload.coverFile) {
      formData.append('CoverFile', payload.coverFile)
    }

    const response = await apiClient.put<ApiSuccessResponse<UserDto>>('/api/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}
