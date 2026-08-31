import type { PlaceDto } from '../models/place.model'
import type { ApiSuccessResponse } from './common.response'

export type PlaceResponse = ApiSuccessResponse<PlaceDto>
export type PlaceListResponse = ApiSuccessResponse<PlaceDto[]>
export type PlaceDetailResponse = ApiSuccessResponse<PlaceDto>
