import type { FoodDto } from '../models/food.model'
import type { ApiSuccessResponse } from './common.response'

export type FoodResponse = ApiSuccessResponse<FoodDto[]>
export type FoodDetailResponse = ApiSuccessResponse<FoodDto>
