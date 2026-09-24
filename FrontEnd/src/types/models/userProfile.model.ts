export type FavoriteType = 1 | 2 | 3 | 4

export interface FavoriteItem {
  id: number
  targetId: number
  targetType: FavoriteType
  title: string
  subtitle?: string | null
  coverImg?: string | null
  categoryTag: string
  rating: number
  reviewCount: number
  price?: string | null
  savedDate: string
}

export interface VisitLogItem {
  id: number
  placeId: number
  placeName: string
  province?: string | null
  category?: string | null
  visitedDate: string
  privacy: number
  coverImg?: string | null
  lat?: number | null
  lng?: number | null
  createdAt: string
}

export interface CreateVisitLogRequest {
  placeId: number
  visitedDate: string
  privacy: number
}

export interface UpdateVisitLogRequest {
  visitedDate: string
  privacy: number
}

export interface ProposalItem {
  id: number
  name: string
  categoryId?: number | null
  category?: string | null
  categoryName?: string | null
  provinceId?: number | null
  province?: string | null
  provinceName?: string | null
  address?: string | null
  phone?: string | null
  website?: string | null
  openingHours?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  coverImg?: string | null
  mediaUrls?: string[]
  proposalType?: number
  targetPlaceId?: number | null
  status: number
  statusText?: string | null
  adminNote?: string | null
  rejectReason?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateProposalRequest {
  name: string
  categoryId: number
  provinceId: number
  address: string
  phone?: string
  website?: string
  openingHours?: string
  minPrice?: number
  maxPrice?: number
  latitude?: number
  longitude?: number
  description?: string
  coverImg?: string
  mediaUrls?: string[]
}

export interface UserReviewItem {
  id: number
  placeId: number
  placeName: string
  category?: string | null
  address?: string | null
  province?: string | null
  rating: number
  content?: string | null
  visitDate?: string | null
  coverImg?: string | null
  images: string[]
  createdAt: string
}

export interface UserCommentItem {
  id: number
  reviewId: number
  placeId: number
  placeName: string
  placeThumb?: string | null
  content: string
  parentAuthor?: string | null
  createdAt: string
}

export interface UserBlogItem {
  id: number
  title: string
  excerpt?: string | null
  coverImageUrl?: string | null
  contentJSON: string
  categoryId?: number | null
  categoryName?: string | null
  readTimeMinutes: number
  viewCount: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface UserAccessHistoryItem {
  id: number
  placeId: number
  placeName: string
  coverImg?: string | null
  province?: string | null
  avgRating: number
  viewedAt: string
}

export interface PagedResultDto<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export type { UserProfileData } from '@/types/auth'
