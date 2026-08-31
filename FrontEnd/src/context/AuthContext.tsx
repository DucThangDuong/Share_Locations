import React, { createContext, useContext, useState, useEffect } from 'react'
import type { UserDto, UserProfileData, LoginRequest, RegisterRequest, GoogleLoginRequest } from '@/types/auth'
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
  updateProfile: (updated: Partial<UserProfileData>) => void
}

const DEFAULT_PROFILE: UserProfileData = {
  fullName: 'Nguyễn Minh Anh',
  email: 'anh.nguyen@gmail.com',
  phone: '0912345678',
  bio: 'Đam mê du lịch tự túc, khám phá ẩm thực đường phố và lưu giữ những hành trình thật đẹp.',
  job: 'Travel Blogger & Nhiếp ảnh',
  address: 'Hà Nội, Việt Nam',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  coverUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop',
  rankLevel: 'Khám phá gia',
  reputationScore: 420
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null)
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
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
            : {
                ...DEFAULT_PROFILE,
                fullName: parsedUser.fullName || DEFAULT_PROFILE.fullName,
                email: parsedUser.email || DEFAULT_PROFILE.email,
                avatarUrl: parsedUser.avatarUrl || DEFAULT_PROFILE.avatarUrl,
                rankLevel: parsedUser.rankLevel || DEFAULT_PROFILE.rankLevel,
                reputationScore: parsedUser.reputationScore || DEFAULT_PROFILE.reputationScore
              }
        )
      } else {
        setProfile(storedProfile ? JSON.parse(storedProfile) : DEFAULT_PROFILE)
      }
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (payload: LoginRequest) => {
    const res = await authService.login(payload)
    if (res.success && res.data) {
      const { accessToken, user: userData } = res.data
      setToken(accessToken)
      setUser(userData)
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('user_info', JSON.stringify(userData))

      const updatedProfile: UserProfileData = {
        ...DEFAULT_PROFILE,
        fullName: userData.fullName || DEFAULT_PROFILE.fullName,
        email: userData.email || DEFAULT_PROFILE.email,
        phone: userData.phone || DEFAULT_PROFILE.phone,
        avatarUrl: userData.avatarUrl || DEFAULT_PROFILE.avatarUrl,
        rankLevel: userData.rankLevel || DEFAULT_PROFILE.rankLevel,
        reputationScore: userData.reputationScore || DEFAULT_PROFILE.reputationScore
      }
      setProfile(updatedProfile)
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile))
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
      
      const updatedProfile: UserProfileData = {
        ...DEFAULT_PROFILE,
        fullName: userData.fullName || DEFAULT_PROFILE.fullName,
        email: userData.email || DEFAULT_PROFILE.email,
        avatarUrl: userData.avatarUrl || DEFAULT_PROFILE.avatarUrl
      }
      setProfile(updatedProfile)
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile))
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
      setToken(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    }
  }

  const updateProfile = (updated: Partial<UserProfileData>) => {
    setProfile((prev) => {
      const merged = prev ? { ...prev, ...updated } : { ...DEFAULT_PROFILE, ...updated }
      localStorage.setItem('user_profile', JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!token || !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
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
