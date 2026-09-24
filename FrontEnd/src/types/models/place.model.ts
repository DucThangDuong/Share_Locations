export interface PlaceTypeDto {
  id: number
  name: string
  imageUrl?: string | null
  iconClass?: string | null
}

export interface LookupItemDto {
  id: number
  name: string
}

export interface RegionLookupDto {
  id: number
  name: string
  provinces: LookupItemDto[]
}

export interface PlaceFilterOptionsDto {
  categories: LookupItemDto[]
  regions: RegionLookupDto[]
}

export interface PlaceCardDto {
  id: number
  name: string
  categoryName?: string | null
  avgRating: number
  reviewCount: number
  mediaUrls: string[]
}

export interface CollectionDto {
  id: number
  provinceId?: number | null
  title: string
  isFeatured: boolean
  displayOrder: number
  placeCount: number
  places?: PlaceCardDto[] | null
}

export interface PlaceSummaryDto {
  id: number
  name: string
  description?: string | null
  address: string
  provinceId: number
  provinceName: string
  regionId: number
  regionName: string
  categoryId: number
  categoryName: string
  placeTypeId: number
  placeTypeName: string
  minPrice?: number | null
  maxPrice?: number | null
  openingHours?: string | null
  avgRating: number
  reviewCount: number
  thumbnailUrl?: string | null
  mediaUrls?: string[] | null
  status: number
  createdAt: string
}

export interface PlaceFilterParams {
  keyword?: string
  regionId?: number
  regionIds?: number[]
  provinceId?: number
  provinceIds?: number[]
  categoryId?: number
  categoryIds?: number[]
  placeTypeId?: number
  placeTypeIds?: number[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: string
  page?: number
  pageSize?: number
}


export interface PlaceDetailDto {
  id: number
  name: string
  description?: string | null
  detailedDescription?: string | null
  address: string
  provinceId: number
  provinceName: string
  regionId: number
  regionName: string
  categoryId: number
  categoryName: string
  placeTypeId: number
  placeTypeName: string
  minPrice?: number | null
  maxPrice?: number | null
  openingHours?: string | null
  avgRating: number
  reviewCount: number
  thumbnailUrl?: string | null
  mediaUrls: string[]
  latitude?: number | null
  longitude?: number | null
  phoneNumber?: string | null
  website?: string | null
  email?: string | null
  highlights: string[]
  status: number
  createdAt: string
  isSaved?: boolean
  isVisited?: boolean
  isCheckedIn?: boolean
}

export interface ReviewItemDto {
  id: number
  userId: string
  userName: string
  userAvatar?: string | null
  rating: number
  content?: string | null
  images: string[]
  videos?: string[]
  likesCount: number
  isLiked?: boolean
  commentsCount: number
  createdAt: string
}

export interface ReviewLikeResponseDto {
  isLiked: boolean
  likesCount: number
}

export interface CommentDto {
  id: number
  reviewId: number
  userId: string
  userName: string
  userAvatar?: string | null
  content: string
  parentId?: number | null
  createdAt: string
  replies?: CommentDto[]
}

export interface CreateReviewCommentRequest {
  reviewId: number
  content: string
  parentId?: number | null
}

export interface ReviewCommentsDto {
  totalComments: number
  items: CommentDto[]
}

export interface PlaceReviewSummaryDto {
  avgRating: number
  totalReviews: number
  ratingBreakdown: Record<string, number>
  items: ReviewItemDto[]
}

export interface CreateReviewRequest {
  placeId: number
  rating: number
  content?: string
  visitDate?: string
  images?: string[]
  photos?: File[]
  videos?: File[]
}

export interface UpdateReviewRequest {
  reviewId: number
  rating: number
  content?: string
  visitDate?: string
  existingMediaUrls?: string[]
  photos?: File[]
  videos?: File[]
}

export interface UpdateReviewCommentRequest {
  commentId: number
  content: string
}

export interface ReportPlaceRequest {
  placeId: number
  reason: string
  description?: string
  contactEmail?: string
}

export interface ToggleSavePlaceDto {
  isSaved: boolean
  placeId: number
}

export interface PlaceMapItemDto {
  id: number
  name: string
  category: string
  categoryId: number
  region: string
  regionName: string
  province: string
  address: string
  avgRating: number
  reviewCount: number
  price: string
  imageUrl?: string | null
  coordinates: [number, number]
}

export interface PlaceMapFilterParams {
  keyword?: string
  region?: string
  provinceId?: number
  categoryId?: number
  minLng?: number
  minLat?: number
  maxLng?: number
  maxLat?: number
}

export type {
  ItineraryAuthorDto,
  ItineraryStopDto,
  ItineraryDayDto,
  ItineraryDto,
  ItineraryFilterParams,
  SaveItineraryResponseDto
} from './itinerary.model'

export type {
  BlogAuthorDto,
  BlogListItemDto,
  BlogDetailDto,
  BlogFilterParams
} from './blogArticle.model'
