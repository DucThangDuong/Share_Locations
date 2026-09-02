import type { PlaceSummaryDto } from '../models/place.model'
import type { ApiSuccessResponse } from './common.response'

export type PlaceDto = PlaceSummaryDto
export type PlaceResponse = ApiSuccessResponse<PlaceSummaryDto>
export type PlaceListResponse = ApiSuccessResponse<PlaceSummaryDto[]>
export type PlaceDetailResponse = ApiSuccessResponse<PlaceSummaryDto>
