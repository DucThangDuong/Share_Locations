import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { FriendItemDto, FriendsResponseDto, RespondFriendRequestDto } from '@/types/models/friend.model'

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

export const friendService = {
  async getFriends(): Promise<ApiSuccessResponse<FriendsResponseDto>> {
    return getWithFallback<FriendsResponseDto>(
      '/api/v1/users/me/friends',
      '/api/users/me/friends'
    )
  },

  async searchUsers(query: string): Promise<ApiSuccessResponse<FriendItemDto[]>> {
    return getWithFallback<FriendItemDto[]>(
      '/api/v1/users/search',
      '/api/users/search',
      { params: { q: query } }
    )
  },

  async sendFriendRequest(targetUserId: number | string): Promise<ApiSuccessResponse<unknown>> {
    return postWithFallback<unknown>(
      `/api/v1/friends/request/${targetUserId}`,
      `/api/friends/request/${targetUserId}`
    )
  },

  async respondFriendRequest(
    targetUserId: number | string,
    action: 'accept' | 'reject'
  ): Promise<ApiSuccessResponse<unknown>> {
    const payload: RespondFriendRequestDto = { action }
    return putWithFallback<unknown>(
      `/api/v1/friends/respond/${targetUserId}`,
      `/api/friends/respond/${targetUserId}`,
      payload
    )
  },

  async unfriend(targetUserId: number | string): Promise<ApiSuccessResponse<unknown>> {
    return deleteWithFallback<unknown>(
      `/api/v1/friends/${targetUserId}`,
      `/api/friends/${targetUserId}`
    )
  }
}

