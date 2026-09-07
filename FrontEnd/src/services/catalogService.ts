import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { CollectionDto, PlaceTypeDto } from '@/types/models/place.model'

export const catalogService = {
  async getPlaceTypes(): Promise<ApiSuccessResponse<PlaceTypeDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceTypeDto[]>>('/api/v1/place-types')
    return response.data
  },

  async getFeaturedCollections(count = 6): Promise<ApiSuccessResponse<CollectionDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<CollectionDto[]>>('/api/v1/collections/featured', {
      params: { count }
    })
    return response.data
  }
}
