import { apiClient } from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type {
  SimilarPlaceItem,
  RecommendedPlaceItem,
  RecommendedFoodItem,
  DualContextHomeFeedResponse
} from '@/types/recommendation.types'

export interface GetDualContextHomeFeedParams {
  lat?: number
  lng?: number
  intentProvinceId?: number
  intentProvinceIds?: string
  intentLabel?: string
  topCategoryIds?: string
  excludePlaceIds?: string
  topK?: number
}

export interface GetSimilarPlacesParams {
  topK?: number
  radiusKm?: number
}

export interface GetTripSuggestedPlacesParams {
  provinceId?: number
  topK?: number
}

export interface GetRecommendedFoodsParams {
  topK?: number
}

export const recommendationService = {
  async getSimilarPlaces(
    placeId: number | string,
    params?: GetSimilarPlacesParams
  ): Promise<ApiSuccessResponse<SimilarPlaceItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<SimilarPlaceItem[]>>(
      `/api/recommendations/places/${placeId}/similar`,
      { params }
    )
    return response.data
  },

  async getTripPlaceSuggestions(
    tripId: number | string,
    params?: GetTripSuggestedPlacesParams
  ): Promise<ApiSuccessResponse<RecommendedPlaceItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<RecommendedPlaceItem[]>>(
      `/api/recommendations/trips/${tripId}/suggested-places`,
      { params }
    )
    return response.data
  },

  async getRecommendedFoods(params?: GetRecommendedFoodsParams): Promise<ApiSuccessResponse<RecommendedFoodItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<RecommendedFoodItem[]>>(
      '/api/recommendations/foods/for-you',
      { params }
    )
    return response.data
  },

  async getDualContextHomeFeed(params?: GetDualContextHomeFeedParams): Promise<ApiSuccessResponse<DualContextHomeFeedResponse>> {
    const response = await apiClient.get<ApiSuccessResponse<DualContextHomeFeedResponse>>(
      '/api/recommendations/home-feed',
      { params }
    )
    return response.data
  }
}
