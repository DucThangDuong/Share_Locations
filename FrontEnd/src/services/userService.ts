import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type {
  FavoriteItem,
  VisitLogItem,
  ProposalItem,
  UserReviewItem,
  UserCommentItem,
  UserBlogItem,
  UserAccessHistoryItem,
  PagedResultDto,
  CreateVisitLogRequest,
  UpdateVisitLogRequest,
  CreateProposalRequest
} from '@/types/models/userProfile.model'

export const userService = {
  async getMyFavorites(params?: {
    targetType?: number
    keyword?: string
    sortBy?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<FavoriteItem[] | PagedResultDto<FavoriteItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<FavoriteItem[] | PagedResultDto<FavoriteItem>>>(
      '/api/users/me/favorites',
      { params }
    )
    return response.data
  },

  async addFavorite(targetType: number, targetId: number | string): Promise<ApiSuccessResponse<{ isSaved: boolean; targetType: number; targetId: number }>> {
    const response = await apiClient.post<ApiSuccessResponse<{ isSaved: boolean; targetType: number; targetId: number }>>(
      '/api/users/me/favorites',
      { targetType, targetId: Number(targetId) }
    )
    return response.data
  },

  async removeFavorite(targetType: number, targetId: number | string): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(
      `/api/users/me/favorites/${targetType}/${Number(targetId)}`
    )
    return response.data
  },

  async getMyVisitLogs(params?: {
    privacy?: number
    keyword?: string
    sortBy?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<VisitLogItem[] | PagedResultDto<VisitLogItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<VisitLogItem[] | PagedResultDto<VisitLogItem>>>(
      '/api/users/me/visit-logs',
      { params }
    )
    return response.data
  },

  async createVisitLog(data: CreateVisitLogRequest): Promise<ApiSuccessResponse<VisitLogItem>> {
    const response = await apiClient.post<ApiSuccessResponse<VisitLogItem>>(
      '/api/users/me/visit-logs',
      data
    )
    return response.data
  },

  async updateVisitLog(id: number, data: UpdateVisitLogRequest): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.put<ApiSuccessResponse<boolean>>(
      `/api/users/me/visit-logs/${id}`,
      data
    )
    return response.data
  },

  async changeVisitLogPrivacy(id: number, privacy: number): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.patch<ApiSuccessResponse<boolean>>(
      `/api/users/me/visit-logs/${id}/privacy`,
      { privacy }
    )
    return response.data
  },

  async deleteVisitLog(id: number): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(
      `/api/users/me/visit-logs/${id}`
    )
    return response.data
  },

  async getMyReviews(params?: {
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserReviewItem[] | PagedResultDto<UserReviewItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<UserReviewItem[] | PagedResultDto<UserReviewItem>>>(
      '/api/users/me/reviews',
      { params }
    )
    return response.data
  },

  async getMyComments(params?: {
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserCommentItem[] | PagedResultDto<UserCommentItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<UserCommentItem[] | PagedResultDto<UserCommentItem>>>(
      '/api/users/me/comments',
      { params }
    )
    return response.data
  },

  async getMyBlogs(params?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserBlogItem[] | PagedResultDto<UserBlogItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<UserBlogItem[] | PagedResultDto<UserBlogItem>>>(
      '/api/users/me/blogs',
      { params }
    )
    return response.data
  },

  async getMyProposals(params?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<ProposalItem[] | PagedResultDto<ProposalItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<ProposalItem[] | PagedResultDto<ProposalItem>>>(
      '/api/users/me/proposals',
      { params }
    )
    return response.data
  },

  async createProposal(data: CreateProposalRequest): Promise<ApiSuccessResponse<ProposalItem>> {
    const response = await apiClient.post<ApiSuccessResponse<ProposalItem>>(
      '/api/proposals',
      data
    )
    return response.data
  },

  async deleteProposal(id: number): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(
      `/api/proposals/${id}`
    )
    return response.data
  },

  async getAccessHistories(limit: number = 10): Promise<ApiSuccessResponse<UserAccessHistoryItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<UserAccessHistoryItem[]>>(
      '/api/users/me/access-histories',
      { params: { limit } }
    )
    return response.data
  },

  async recordAccessHistory(placeId: number | string): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>(
      `/api/places/${placeId}/access-history`
    )
    return response.data
  }
}
