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
  ReviewCommentsDto,
  ReviewLikeResponseDto
} from '@/types/models/place.model'

export const placeService = {
  async getFilterOptions(): Promise<ApiSuccessResponse<PlaceFilterOptionsDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceFilterOptionsDto>>('/api/places/filter-options')
    return response.data
  },

  async searchPlaces(params: PlaceFilterParams): Promise<ApiSuccessResponse<PlaceSummaryDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    if (params.regionId && params.regionId > 0) cleanParams.regionId = params.regionId
    if (params.regionIds && params.regionIds.length > 0) cleanParams.regionIds = params.regionIds
    if (params.provinceId && params.provinceId > 0) cleanParams.provinceId = params.provinceId
    if (params.provinceIds && params.provinceIds.length > 0) cleanParams.provinceIds = params.provinceIds
    if (params.categoryId && params.categoryId > 0) cleanParams.categoryId = params.categoryId
    if (params.categoryIds && params.categoryIds.length > 0) cleanParams.categoryIds = params.categoryIds
    if (params.placeTypeId && params.placeTypeId > 0) cleanParams.placeTypeId = params.placeTypeId
    if (params.placeTypeIds && params.placeTypeIds.length > 0) cleanParams.placeTypeIds = params.placeTypeIds
    if (params.minPrice !== undefined && params.minPrice > 0) cleanParams.minPrice = params.minPrice
    if (params.maxPrice !== undefined && params.maxPrice > 0) cleanParams.maxPrice = params.maxPrice
    if (params.minRating !== undefined && params.minRating > 0) cleanParams.minRating = params.minRating
    if (params.sortBy) cleanParams.sortBy = params.sortBy
    cleanParams.page = params.page || 1
    cleanParams.pageSize = params.pageSize || 12

    const response = await apiClient.get<ApiSuccessResponse<PlaceSummaryDto[]>>('/api/places', {
      params: cleanParams
    })
    return response.data
  },

  async getPlaceById(id: number | string): Promise<ApiSuccessResponse<PlaceDetailDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceDetailDto>>(`/api/places/${id}`)
    return response.data
  },

  async getPlaceReviews(id: number | string, params?: { page?: number; pageSize?: number; rating?: number }): Promise<ApiSuccessResponse<PlaceReviewSummaryDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceReviewSummaryDto>>(`/api/places/${id}/reviews`, {
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

    const response = await apiClient.post<ApiSuccessResponse<ReviewItemDto>>(
      `/api/places/${data.placeId}/reviews`,
      formData
    )
    return response.data
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

    const response = await apiClient.put<ApiSuccessResponse<ReviewItemDto>>(
      `/api/reviews/${data.reviewId}`,
      formData
    )
    return response.data
  },

  async deleteReview(reviewId: number | string): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(`/api/reviews/${reviewId}`)
    return response.data
  },

  async getReviewComments(reviewId: number | string): Promise<ApiSuccessResponse<ReviewCommentsDto>> {
    const response = await apiClient.get<ApiSuccessResponse<ReviewCommentsDto>>(`/api/reviews/${reviewId}/comments`)
    return response.data
  },

  async createReviewComment(data: CreateReviewCommentRequest): Promise<ApiSuccessResponse<CommentDto>> {
    const response = await apiClient.post<ApiSuccessResponse<CommentDto>>(`/api/reviews/${data.reviewId}/comments`, {
      content: data.content,
      parentId: data.parentId ?? null
    })
    return response.data
  },

  async updateReviewComment(data: UpdateReviewCommentRequest): Promise<ApiSuccessResponse<CommentDto>> {
    const response = await apiClient.put<ApiSuccessResponse<CommentDto>>(`/api/reviews/comments/${data.commentId}`, {
      content: data.content
    })
    return response.data
  },

  async deleteReviewComment(commentId: number | string): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(`/api/reviews/comments/${commentId}`)
    return response.data
  },

  async toggleReviewLike(reviewId: number | string): Promise<ApiSuccessResponse<ReviewLikeResponseDto>> {
    const response = await apiClient.post<ApiSuccessResponse<ReviewLikeResponseDto>>(`/api/reviews/${reviewId}/toggle-like`, {})
    return response.data
  },

  async reportPlace(data: ReportPlaceRequest): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>(`/api/places/${data.placeId}/reports`, {
      reason: data.reason,
      description: data.description,
      contactEmail: data.contactEmail
    })
    return response.data
  },

  async savePlace(placeId: number | string): Promise<ApiSuccessResponse<ToggleSavePlaceDto>> {
    const response = await apiClient.post<ApiSuccessResponse<ToggleSavePlaceDto>>('/api/users/me/favorites', {
      targetType: 1,
      targetId: Number(placeId)
    })
    return response.data
  },

  async unsavePlace(placeId: number | string): Promise<ApiSuccessResponse<ToggleSavePlaceDto>> {
    const response = await apiClient.delete<ApiSuccessResponse<ToggleSavePlaceDto>>(`/api/users/me/favorites/1/${placeId}`)
    return response.data
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

    const response = await apiClient.get<ApiSuccessResponse<PlaceMapItemDto[]>>('/api/places/map', {
      params: cleanParams
    })
    return response.data
  },

  async recordAccessHistory(placeId: number | string): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>(`/api/places/${placeId}/access-history`, {})
    return response.data
  }
}
