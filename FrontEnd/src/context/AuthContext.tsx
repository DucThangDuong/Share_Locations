import React, { createContext, useContext, useState, useEffect } from 'react'
import type { 
  UserDto, 
  UserProfileData, 
  LoginRequest, 
  RegisterRequest, 
  GoogleLoginRequest,
  UpdateProfileRequest 
} from '@/types/auth'
import { authService } from '@/services/authService'

interface AuthContextType {
  user: UserDto | null
  profile: UserProfileData | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  googleLogin: (payload: GoogleLoginRequest) => Promise<void>
  logout: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (payload: UpdateProfileRequest) => Promise<UserDto>
}

const mapUserDtoToProfile = (user: UserDto): UserProfileData => {
  return {
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    coverUrl: user.coverUrl || '',
    rankLevel: user.rankLevel || 'Tân binh',
    reputationScore: user.reputationScore ?? 0
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null)
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const syncProfileFromBackend = async () => {
    try {
      const res = await authService.getProfile()
      if (res.success && res.data) {
        const userData = res.data
        setUser(userData)
        localStorage.setItem('user_info', JSON.stringify(userData))

        const mapped = mapUserDtoToProfile(userData)
        setProfile(mapped)
        localStorage.setItem('user_profile', JSON.stringify(mapped))
      }
    } catch {
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token')
        const storedUser = localStorage.getItem('user_info')
        const storedProfile = localStorage.getItem('user_profile')

        if (storedToken && storedUser) {
          const parsedUser: UserDto = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)
          setProfile(
            storedProfile
              ? JSON.parse(storedProfile)
              : mapUserDtoToProfile(parsedUser)
          )

          await syncProfileFromBackend()
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('user_profile')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (payload: LoginRequest) => {
    const res = await authService.login(payload)
    if (res.success && res.data) {
      const { accessToken, user: userData } = res.data
      setToken(accessToken)
      setUser(userData)
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('user_info', JSON.stringify(userData))

      const mappedProfile = mapUserDtoToProfile(userData)
      setProfile(mappedProfile)
      localStorage.setItem('user_profile', JSON.stringify(mappedProfile))

      await syncProfileFromBackend()
    } else {
      throw new Error(res.message || 'Đăng nhập thất bại.')
    }
  }

  const register = async (payload: RegisterRequest) => {
    const res = await authService.register(payload)
    if (!res.success) {
      throw new Error(res.message || 'Đăng ký tài khoản thất bại.')
    }
  }

  const googleLogin = async (payload: GoogleLoginRequest) => {
    const res = await authService.googleLogin(payload)
    if (res.success && res.data) {
      const { accessToken, user: userData } = res.data
      setToken(accessToken)
      setUser(userData)
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('user_info', JSON.stringify(userData))
      
      const mappedProfile = mapUserDtoToProfile(userData)
      setProfile(mappedProfile)
      localStorage.setItem('user_profile', JSON.stringify(mappedProfile))

      await syncProfileFromBackend()
    } else {
      throw new Error(res.message || 'Đăng nhập Google thất bại.')
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
    } finally {
      setUser(null)
      setProfile(null)
      setToken(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('user_profile')
    }
  }

  const fetchProfile = async () => {
    await syncProfileFromBackend()
  }

  const updateProfile = async (payload: UpdateProfileRequest): Promise<UserDto> => {
    const res = await authService.updateProfile(payload)
    if (res.success && res.data) {
      const updatedUser = res.data
      setUser(updatedUser)
      localStorage.setItem('user_info', JSON.stringify(updatedUser))

      const mapped = mapUserDtoToProfile(updatedUser)
      setProfile(mapped)
      localStorage.setItem('user_profile', JSON.stringify(mapped))

      return updatedUser
    }
    throw new Error(res.message || 'Cập nhật thông tin thất bại.')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        fetchProfile,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
