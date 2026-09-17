import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { FriendItemDto, FriendsResponseDto, RespondFriendRequestDto } from '@/types/models/friend.model'

export const friendService = {
  async getFriends(): Promise<ApiSuccessResponse<FriendsResponseDto>> {
    const response = await apiClient.get<ApiSuccessResponse<FriendsResponseDto>>('/api/users/me/friends')
    return response.data
  },

  async searchUsers(query: string): Promise<ApiSuccessResponse<FriendItemDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<FriendItemDto[]>>('/api/users/search', {
      params: { q: query }
    })
    return response.data
  },

  async sendFriendRequest(targetUserId: number | string): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.post<ApiSuccessResponse<unknown>>(`/api/friends/request/${targetUserId}`, {})
    return response.data
  },

  async respondFriendRequest(
    targetUserId: number | string,
    action: 'accept' | 'reject'
  ): Promise<ApiSuccessResponse<unknown>> {
    const payload: RespondFriendRequestDto = { action }
    const response = await apiClient.put<ApiSuccessResponse<unknown>>(`/api/friends/respond/${targetUserId}`, payload)
    return response.data
  },

  async unfriend(targetUserId: number | string): Promise<ApiSuccessResponse<unknown>> {
    const response = await apiClient.delete<ApiSuccessResponse<unknown>>(`/api/friends/${targetUserId}`)
    return response.data
  }
}
