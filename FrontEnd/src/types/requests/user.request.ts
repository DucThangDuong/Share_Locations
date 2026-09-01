export interface UpdateProfileRequest {
  fullName?: string | null
  phone?: string | null
  bio?: string | null
  avatarFile?: File | null
  coverFile?: File | null
}

export interface UpdateAvatarRequest {
  avatarFile: File
}
