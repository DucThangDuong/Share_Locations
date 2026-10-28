export interface BlogAuthorDto {
  id?: number | string
  userId?: number | string
  authorId?: number | string
  name: string
  avatar?: string | null
  role: string
}

export interface MentionedPlaceDto {
  id: number | string
  name: string
  province?: string
  category?: string
  address?: string
  rating?: number
  reviewCount?: number
  coverUrl?: string
  slug?: string
}

export interface BlogListItemDto {
  id: number
  title: string
  slug?: string
  summary?: string | null
  excerpt?: string | null
  coverImageUrl?: string | null
  coverUrl?: string | null
  coverImg?: string | null
  authorName?: string
  authorAvatar?: string | null
  author?: BlogAuthorDto
  publishedAt?: string
  createdAt?: string
  views?: number
  viewCount?: number
  featured?: boolean
  categoryId?: number
  content?: string
  category?: string
  categoryName?: string
}

export interface BlogDetailDto extends BlogListItemDto {
  content?: string
  contentJSON?: string
  categoryName?: string
  category?: string
  mentionedPlaces?: MentionedPlaceDto[]
  updatedAt?: string
  status?: number
  likes?: number
  likesCount?: number
  isLiked?: boolean
  isSaved?: boolean
}

export interface BlogLikeResponseDto {
  isLiked: boolean
  likesCount: number
}

export interface BlogFilterParams {
  keyword?: string
  categoryId?: number
  category?: string
  page?: number
  size?: number
  pageSize?: number
}

export interface CreateBlogRequest {
  title: string
  categoryId?: number
  coverImageUrl?: string
  excerpt?: string
  contentJSON?: string
  readTimeMinutes?: number
  status?: number
}

export interface UpdateBlogRequest {
  title: string
  categoryId?: number
  coverImageUrl?: string
  excerpt?: string
  contentJSON?: string
  readTimeMinutes?: number
  status?: number
}

export interface UserBlogItemDto {
  id: number
  title: string
  excerpt?: string | null
  coverImageUrl?: string | null
  contentJSON: string
  categoryId?: number | null
  categoryName?: string | null
  readTimeMinutes: number
  status: number
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface BlogForEditDto {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  contentJSON: string
  coverImageUrl?: string | null
  categoryId?: number | null
  categoryName?: string | null
  readTimeMinutes: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface MyBlogFilterParams {
  status?: number
  page?: number
  pageSize?: number
}
