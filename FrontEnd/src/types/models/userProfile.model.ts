export type FavoriteType = 1 | 2 | 3 | 4

export interface FavoriteItem {
  id: number
  targetId: number
  targetType: FavoriteType
  title: string
  subtitle?: string
  coverImg?: string
  mediaUrls?: string[]
  categoryTag: string
  rating?: number
  reviewCount?: number
  price?: string
  extraInfo?: string
  savedDate: string
}

export interface VisitLogItem {
  id: number
  placeId: number
  placeName: string
  province?: string
  category?: string
  visitedDate: string
  privacy: 0 | 1
  coverImg?: string
  lat?: number
  lng?: number
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
  category?: string
  categoryId?: number
  province?: string
  provinceId?: number
  address: string
  phone?: string
  website?: string
  openingHours?: string
  minPrice?: number
  maxPrice?: number
  description?: string
  coverImg?: string
  mediaUrls?: string[]
  status: 0 | 1 | 2
  rejectReason?: string
  createdAt: string
  viewsCount?: number
  favoritesCount?: number
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
  placeThumb?: string
  province?: string
  category?: string
  rating: number
  content?: string
  visitDate?: string
  coverImg?: string
  images?: string[]
  photos?: string[]
  helpfulCount?: number
  createdAt: string
}

export interface UserCommentItem {
  id: number
  reviewId?: number
  placeId: number
  placeName: string
  placeThumb?: string
  content: string
  parentAuthor?: string
  createdAt: string
}

export interface UserBlogItem {
  id: number
  title: string
  slug?: string
  coverImageUrl?: string
  coverImg?: string
  excerpt?: string
  contentJSON?: string
  status: 0 | 1
  categoryId?: number
  categoryName?: string
  category?: string
  readTimeMinutes?: number
  readTime?: string
  viewCount?: number
  viewsCount?: number
  likesCount?: number
  createdAt: string
  updatedAt?: string
}

export interface UserAccessHistoryItem {
  id: number
  placeId: number
  placeName: string
  coverImg?: string
  province?: string
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

export const provinceOptions: string[] = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Quảng Nam',
  'Thừa Thiên Huế',
  'Lâm Đồng (Đà Lạt)',
  'Lào Cai (Sa Pa)',
  'Quảng Ninh (Hạ Long)',
  'Ninh Bình',
  'Hà Giang',
  'Khánh Hòa (Nha Trang)',
  'Kiên Giang (Phú Quốc)',
  'Bà Rịa - Vũng Tàu',
  'Cần Thơ',
  'An Giang',
  'Đắk Nông'
]

export const categoryOptions = [
  { id: 1, name: 'Nhà hàng & Đặc sản', type: 'Ăn uống' },
  { id: 2, name: 'Quán cà phê & Trà', type: 'Ăn uống' },
  { id: 3, name: 'Ẩm thực đường phố', type: 'Ăn uống' },
  { id: 4, name: 'Điểm tham quan & Di tích', type: 'Du lịch' },
  { id: 5, name: 'Bãi biển & Đảo', type: 'Du lịch' },
  { id: 6, name: 'Núi rừng & Thác nước', type: 'Du lịch' },
  { id: 7, name: 'Khách sạn & Homestay', type: 'Lưu trú' },
  { id: 8, name: 'Trải nghiệm văn hóa', type: 'Văn hóa' }
]
