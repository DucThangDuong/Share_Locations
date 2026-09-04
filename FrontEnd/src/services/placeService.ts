import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { PlaceSummaryDto, PlaceFilterParams, PlaceFilterOptionsDto } from '@/types/models/place.model'

export const placeService = {
  async getFilterOptions(): Promise<ApiSuccessResponse<PlaceFilterOptionsDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceFilterOptionsDto>>('/api/v1/places/filter-options')
    return response.data
  },

  async searchPlaces(params: PlaceFilterParams): Promise<ApiSuccessResponse<PlaceSummaryDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params.keyword?.trim()) cleanParams.Keyword = params.keyword.trim()
    if (params.regionId && params.regionId > 0) cleanParams.RegionId = params.regionId
    if (params.provinceId && params.provinceId > 0) cleanParams.ProvinceId = params.provinceId
    if (params.categoryId && params.categoryId > 0) cleanParams.CategoryId = params.categoryId
    if (params.placeTypeId && params.placeTypeId > 0) cleanParams.PlaceTypeId = params.placeTypeId
    if (params.minPrice !== undefined && params.minPrice > 0) cleanParams.MinPrice = params.minPrice
    if (params.maxPrice !== undefined && params.maxPrice > 0) cleanParams.MaxPrice = params.maxPrice
    if (params.minRating !== undefined && params.minRating > 0) cleanParams.MinRating = params.minRating
    if (params.sortBy) cleanParams.SortBy = params.sortBy
    cleanParams.Page = params.page || 1
    cleanParams.PageSize = params.pageSize || 12

    const response = await apiClient.get<ApiSuccessResponse<PlaceSummaryDto[]>>('/api/v1/places', {
      params: cleanParams
    })
    return response.data
  }
}
