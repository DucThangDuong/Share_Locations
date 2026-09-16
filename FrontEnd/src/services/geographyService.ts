import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { RegionDto, ProvinceDto } from '@/types/models/geography.model'
import type { RegionLandingData } from '@/types/models/region.model'
import type { ProvinceLandingData } from '@/types/models/province.model'

export const geographyService = {
  async getRegions(): Promise<ApiSuccessResponse<RegionDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<RegionDto[]>>('/api/regions')
    return response.data
  },

  async getProvinces(): Promise<ApiSuccessResponse<ProvinceDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<ProvinceDto[]>>('/api/provinces')
    return response.data
  },

  async getRegionLanding(regionSlug: string): Promise<ApiSuccessResponse<RegionLandingData>> {
    const response = await apiClient.get<ApiSuccessResponse<RegionLandingData>>(
      `/api/regions/${encodeURIComponent(regionSlug)}/landing`
    )
    return response.data
  },

  async getProvinceLanding(idOrSlug: string | number): Promise<ApiSuccessResponse<ProvinceLandingData>> {
    const response = await apiClient.get<ApiSuccessResponse<ProvinceLandingData>>(
      `/api/provinces/${encodeURIComponent(idOrSlug)}/landing`
    )
    return response.data
  }
}

