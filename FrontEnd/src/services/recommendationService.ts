import { apiClient } from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type {
  PersonalizedPlacesResponse,
  SimilarPlaceItem,
  RecommendedPlaceItem,
  RecommendedFoodItem
} from '@/types/recommendation.types'

export interface GetPersonalizedPlacesParams {
  topK?: number
  provinceId?: number
  categoryId?: number
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
  async getPersonalizedPlaces(params?: GetPersonalizedPlacesParams): Promise<ApiSuccessResponse<PersonalizedPlacesResponse>> {
    const response = await apiClient.get<ApiSuccessResponse<PersonalizedPlacesResponse>>(
      '/api/recommendations/places/for-you',
      { params }
    )
    return response.data
  },

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
  }
}
