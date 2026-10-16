export interface RecommendedPlaceItem {
  placeId: number
  name: string
  slug?: string
  coverImageUrl?: string | null
  thumbnailUrl?: string | null
  mediaUrls?: string[]
  address?: string | null
  description?: string | null
  categoryId?: number
  categoryName?: string
  provinceId?: number
  provinceName?: string
  regionName?: string
  openingHours?: string | null
  avgRating: number
  reviewCount: number
  minPrice?: number | null
  maxPrice?: number | null
  cosineSimilarity?: number
  matchPercentage: number
  isColdStartFallback?: boolean
  explainReason?: string
}

export interface PersonalizedPlacesResponse {
  userId?: number | null
  isPersonalized: boolean
  count: number
  items: RecommendedPlaceItem[]
}

export interface SimilarPlaceItem {
  placeId: number
  name: string
  slug?: string
  coverImageUrl?: string | null
  thumbnailUrl?: string | null
  mediaUrls?: string[]
  address?: string | null
  description?: string | null
  categoryName?: string
  provinceName?: string
  regionName?: string
  openingHours?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  avgRating: number
  reviewCount: number
  matchPercentage: number
  explainReason?: string
  distanceKm?: number | null
}

export interface RecommendedFoodStoreItem {
  id?: number | string
  name: string
  address?: string
  rating?: number
}

export interface RecommendedFoodItem {
  foodId: number
  name: string
  slug?: string
  description?: string | null
  coverImageUrl?: string | null
  mediaUrls?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  priceRange?: string | null
  matchedPlaceId?: number | null
  matchedPlaceName?: string | null
  matchedPlaceAddress?: string | null
  matchedPlaceRating?: number | null
  placeMatchPercentage?: number | null
  suggestedPlaces?: RecommendedFoodStoreItem[]
}
