export type UserRole = 'User' | 'CategoryAdmin' | 'SystemAdmin' | number | string
export type UserStatus = 'Inactive' | 'Active' | 'Banned' | number | string

export interface UserDto {
  id: number
  email: string
  fullName: string
  avatarUrl?: string | null
  coverUrl?: string | null
  bio?: string | null
  phone?: string | null
  role: UserRole
  status: UserStatus
  rankLevel: string
  reputationScore: number
}

export interface UserProfileData {
  fullName: string
  email: string
  phone: string
  bio: string
  avatarUrl: string
  coverUrl?: string
  rankLevel: string
  reputationScore: number
  role?: UserRole
  status?: UserStatus
}
