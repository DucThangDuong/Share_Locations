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

export interface NearbyPlaceItem extends RecommendedPlaceItem {
  distanceKm?: number | null
  latitude?: number | null
  longitude?: number | null
}

export interface IntentDestinationShelfGroup {
  provinceId: number
  provinceName: string
  intentLabel: string
  places: RecommendedPlaceItem[]
}

export interface SuggestedTripOrCollectionItem {
  id: number
  itemType: 'collection' | 'trip'
  title: string
  subtitle?: string | null
  coverImageUrl?: string | null
  provinceId?: number | null
  provinceName?: string | null
  placeCountOrDays: number
  contextSource: 'intent' | 'physical' | 'featured'
  actionUrl: string
  places?: Array<{
    id: number
    name: string
    avgRating: number
    reviewCount: number
    mediaUrls?: string[]
  }>
}

export interface DualContextHomeFeedResponse {
  deviceId?: string | null
  physicalProvinceId?: number | null
  physicalProvinceName?: string | null
  gridKey?: string | null
  intentProvinceId?: number | null
  intentProvinceName?: string | null
  intentLabel?: string | null
  intentProvinceIds?: number[]
  topCategoryIds: number[]
  shelf1NearbyPlaces: NearbyPlaceItem[]
  shelf2IntentPlaces: RecommendedPlaceItem[]
  shelf2IntentGroups?: IntentDestinationShelfGroup[]
  shelf3MixedCollectionsAndTrips: SuggestedTripOrCollectionItem[]
}
