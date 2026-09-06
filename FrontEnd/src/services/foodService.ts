import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { FoodItemDto, FoodFilterParams } from '@/types/models/place.model'

export const foodService = {
  async getFoods(params?: FoodFilterParams): Promise<ApiSuccessResponse<FoodItemDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params?.region && params.region !== 'all') cleanParams.region = params.region
    if (params?.category && params.category !== 'Tất cả') cleanParams.category = params.category
    if (params?.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    if (params?.minPrice !== undefined && params.minPrice > 0) cleanParams.minPrice = params.minPrice
    if (params?.maxPrice !== undefined && params.maxPrice > 0) cleanParams.maxPrice = params.maxPrice
    cleanParams.page = params?.page || 1
    cleanParams.pageSize = params?.pageSize || 20

    const response = await apiClient.get<ApiSuccessResponse<FoodItemDto[]>>('/api/v1/foods', {
      params: cleanParams
    })
    return response.data
  }
}
