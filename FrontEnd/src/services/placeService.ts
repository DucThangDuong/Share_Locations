import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type {
  PlaceSummaryDto,
  PlaceDetailDto,
  PlaceFilterParams,
  PlaceFilterOptionsDto,
  PlaceReviewSummaryDto,
  ReviewItemDto,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReportPlaceRequest,
  ToggleSavePlaceDto,
  PlaceMapItemDto,
  PlaceMapFilterParams,
  CommentDto,
  CreateReviewCommentRequest,
  UpdateReviewCommentRequest,
  ReviewCommentsDto
} from '@/types/models/place.model'

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

export const placeService = {
  async getFilterOptions(): Promise<ApiSuccessResponse<PlaceFilterOptionsDto>> {
    return getWithFallback<PlaceFilterOptionsDto>('/api/places/filter-options', '/api/v1/places/filter-options')
  },

  async searchPlaces(params: PlaceFilterParams): Promise<ApiSuccessResponse<PlaceSummaryDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    if (params.regionId && params.regionId > 0) cleanParams.regionId = params.regionId
    if (params.provinceId && params.provinceId > 0) cleanParams.provinceId = params.provinceId
    if (params.categoryId && params.categoryId > 0) cleanParams.categoryId = params.categoryId
    if (params.placeTypeId && params.placeTypeId > 0) cleanParams.placeTypeId = params.placeTypeId
    if (params.minPrice !== undefined && params.minPrice > 0) cleanParams.minPrice = params.minPrice
    if (params.maxPrice !== undefined && params.maxPrice > 0) cleanParams.maxPrice = params.maxPrice
    if (params.minRating !== undefined && params.minRating > 0) cleanParams.minRating = params.minRating
    if (params.sortBy) cleanParams.sortBy = params.sortBy
    cleanParams.page = params.page || 1
    cleanParams.pageSize = params.pageSize || 12

    const response = await apiClient.get<ApiSuccessResponse<PlaceSummaryDto[]>>('/api/v1/places', {
      params: cleanParams
    })
    return response.data
  },

  async getPlaceById(id: number | string): Promise<ApiSuccessResponse<PlaceDetailDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceDetailDto>>(`/api/v1/places/${id}`)
    return response.data
  },

  async getPlaceReviews(id: number | string, params?: { page?: number; pageSize?: number; rating?: number }): Promise<ApiSuccessResponse<PlaceReviewSummaryDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceReviewSummaryDto>>(`/api/v1/places/${id}/reviews`, {
      params
    })
    return response.data
  },

  async submitReview(data: CreateReviewRequest): Promise<ApiSuccessResponse<ReviewItemDto>> {
    const formData = new FormData()
    formData.append('Rating', String(data.rating))
    if (data.content?.trim()) {
      formData.append('Content', data.content.trim())
    }
    if (data.visitDate?.trim()) {
      formData.append('VisitDate', data.visitDate.trim())
    }
    if (data.images && data.images.length > 0) {
      data.images.forEach((url) => formData.append('Images', url))
    }
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((file) => formData.append('Photos', file))
    }
    if (data.videos && data.videos.length > 0) {
      data.videos.forEach((file) => formData.append('Videos', file))
    }

    return postWithFallback<ReviewItemDto>(
      `/api/places/${data.placeId}/reviews`,
      `/api/v1/places/${data.placeId}/reviews`,
      formData
    )
  },

  async updateReview(data: UpdateReviewRequest): Promise<ApiSuccessResponse<ReviewItemDto>> {
    const formData = new FormData()
    formData.append('Rating', String(data.rating))
    if (data.content?.trim()) {
      formData.append('Content', data.content.trim())
    }
    if (data.visitDate?.trim()) {
      formData.append('VisitDate', data.visitDate.trim())
    }
    if (data.existingMediaUrls && data.existingMediaUrls.length > 0) {
      data.existingMediaUrls.forEach((url: string) => formData.append('ExistingMediaUrls', url))
    }
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((file: File) => formData.append('Photos', file))
    }
    if (data.videos && data.videos.length > 0) {
      data.videos.forEach((file: File) => formData.append('Videos', file))
    }

    return putWithFallback<ReviewItemDto>(
      `/api/reviews/${data.reviewId}`,
      `/api/v1/reviews/${data.reviewId}`,
      formData
    )
  },

  async deleteReview(reviewId: number | string): Promise<ApiSuccessResponse<boolean>> {
    return deleteWithFallback<boolean>(`/api/reviews/${reviewId}`, `/api/v1/reviews/${reviewId}`)
  },

  async getReviewComments(reviewId: number | string): Promise<ApiSuccessResponse<ReviewCommentsDto>> {
    return getWithFallback<ReviewCommentsDto>(`/api/reviews/${reviewId}/comments`, `/api/v1/reviews/${reviewId}/comments`)
  },

  async createReviewComment(data: CreateReviewCommentRequest): Promise<ApiSuccessResponse<CommentDto>> {
    return postWithFallback<CommentDto>(`/api/reviews/${data.reviewId}/comments`, `/api/v1/reviews/${data.reviewId}/comments`, {
      content: data.content,
      parentId: data.parentId ?? null
    })
  },

  async updateReviewComment(data: UpdateReviewCommentRequest): Promise<ApiSuccessResponse<CommentDto>> {
    return putWithFallback<CommentDto>(`/api/reviews/comments/${data.commentId}`, `/api/v1/reviews/comments/${data.commentId}`, {
      content: data.content
    })
  },

  async deleteReviewComment(commentId: number | string): Promise<ApiSuccessResponse<boolean>> {
    return deleteWithFallback<boolean>(`/api/reviews/comments/${commentId}`, `/api/v1/reviews/comments/${commentId}`)
  },

  async reportPlace(data: ReportPlaceRequest): Promise<ApiSuccessResponse<boolean>> {
    return postWithFallback<boolean>(`/api/places/${data.placeId}/reports`, `/api/v1/places/${data.placeId}/reports`, {
      reason: data.reason,
      description: data.description,
      contactEmail: data.contactEmail
    })
  },

  async savePlace(placeId: number | string): Promise<ApiSuccessResponse<ToggleSavePlaceDto>> {
    return postWithFallback<ToggleSavePlaceDto>('/api/users/me/favorites', '/api/v1/users/me/favorites', {
      targetType: 1,
      targetId: Number(placeId)
    })
  },

  async unsavePlace(placeId: number | string): Promise<ApiSuccessResponse<ToggleSavePlaceDto>> {
    return deleteWithFallback<ToggleSavePlaceDto>(`/api/users/me/favorites/1/${placeId}`, `/api/v1/users/me/favorites/1/${placeId}`)
  },

  async getPlacesMap(params?: PlaceMapFilterParams): Promise<ApiSuccessResponse<PlaceMapItemDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params?.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    if (params?.region && params.region !== 'all') cleanParams.region = params.region
    if (params?.provinceId && params.provinceId > 0) cleanParams.provinceId = params.provinceId
    if (params?.categoryId && params.categoryId > 0) cleanParams.categoryId = params.categoryId
    if (params?.minLng !== undefined) cleanParams.minLng = params.minLng
    if (params?.minLat !== undefined) cleanParams.minLat = params.minLat
    if (params?.maxLng !== undefined) cleanParams.maxLng = params.maxLng
    if (params?.maxLat !== undefined) cleanParams.maxLat = params.maxLat

    return getWithFallback<PlaceMapItemDto[]>('/api/places/map', '/api/v1/places/map', {
      params: cleanParams
    })
  },

  async recordAccessHistory(placeId: number | string): Promise<ApiSuccessResponse<boolean>> {
    return postWithFallback<boolean>(
      `/api/places/${placeId}/access-history`,
      `/api/v1/places/${placeId}/access-history`
    )
  }
}
