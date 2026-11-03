import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { RegionDto, ProvinceDto } from '@/types/models/geography.model'
import type { RegionLandingData, RegionHeroImage } from '@/types/models/region.model'
import type { ProvinceLandingData } from '@/types/models/province.model'
import type { PagedResultDto } from '@/types/models/userProfile.model'

export type { RegionDto, ProvinceDto }

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
  },

  async getRegionPhotos(
    regionSlug: string,
    page = 1,
    pageSize = 20
  ): Promise<ApiSuccessResponse<PagedResultDto<RegionHeroImage>>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<RegionHeroImage>>>(
      `/api/regions/${encodeURIComponent(regionSlug)}/photos`,
      { params: { page, pageSize } }
    )
    return response.data
  },

  async getProvincePhotos(
    idOrSlug: string | number,
    page = 1,
    pageSize = 20
  ): Promise<ApiSuccessResponse<PagedResultDto<RegionHeroImage>>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<RegionHeroImage>>>(
      `/api/provinces/${encodeURIComponent(idOrSlug)}/photos`,
      { params: { page, pageSize } }
    )
    return response.data
  }
}
