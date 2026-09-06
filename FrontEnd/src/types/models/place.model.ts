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

export interface CategoryDto {
  id: number
  placeTypeId: number
  placeTypeName: string
  name: string
  imageUrl?: string | null
  iconClass?: string | null
  placeCount: number
  places?: PlaceCardDto[]
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
  provinceId?: number
  categoryId?: number
  placeTypeId?: number
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: string
  page?: number
  pageSize?: number
}

export interface PlaceAmenityDto {
  id: string
  name: string
  icon: string
}

export interface ReviewItemDto {
  id: number
  userId: string
  userName: string
  userAvatar?: string | null
  rating: number
  content?: string | null
  images: string[]
  likesCount: number
  createdAt: string
}

export interface PlaceReviewSummaryDto {
  avgRating: number
  totalReviews: number
  ratingBreakdown: Record<string, number>
  items: ReviewItemDto[]
}

export interface PlaceDetailDto extends PlaceSummaryDto {
  detailedDescription?: string | null
  highlights: string[]
  amenities: PlaceAmenityDto[]
  latitude?: number | null
  longitude?: number | null
  phoneNumber?: string | null
  website?: string | null
  email?: string | null
  reviews?: ReviewItemDto[]
  ratingBreakdown?: Record<string, number>
}

export interface CreateReviewRequest {
  placeId: number
  rating: number
  content?: string
  visitDate?: string
  images?: string[]
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

export interface FoodSuggestedPlaceDto {
  placeId?: number
  name: string
  address: string
  rating: number
  price: string
}

export interface FoodItemDto {
  id: number
  name: string
  region: string
  regionName: string
  category: string
  priceRange: string
  minPrice?: number | null
  maxPrice?: number | null
  imageUrl?: string | null
  description?: string | null
  highlights: string[]
  suggestedPlaces: FoodSuggestedPlaceDto[]
}

export interface FoodFilterParams {
  region?: string
  category?: string
  keyword?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  pageSize?: number
}

export interface ItineraryAuthorDto {
  name: string
  avatar?: string | null
}

export interface ItineraryStopDto {
  time: string
  activity: string
  location: string
  description?: string | null
  costEstimate?: string | null
  tips?: string | null
}

export interface ItineraryDayDto {
  dayNumber: number
  title: string
  stops: ItineraryStopDto[]
}

export interface ItineraryDto {
  id: number
  title: string
  destination: string
  region: string
  duration: string
  daysCount: number
  style: string
  estimatedCost: string
  coverUrl?: string | null
  author: ItineraryAuthorDto
  overview?: string | null
  days: ItineraryDayDto[]
}

export interface ItineraryFilterParams {
  duration?: string
  region?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface SaveItineraryResponseDto {
  saved: boolean
  itineraryId: number
}

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

export interface BlogDetailDto extends BlogListItemDto {
  relatedPosts: BlogListItemDto[]
}

export interface BlogFilterParams {
  category?: string
  keyword?: string
  page?: number
  pageSize?: number
}
