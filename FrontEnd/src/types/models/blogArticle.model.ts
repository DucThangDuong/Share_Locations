export interface BlogAuthorDto {
  name: string
  avatar?: string | null
  role: string
}

export interface BlogListItemDto {
  id: number
  slug: string
  title: string
  excerpt?: string | null
  content: string
  category: string
  readTime: string
  coverUrl?: string | null
  author: BlogAuthorDto
  publishedAt: string
  tags: string[]
  featured: boolean
}

export interface BlogDetailDto extends BlogListItemDto {}

export interface BlogLikeResponseDto {
  isLiked: boolean
  likesCount: number
}

export interface BlogFilterParams {
  category?: string
  categoryId?: number
  categoryIds?: number[]
  placeTypeId?: number
  placeTypeIds?: number[]
  keyword?: string
  page?: number
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
