import type { ReviewDto } from '../models/review.model'
import type { ApiSuccessResponse } from './common.response'

export type ReviewListResponse = ApiSuccessResponse<ReviewDto[]>
export type ReviewDetailResponse = ApiSuccessResponse<ReviewDto>
