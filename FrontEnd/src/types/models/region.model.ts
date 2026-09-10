import type { PlaceCardDto } from './place.model'

export type RegionCode = 'north' | 'central' | 'south'

export interface RegionHeroImage {
  url: string
  title: string
  location: string
  tag?: string
}

export interface RegionCollection {
  id: number | string
  title: string
  subtitle?: string | null
  placeCount?: number
  places?: PlaceCardDto[]
}

export interface RegionLandmark {
  id: number | string
  name: string
  province: string
  location: string
  coordinates?: [number, number] | number[] | null
  rating: number
  reviewCount: number
  savedCount: number
  imageUrl?: string | null
  mediaUrls?: string[]
  category?: string | null
  price?: string | null
}

export type FoodTypeCategory = 'all' | 'dine-in' | 'gift'

export interface RegionFoodStore {
  id?: number | string
  name: string
  address: string
  rating: number
  coordinates?: [number, number] | number[] | null
}

export interface RegionFood {
  id: number | string
  name: string
  province: string
  description?: string | null
  imageUrl?: string | null
  mediaUrls?: string[]
  type: string
  priceRange?: string | null
  suggestedPlacesCount: number
  suggestedPlaceId?: number | string
  coordinates?: [number, number] | number[] | null
  suggestedPlaces?: RegionFoodStore[]
}

export interface RegionBlogPost {
  id: number | string
  slug: string
  title: string
  excerpt?: string | null
  coverUrl?: string | null
  publishedAt: string
  readTime: string
  category: string
  location?: string | null
  rating?: number
  reviewCount?: number
  tags?: string[]
  statusOrHours?: string | null
  badgeText?: string | null
  author: {
    name: string
    avatar?: string | null
  }
}

export interface RegionSpotlight {
  id: string
  title: string
  subtitle: string
  description: string
  province: string
  totalReviews: number
  avgRating: number
  bannerUrl: string
  coordinates?: [number, number] | number[] | null
  highlights: string[]
}

export interface RegionReview {
  id: number | string
  reviewerName: string
  reviewerAvatar?: string | null
  rating: number
  placeName: string
  placeId?: number | string
  visitDate: string
  content: string
  images: string[]
  likesCount: number
  coordinates?: [number, number] | number[] | null
}

export interface RegionLandingData {
  code: RegionCode
  name: string
  shortTitle: string
  badgeText?: string
  heroHeadline: string
  heroSubheadline: string
  provinces: string[]
  heroImages: RegionHeroImage[]
  collections?: RegionCollection[]
  landmarks?: RegionLandmark[]
  foods?: RegionFood[]
  blogPosts?: RegionBlogPost[]
  spotlight?: RegionSpotlight | null
  reviews?: RegionReview[]
}
