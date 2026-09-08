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
  ReportPlaceRequest,
  ToggleSavePlaceDto,
  PlaceMapItemDto,
  PlaceMapFilterParams,
  CommentDto,
  CreateReviewCommentRequest,
  ReviewCommentsDto
} from '@/types/models/place.model'

export const placeService = {
  async getFilterOptions(): Promise<ApiSuccessResponse<PlaceFilterOptionsDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PlaceFilterOptionsDto>>('/api/v1/places/filter-options')
    return response.data
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
    const response = await apiClient.post<ApiSuccessResponse<ReviewItemDto>>(`/api/v1/places/${data.placeId}/reviews`, {
      rating: data.rating,
      content: data.content,
      visitDate: data.visitDate,
      images: data.images
    })
    return response.data
  },

  async getReviewComments(reviewId: number | string): Promise<ApiSuccessResponse<ReviewCommentsDto>> {
    const response = await apiClient.get<ApiSuccessResponse<ReviewCommentsDto>>(`/api/v1/reviews/${reviewId}/comments`)
    return response.data
  },

  async createReviewComment(data: CreateReviewCommentRequest): Promise<ApiSuccessResponse<CommentDto>> {
    const response = await apiClient.post<ApiSuccessResponse<CommentDto>>(`/api/v1/reviews/${data.reviewId}/comments`, {
      content: data.content,
      parentId: data.parentId ?? null
    })
    return response.data
  },

  async reportPlace(data: ReportPlaceRequest): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>(`/api/v1/places/${data.placeId}/reports`, {
      reason: data.reason,
      description: data.description,
      contactEmail: data.contactEmail
    })
    return response.data
  },

  async savePlace(placeId: number | string): Promise<ApiSuccessResponse<ToggleSavePlaceDto>> {
    const response = await apiClient.post<ApiSuccessResponse<ToggleSavePlaceDto>>(`/api/v1/places/${placeId}/save`)
    return response.data
  },

  async unsavePlace(placeId: number | string): Promise<ApiSuccessResponse<ToggleSavePlaceDto>> {
    const response = await apiClient.delete<ApiSuccessResponse<ToggleSavePlaceDto>>(`/api/v1/places/${placeId}/save`)
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

    const response = await apiClient.get<ApiSuccessResponse<PlaceMapItemDto[]>>('/api/v1/places/map', {
      params: cleanParams
    })
    return response.data
  }
}
