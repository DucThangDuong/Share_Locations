import type { PaginationParams } from '../models/common.model'

export interface TripFilterRequest extends PaginationParams {
  destination?: string
  authorId?: number
}

export interface CreateTripRequest {
  title: string
  destination: string
  duration: string
  description: string
  imageUrl: string
  isPublic?: boolean
  days: {
    dayNumber: number
    title?: string
    placeIds: (number | string)[]
  }[]
}

export interface UpdateTripRequest extends Partial<CreateTripRequest> {
  id: number | string
}
