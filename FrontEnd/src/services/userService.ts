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
  CreateProposalRequest,
  PublicUserProfileDto,
  UserMapPlaceDto
} from '@/types/models/userProfile.model'
import type { UserTripSummaryDto } from '@/types/models/trip.model'

export const userService = {
  async getMyFavorites(params?: {
    targetType?: number
    keyword?: string
    sortBy?: string
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<PagedResultDto<FavoriteItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<FavoriteItem>>>(
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
  }): Promise<ApiSuccessResponse<PagedResultDto<VisitLogItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<VisitLogItem>>>(
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
  }): Promise<ApiSuccessResponse<UserReviewItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<UserReviewItem[]>>(
      '/api/users/me/reviews',
      { params }
    )
    return response.data
  },

  async getMyComments(params?: {
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserCommentItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<UserCommentItem[]>>(
      '/api/users/me/comments',
      { params }
    )
    return response.data
  },

  async getMyBlogs(params?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserBlogItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<UserBlogItem[]>>(
      '/api/users/me/blogs',
      { params }
    )
    return response.data
  },

  async getMyProposals(params?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<PagedResultDto<ProposalItem> | ProposalItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<ProposalItem> | ProposalItem[]>>(
      '/api/proposals/my-proposals',
      { params }
    )
    return response.data
  },

  async getProposalById(id: number | string): Promise<ApiSuccessResponse<ProposalItem>> {
    const response = await apiClient.get<ApiSuccessResponse<ProposalItem>>(`/api/proposals/${id}`)
    return response.data
  },

  async createProposal(data: CreateProposalRequest | FormData): Promise<ApiSuccessResponse<ProposalItem>> {
    let payload: CreateProposalRequest | FormData = data
    if (!(data instanceof FormData)) {
      const hasFiles =
        (data.photos && data.photos.length > 0) ||
        (data.files && data.files.length > 0) ||
        (data.images && data.images.some((img) => img instanceof File)) ||
        data.coverImageFile instanceof File

      if (hasFiles) {
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('Name', data.name)
        formData.append('categoryId', String(data.categoryId))
        formData.append('CategoryId', String(data.categoryId))
        formData.append('provinceId', String(data.provinceId))
        formData.append('ProvinceId', String(data.provinceId))
        formData.append('address', data.address)
        formData.append('Address', data.address)
        if (data.phone) {
          formData.append('phone', data.phone)
          formData.append('Phone', data.phone)
        }
        if (data.website) {
          formData.append('website', data.website)
          formData.append('Website', data.website)
        }
        if (data.openingHours) {
          formData.append('openingHours', data.openingHours)
          formData.append('OpeningHours', data.openingHours)
        }
        if (data.minPrice !== undefined) {
          formData.append('minPrice', String(data.minPrice))
          formData.append('MinPrice', String(data.minPrice))
        }
        if (data.maxPrice !== undefined) {
          formData.append('maxPrice', String(data.maxPrice))
          formData.append('MaxPrice', String(data.maxPrice))
        }
        if (data.latitude !== undefined) {
          formData.append('latitude', String(data.latitude))
          formData.append('Latitude', String(data.latitude))
        }
        if (data.longitude !== undefined) {
          formData.append('longitude', String(data.longitude))
          formData.append('Longitude', String(data.longitude))
        }
        if (data.description) {
          formData.append('description', data.description)
          formData.append('Description', data.description)
        }

        const fileList: File[] = [
          ...(data.photos || []),
          ...(data.files || []),
          ...((data.images?.filter((img) => img instanceof File) as File[]) || [])
        ]

        if (data.coverImageFile instanceof File) {
          formData.append('coverImage', data.coverImageFile)
          fileList.forEach((file) => {
            if (file !== data.coverImageFile) {
              formData.append('photos', file)
            }
          })
        } else if (fileList.length > 0) {
          formData.append('coverImage', fileList[0])
          fileList.slice(1).forEach((file) => {
            formData.append('photos', file)
          })
        } else if (data.coverImg) {
          formData.append('coverImg', data.coverImg)
        }

        if (data.mediaUrls && data.mediaUrls.length > 0) {
          data.mediaUrls.forEach((url) => {
            formData.append('mediaUrls', url)
          })
        }
        payload = formData
      }
    }

    try {
      const response = await apiClient.post<ApiSuccessResponse<ProposalItem>>(
        '/api/proposals',
        payload
      )
      return response.data
    } catch (err: any) {
      // Fallback: If multipart formData returned 415 or 400 and files exist, convert files to Base64 and send JSON (Option 1 in spec)
      if (
        (err.response?.status === 415 || err.response?.status === 400) &&
        !(data instanceof FormData) &&
        ((data.photos && data.photos.length > 0) || (data.files && data.files.length > 0) || data.coverImageFile)
      ) {
        const fileList: File[] = [
          ...(data.photos || []),
          ...(data.files || []),
          ...((data.images?.filter((img) => img instanceof File) as File[]) || [])
        ]
        const toBase64 = (f: File) =>
          new Promise<string>((resolve) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as string)
            r.readAsDataURL(f)
          })

        const base64List = await Promise.all(fileList.map(toBase64))
        const coverBase64 = data.coverImageFile ? await toBase64(data.coverImageFile) : (base64List[0] || data.coverImg)

        const jsonBody = {
          name: data.name,
          categoryId: data.categoryId,
          provinceId: data.provinceId,
          address: data.address,
          phone: data.phone,
          website: data.website,
          openingHours: data.openingHours,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
          coverImg: coverBase64,
          mediaUrls: [...base64List, ...(data.mediaUrls || [])],
          images: [...base64List, ...(data.mediaUrls || [])],
        }

        const fallbackRes = await apiClient.post<ApiSuccessResponse<ProposalItem>>(
          '/api/proposals',
          jsonBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
        return fallbackRes.data
      }
      throw err
    }
  },

  async deleteProposal(id: number): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(
      `/api/proposals/${id}`
    )
    return response.data
  },

  async getMyAccessHistories(params?: {
    page?: number
    pageSize?: number
  }): Promise<ApiSuccessResponse<UserAccessHistoryItem[]>> {
    const response = await apiClient.get<ApiSuccessResponse<UserAccessHistoryItem[]>>(
      '/api/users/me/access-histories',
      { params }
    )
    return response.data
  },

  async clearMyAccessHistories(): Promise<ApiSuccessResponse<boolean>> {
    try {
      const response = await apiClient.delete<ApiSuccessResponse<boolean>>(
        '/api/users/me/access-histories'
      )
      return response.data
    } catch {
      return { success: true, message: 'OK', data: true, timestamp: new Date().toISOString() }
    }
  },

  async deleteMyAccessHistory(placeId: number | string): Promise<ApiSuccessResponse<boolean>> {
    try {
      const response = await apiClient.delete<ApiSuccessResponse<boolean>>(
        `/api/users/me/access-histories/${placeId}`
      )
      return response.data
    } catch {
      return { success: true, message: 'OK', data: true, timestamp: new Date().toISOString() }
    }
  },

  async recordAccessHistory(placeId: number): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>(
      `/api/places/${placeId}/access-history`
    )
    return response.data
  },

  async getUserPublicProfile(userId: number | string): Promise<ApiSuccessResponse<PublicUserProfileDto>> {
    const response = await apiClient.get<ApiSuccessResponse<PublicUserProfileDto>>(
      `/api/users/${userId}/profile`
    )
    return response.data
  },

  async getUserMapPlaces(userId: number | string): Promise<ApiSuccessResponse<UserMapPlaceDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<UserMapPlaceDto[]>>(
      `/api/users/${userId}/map-places`
    )
    return response.data
  },

  async getUserPublicReviews(
    userId: number | string,
    params?: { page?: number; pageSize?: number; sortBy?: string }
  ): Promise<ApiSuccessResponse<UserReviewItem[] | PagedResultDto<UserReviewItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<UserReviewItem[] | PagedResultDto<UserReviewItem>>>(
      `/api/users/${userId}/reviews`,
      { params }
    )
    return response.data
  },

  async getUserPublicTrips(
    userId: number | string,
    params?: { page?: number; pageSize?: number; status?: string; privacy?: number }
  ): Promise<ApiSuccessResponse<PagedResultDto<UserTripSummaryDto> | UserTripSummaryDto[]>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<UserTripSummaryDto> | UserTripSummaryDto[]>>(
      `/api/users/${userId}/trips`,
      { params }
    )
    return response.data
  },

  async getUserPublicVisitLogs(
    userId: number | string,
    params?: { page?: number; pageSize?: number; privacy?: number }
  ): Promise<ApiSuccessResponse<PagedResultDto<VisitLogItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<PagedResultDto<VisitLogItem>>>(
      `/api/users/${userId}/visit-logs`,
      { params }
    )
    return response.data
  },

  async getUserPublicBlogs(
    userId: number | string,
    params?: { page?: number; pageSize?: number; status?: number }
  ): Promise<ApiSuccessResponse<UserBlogItem[] | PagedResultDto<UserBlogItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<UserBlogItem[] | PagedResultDto<UserBlogItem>>>(
      `/api/users/${userId}/blogs`,
      { params }
    )
    return response.data
  },

  async getUserPublicProposals(
    userId: number | string,
    params?: { page?: number; pageSize?: number; status?: number }
  ): Promise<ApiSuccessResponse<ProposalItem[] | PagedResultDto<ProposalItem>>> {
    const response = await apiClient.get<ApiSuccessResponse<ProposalItem[] | PagedResultDto<ProposalItem>>>(
      `/api/users/${userId}/proposals`,
      { params }
    )
    return response.data
  },

  async toggleReviewLike(reviewId: number | string): Promise<ApiSuccessResponse<{ isLiked: boolean; likeCount: number }>> {
    const response = await apiClient.post<ApiSuccessResponse<{ isLiked: boolean; likeCount: number }>>(
      `/api/reviews/${reviewId}/toggle-like`
    )
    return response.data
  },

  async sendFriendRequest(targetUserId: number): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.post<ApiSuccessResponse<boolean>>(
      '/api/friends/request',
      { targetUserId }
    )
    return response.data
  }
}
