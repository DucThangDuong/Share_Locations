import type { TripDto } from '../models/trip.model'
import type { ApiSuccessResponse } from './common.response'

export type TripResponse = ApiSuccessResponse<TripDto[]>
export type TripDetailResponse = ApiSuccessResponse<TripDto>
