export interface UpdateProfileRequest {
  fullName: string
  phone?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  bio?: string | null
}

export interface UpdateAvatarRequest {
  avatarUrl: string
}
