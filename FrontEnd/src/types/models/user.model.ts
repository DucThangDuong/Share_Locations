export type UserRole = 'User' | 'Moderator' | 'Admin' | number | string
export type UserStatus = 'Active' | 'Inactive' | 'Banned' | number | string

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
}
