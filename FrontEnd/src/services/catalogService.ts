import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { CategoryDto, CollectionDto, PlaceTypeDto } from '@/types/models/place.model'

export const catalogService = {
  async getPlaceTypes(): Promise<ApiSuccessResponse<PlaceTypeDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceTypeDto[]>>('/api/v1/place-types')
    return response.data
  },

  async getCategories(params?: { placeTypeId?: number; placesPerCategory?: number }): Promise<ApiSuccessResponse<CategoryDto[]>> {
    const cleanParams: Record<string, unknown> = {}
    if (params?.placeTypeId && params.placeTypeId > 0) cleanParams.placeTypeId = params.placeTypeId
    if (params?.placesPerCategory && params.placesPerCategory > 0) cleanParams.placesPerCategory = params.placesPerCategory

    const response = await apiClient.get<ApiSuccessResponse<CategoryDto[]>>('/api/v1/categories', {
      params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined
    })
    return response.data
  },

  async getFeaturedCollections(count = 6): Promise<ApiSuccessResponse<CollectionDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<CollectionDto[]>>('/api/v1/collections/featured', {
      params: { count }
    })
    return response.data
  }
}
