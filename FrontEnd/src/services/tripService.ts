import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { PagedResultDto } from '@/types/models/userProfile.model'
import type {
  UserTripSummaryDto,
  CreateTripRequestDto,
  CreateTripResponseDto,
  TripDetailDto,
  TripPlaceDetailDto,
  UpdateTripRequestDto,
  AddTripPlaceRequestDto,
  UpdateTripPlaceRequestDto,
  InviteTripMemberRequestDto
} from '@/types/models/trip.model'

async function getWithFallback<T>(url1: string, url2: string, config?: Record<string, unknown>): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await apiClient.get<ApiSuccessResponse<T>>(url1, config)
    return response.data
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr?.response?.status === 404) {
      const response = await apiClient.get<ApiSuccessResponse<T>>(url2, config)
      return response.data
    }
    throw err
  }
}

async function postWithFallback<T>(url1: string, url2: string, data?: unknown, config?: Record<string, unknown>): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await apiClient.post<ApiSuccessResponse<T>>(url1, data, config)
    return response.data
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr?.response?.status === 404) {
      const response = await apiClient.post<ApiSuccessResponse<T>>(url2, data, config)
      return response.data
    }
    throw err
  }
}

async function putWithFallback<T>(url1: string, url2: string, data?: unknown, config?: Record<string, unknown>): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await apiClient.put<ApiSuccessResponse<T>>(url1, data, config)
    return response.data
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr?.response?.status === 404) {
      const response = await apiClient.put<ApiSuccessResponse<T>>(url2, data, config)
      return response.data
    }
    throw err
  }
}

async function deleteWithFallback<T>(url1: string, url2: string, config?: Record<string, unknown>): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await apiClient.delete<ApiSuccessResponse<T>>(url1, config)
    return response.data
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr?.response?.status === 404) {
      const response = await apiClient.delete<ApiSuccessResponse<T>>(url2, config)
      return response.data
    }
    throw err
  }
}

export const tripService = {
  async getUserTrips(params?: {
    status?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<PagedResultDto<UserTripSummaryDto>>> {
    return getWithFallback<PagedResultDto<UserTripSummaryDto>>(
      '/api/v1/users/me/trips',
      '/api/users/me/trips',
      { params }
    )
  },

  async createTrip(data: CreateTripRequestDto): Promise<ApiSuccessResponse<CreateTripResponseDto>> {
    return postWithFallback<CreateTripResponseDto>(
      '/api/v1/trips',
      '/api/trips',
      data
    )
  },

  async getTripDetail(id: number | string): Promise<ApiSuccessResponse<TripDetailDto>> {
    return getWithFallback<TripDetailDto>(
      `/api/v1/trips/${id}`,
      `/api/trips/${id}`
    )
  },

  async updateTrip(id: number | string, data: UpdateTripRequestDto): Promise<ApiSuccessResponse<unknown>> {
    return putWithFallback<unknown>(
      `/api/v1/trips/${id}`,
      `/api/trips/${id}`,
      data
    )
  },

  async deleteTrip(id: number | string): Promise<ApiSuccessResponse<unknown>> {
    return deleteWithFallback<unknown>(
      `/api/v1/trips/${id}`,
      `/api/trips/${id}`
    )
  },

  async addTripPlace(
    tripId: number | string,
    dayNumber: number,
    data: AddTripPlaceRequestDto
  ): Promise<ApiSuccessResponse<TripPlaceDetailDto>> {
    return postWithFallback<TripPlaceDetailDto>(
      `/api/v1/trips/${tripId}/days/${dayNumber}/places`,
      `/api/trips/${tripId}/days/${dayNumber}/places`,
      data
    )
  },

  async updateTripPlace(
    tripPlaceId: number | string,
    data: UpdateTripPlaceRequestDto
  ): Promise<ApiSuccessResponse<unknown>> {
    return putWithFallback<unknown>(
      `/api/v1/trips/places/${tripPlaceId}`,
      `/api/trips/places/${tripPlaceId}`,
      data
    )
  },

  async deleteTripPlace(tripPlaceId: number | string): Promise<ApiSuccessResponse<unknown>> {
    return deleteWithFallback<unknown>(
      `/api/v1/trips/places/${tripPlaceId}`,
      `/api/trips/places/${tripPlaceId}`
    )
  },

  async inviteMember(
    tripId: number | string,
    data: InviteTripMemberRequestDto
  ): Promise<ApiSuccessResponse<unknown>> {
    return postWithFallback<unknown>(
      `/api/v1/trips/${tripId}/members`,
      `/api/trips/${tripId}/members`,
      data
    )
  },

  async removeMember(
    tripId: number | string,
    userId: number | string
  ): Promise<ApiSuccessResponse<unknown>> {
    return deleteWithFallback<unknown>(
      `/api/v1/trips/${tripId}/members/${userId}`,
      `/api/trips/${tripId}/members/${userId}`
    )
  }
}
