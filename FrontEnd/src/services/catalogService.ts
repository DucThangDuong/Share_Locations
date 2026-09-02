import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { CategoryDto, CollectionDto } from '@/types/models/place.model'

export const catalogService = {
  async getCategories(): Promise<ApiSuccessResponse<CategoryDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<CategoryDto[]>>('/api/categories')
    return response.data
  },

  async getFeaturedCollections(count = 6): Promise<ApiSuccessResponse<CollectionDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<CollectionDto[]>>('/api/collections/featured', {
      params: { count }
    })
    return response.data
  }
}
