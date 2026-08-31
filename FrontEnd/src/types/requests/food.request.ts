import type { PaginationParams } from '../models/common.model'
import type { RegionType } from '../models/place.model'

export interface FoodFilterRequest extends PaginationParams {
  region?: RegionType
  provinceId?: number
  keyword?: string
}

export interface CreateFoodRequest {
  name: string
  description: string
  origin: string
  region: RegionType
  provinceId?: number
  mediaUrls: string[]
  priceRange?: string
}
