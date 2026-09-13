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

async function patchWithFallback<T>(url1: string, url2: string, data?: unknown, config?: Record<string, unknown>): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await apiClient.patch<ApiSuccessResponse<T>>(url1, data, config)
    return response.data
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr?.response?.status === 404) {
      const response = await apiClient.patch<ApiSuccessResponse<T>>(url2, data, config)
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

export const userService = {
  async getMyFavorites(params?: {
    targetType?: number
    keyword?: string
    sortBy?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<FavoriteItem[] | PagedResultDto<FavoriteItem>>> {
    return getWithFallback<FavoriteItem[] | PagedResultDto<FavoriteItem>>(
      '/api/users/me/favorites',
      '/api/v1/users/me/favorites',
      { params }
    )
  },

  async addFavorite(targetType: number, targetId: number | string): Promise<ApiSuccessResponse<{ isSaved: boolean; targetType: number; targetId: number }>> {
    return postWithFallback<{ isSaved: boolean; targetType: number; targetId: number }>(
      '/api/users/me/favorites',
      '/api/v1/users/me/favorites',
      { targetType, targetId: Number(targetId) }
    )
  },

  async removeFavorite(targetType: number, targetId: number | string): Promise<ApiSuccessResponse<boolean>> {
    return deleteWithFallback<boolean>(
      `/api/users/me/favorites/${targetType}/${Number(targetId)}`,
      `/api/v1/users/me/favorites/${targetType}/${Number(targetId)}`
    )
  },

  async getMyVisitLogs(params?: {
    privacy?: number
    keyword?: string
    sortBy?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<VisitLogItem[] | PagedResultDto<VisitLogItem>>> {
    return getWithFallback<VisitLogItem[] | PagedResultDto<VisitLogItem>>(
      '/api/users/me/visit-logs',
      '/api/v1/users/me/visit-logs',
      { params }
    )
  },

  async createVisitLog(data: CreateVisitLogRequest): Promise<ApiSuccessResponse<VisitLogItem>> {
    return postWithFallback<VisitLogItem>(
      '/api/users/me/visit-logs',
      '/api/v1/users/me/visit-logs',
      data
    )
  },

  async updateVisitLog(id: number, data: UpdateVisitLogRequest): Promise<ApiSuccessResponse<boolean>> {
    return putWithFallback<boolean>(
      `/api/users/me/visit-logs/${id}`,
      `/api/v1/users/me/visit-logs/${id}`,
      data
    )
  },

  async changeVisitLogPrivacy(id: number, privacy: number): Promise<ApiSuccessResponse<boolean>> {
    return patchWithFallback<boolean>(
      `/api/users/me/visit-logs/${id}/privacy`,
      `/api/v1/users/me/visit-logs/${id}/privacy`,
      { privacy }
    )
  },

  async deleteVisitLog(id: number): Promise<ApiSuccessResponse<boolean>> {
    return deleteWithFallback<boolean>(
      `/api/users/me/visit-logs/${id}`,
      `/api/v1/users/me/visit-logs/${id}`
    )
  },

  async getMyReviews(params?: {
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserReviewItem[] | PagedResultDto<UserReviewItem>>> {
    return getWithFallback<UserReviewItem[] | PagedResultDto<UserReviewItem>>(
      '/api/users/me/reviews',
      '/api/v1/users/me/reviews',
      { params }
    )
  },

  async getMyComments(params?: {
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserCommentItem[] | PagedResultDto<UserCommentItem>>> {
    return getWithFallback<UserCommentItem[] | PagedResultDto<UserCommentItem>>(
      '/api/users/me/comments',
      '/api/v1/users/me/comments',
      { params }
    )
  },

  async getMyBlogs(params?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserBlogItem[] | PagedResultDto<UserBlogItem>>> {
    return getWithFallback<UserBlogItem[] | PagedResultDto<UserBlogItem>>(
      '/api/users/me/blogs',
      '/api/v1/users/me/blogs',
      { params }
    )
  },

  async getMyProposals(params?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<ProposalItem[] | PagedResultDto<ProposalItem>>> {
    return getWithFallback<ProposalItem[] | PagedResultDto<ProposalItem>>(
      '/api/users/me/proposals',
      '/api/v1/users/me/proposals',
      { params }
    )
  },

  async createProposal(data: CreateProposalRequest): Promise<ApiSuccessResponse<ProposalItem>> {
    return postWithFallback<ProposalItem>(
      '/api/proposals',
      '/api/v1/proposals',
      data
    )
  },

  async deleteProposal(id: number): Promise<ApiSuccessResponse<boolean>> {
    return deleteWithFallback<boolean>(
      `/api/proposals/${id}`,
      `/api/v1/proposals/${id}`
    )
  },

  async getAccessHistories(limit: number = 10): Promise<ApiSuccessResponse<UserAccessHistoryItem[]>> {
    return getWithFallback<UserAccessHistoryItem[]>(
      '/api/users/me/access-histories',
      '/api/v1/users/me/access-histories',
      { params: { limit } }
    )
  },

  async recordAccessHistory(placeId: number | string): Promise<ApiSuccessResponse<boolean>> {
    return postWithFallback<boolean>(
      `/api/places/${placeId}/access-history`,
      `/api/v1/places/${placeId}/access-history`
    )
  }
}
