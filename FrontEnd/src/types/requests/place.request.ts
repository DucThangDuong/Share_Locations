import type { PaginationParams } from '../models/common.model'
import type { RegionType } from '../models/place.model'

export interface PlaceFilterRequest extends PaginationParams {
  region?: RegionType
  provinceId?: number
  categoryId?: number
  minRating?: number
  isFeatured?: boolean
}

export interface CreatePlaceRequest {
  title: string
  description: string
  address: string
  provinceId: number
  categoryId: number
  mediaUrls: string[]
}

export interface UpdatePlaceRequest extends Partial<CreatePlaceRequest> {
  id: number
}

export interface SavePlaceRequest {
  placeId: number | string
}
