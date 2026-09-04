import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { RegionDto, ProvinceDto } from '@/types/models/geography.model'

export const geographyService = {
  async getRegions(): Promise<ApiSuccessResponse<RegionDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<RegionDto[]>>('/api/v1/regions')
    return response.data
  },

  async getProvinces(): Promise<ApiSuccessResponse<ProvinceDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<ProvinceDto[]>>('/api/v1/provinces')
    return response.data
  }
}
