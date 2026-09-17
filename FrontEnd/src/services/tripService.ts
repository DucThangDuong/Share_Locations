import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { PagedResultDto } from '@/types/models/userProfile.model'
import type {
  UserTripSummaryDto,
  CreateTripRequestDto,
  CreateTripResponseDto,
  TripDetailDto,
  TripDayDetailDto,
  TripPlaceDetailDto,
  UpdateTripRequestDto,
  UpdateTripDayRequestDto,
  AddTripDayRequestDto,
  AddTripPlaceRequestDto,
  UpdateTripPlaceRequestDto,
  InviteTripMemberRequestDto
} from '@/types/models/trip.model'

export const tripService = {
  async getUserTrips(params?: {
    status?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<PagedResultDto<UserTripSummaryDto>>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<UserTripSummaryDto>>>('/api/users/me/trips', {
      params
    })
    return response.data
  },

  async createTrip(data: CreateTripRequestDto): Promise<ApiSuccessResponse<CreateTripResponseDto>> {
    const response = await apiClient.post<ApiSuccessResponse<CreateTripResponseDto>>('/api/trips', data)
    return response.data
  },

  async getTripDetail(id: number | string): Promise<ApiSuccessResponse<TripDetailDto>> {
    const response = await apiClient.get<ApiSuccessResponse<TripDetailDto>>(`/api/trips/${id}`)
    return response.data
  },

  async updateTrip(id: number | string, data: UpdateTripRequestDto): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.put<ApiSuccessResponse<unknown>>(`/api/trips/${id}`, data)
    return response.data
  },

  async deleteTrip(id: number | string): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.delete<ApiSuccessResponse<unknown>>(`/api/trips/${id}`)
    return response.data
  },

  async addTripDay(
    tripId: number | string,
    data?: AddTripDayRequestDto
  ): Promise<ApiSuccessResponse<TripDayDetailDto>> {
    const response = await apiClient.post<ApiSuccessResponse<TripDayDetailDto>>(
      `/api/trips/${tripId}/days`,
      data || {}
    )
    return response.data
  },

  async updateTripDay(
    tripId: number | string,
    dayNumber: number,
    data: UpdateTripDayRequestDto
  ): Promise<ApiSuccessResponse<TripDayDetailDto>> {
    const response = await apiClient.put<ApiSuccessResponse<TripDayDetailDto>>(
      `/api/trips/${tripId}/days/${dayNumber}`,
      data
    )
    return response.data
  },

  async deleteTripDay(
    tripId: number | string,
    dayNumber: number
  ): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.delete<ApiSuccessResponse<unknown>>(
      `/api/trips/${tripId}/days/${dayNumber}`
    )
    return response.data
  },

  async addTripPlace(
    tripId: number | string,
    dayNumber: number,
    data: AddTripPlaceRequestDto
  ): Promise<ApiSuccessResponse<TripPlaceDetailDto>> {
    const response = await apiClient.post<ApiSuccessResponse<TripPlaceDetailDto>>(
      `/api/trips/${tripId}/days/${dayNumber}/places`,
      data
    )
    return response.data
  },

  async updateTripPlace(
    tripPlaceId: number | string,
    data: UpdateTripPlaceRequestDto
  ): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.put<ApiSuccessResponse<unknown>>(`/api/trips/places/${tripPlaceId}`, data)
    return response.data
  },

  async deleteTripPlace(tripPlaceId: number | string): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.delete<ApiSuccessResponse<unknown>>(`/api/trips/places/${tripPlaceId}`)
    return response.data
  },

  async inviteMember(
    tripId: number | string,
    data: InviteTripMemberRequestDto
  ): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.post<ApiSuccessResponse<unknown>>(`/api/trips/${tripId}/members`, data)
    return response.data
  },

  async removeMember(
    tripId: number | string,
    userId: number | string
  ): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.delete<ApiSuccessResponse<unknown>>(`/api/trips/${tripId}/members/${userId}`)
    return response.data
  }
}
