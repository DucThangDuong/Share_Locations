import type { ProvinceDto } from './geography.model'
import type {
  RegionHeroImage,
  RegionCollection,
  RegionLandmark,
  RegionFood,
  RegionBlogPost,
  RegionSpotlight,
  RegionReview
} from './region.model'

export interface ProvinceItinerary {
  id: number
  title: string
  destination: string
  region: string
  duration: string
  daysCount: number
  style: string
  estimatedCost: string
  coverUrl: string
  overview?: string | null
  author: {
    name: string
    avatar?: string | null
  }
}

export interface ProvinceLandingData {
  province: ProvinceDto
  heroHeadline: string
  heroSubheadline: string
  heroImages: RegionHeroImage[]
  collections: RegionCollection[]
  landmarks: RegionLandmark[]
  foods: RegionFood[]
  blogPosts: RegionBlogPost[]
  itineraries: ProvinceItinerary[]
  spotlight?: RegionSpotlight | null
  reviews: RegionReview[]
}
