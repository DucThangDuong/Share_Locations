import type { PaginationParams } from '../models/common.model'

export interface CreateReviewRequest {
  placeId: number | string
  rating: number
  content: string
  mediaUrls?: string[]
}

export interface ReviewFilterRequest extends PaginationParams {
  placeId: number | string
  rating?: number
}
