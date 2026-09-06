import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { ItineraryDto, ItineraryFilterParams, SaveItineraryResponseDto } from '@/types/models/place.model'

export const itineraryService = {
  async getItineraries(params?: ItineraryFilterParams): Promise<ApiSuccessResponse<ItineraryDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params?.duration && params.duration !== 'all') cleanParams.duration = params.duration
    if (params?.region && params.region !== 'all') cleanParams.region = params.region
    if (params?.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    cleanParams.page = params?.page || 1
    cleanParams.pageSize = params?.pageSize || 10

    const response = await apiClient.get<ApiSuccessResponse<ItineraryDto[]>>('/api/v1/itineraries', {
      params: cleanParams
    })
    return response.data
  },

  async saveItinerary(id: number | string): Promise<ApiSuccessResponse<SaveItineraryResponseDto>> {
    const response = await apiClient.post<ApiSuccessResponse<SaveItineraryResponseDto>>(`/api/v1/itineraries/${id}/save`)
    return response.data
  }
}
