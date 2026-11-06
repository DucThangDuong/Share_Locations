import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { CategoryDto, CollectionDto, PlaceTypeDto } from '@/types/models/place.model'

export interface GetFeaturedCollectionsParams {
  count?: number
  lat?: number
  lng?: number
  intentProvinceIds?: number[]
  topCategoryIds?: number[]
}

export const catalogService = {
  async getCategories(): Promise<ApiSuccessResponse<CategoryDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<CategoryDto[]>>('/api/categories')
    return response.data
  },

  async getPlaceTypes(): Promise<ApiSuccessResponse<PlaceTypeDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceTypeDto[]>>('/api/place-types')
    return response.data
  },

  async getFeaturedCollections(
    params?: number | GetFeaturedCollectionsParams
  ): Promise<ApiSuccessResponse<CollectionDto[]>> {
    let queryParams: Record<string, unknown> = {}
    if (typeof params === 'number') {
      queryParams = { count: params }
    } else if (params) {
      queryParams = {
        count: params.count,
        lat: params.lat,
        lng: params.lng,
        intentProvinceIds:
          params.intentProvinceIds && params.intentProvinceIds.length > 0
            ? params.intentProvinceIds.join(',')
            : undefined,
        topCategoryIds:
          params.topCategoryIds && params.topCategoryIds.length > 0
            ? params.topCategoryIds.join(',')
            : undefined
      }
    }
    const response = await apiClient.get<ApiSuccessResponse<CollectionDto[]>>('/api/collections/featured', {
      params: queryParams
    })
    return response.data
  }
}
