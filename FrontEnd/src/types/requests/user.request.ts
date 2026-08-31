export interface UpdateProfileRequest {
  fullName: string
  bio?: string
  job?: string
  address?: string
  phone?: string
  email?: string
}

export interface UpdateAvatarRequest {
  avatarUrl: string
}
