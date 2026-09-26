export interface BlogAuthorDto {
  id?: number | string
  userId?: number | string
  authorId?: number | string
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
