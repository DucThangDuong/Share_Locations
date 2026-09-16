import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { BlogListItemDto, BlogDetailDto, BlogFilterParams } from '@/types/models/place.model'
import type { UserBlogItem } from '@/types/models/userProfile.model'

export interface CreateBlogRequest {
  title: string
  categoryId?: number
  coverImageUrl?: string
  excerpt?: string
  contentJSON?: string
  readTimeMinutes?: number
  status?: number
}

export interface UpdateBlogRequest {
  title: string
  categoryId?: number
  coverImageUrl?: string
  excerpt?: string
  contentJSON?: string
  readTimeMinutes?: number
  status?: number
}

export interface ToggleBlogLikeResponse {
  isLiked: boolean
  likesCount: number
}

export const blogService = {
  async getBlogs(params?: BlogFilterParams): Promise<ApiSuccessResponse<BlogListItemDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params?.category && params.category !== 'Tất cả') cleanParams.category = params.category
    if (params?.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    cleanParams.page = params?.page || 1
    cleanParams.pageSize = params?.pageSize || 12

    const response = await apiClient.get<ApiSuccessResponse<BlogListItemDto[]>>('/api/blogs', {
      params: cleanParams
    })
    return response.data
  },

  async getFeaturedBlog(): Promise<ApiSuccessResponse<BlogListItemDto>> {
    const response = await apiClient.get<ApiSuccessResponse<BlogListItemDto>>('/api/blogs/featured')
    return response.data
  },

  async getBlogDetail(idOrSlug: string | number): Promise<ApiSuccessResponse<BlogDetailDto>> {
    const response = await apiClient.get<ApiSuccessResponse<BlogDetailDto>>(`/api/blogs/${idOrSlug}`)
    return response.data
  },

  async toggleLike(id: number | string): Promise<ApiSuccessResponse<ToggleBlogLikeResponse>> {
    const response = await apiClient.post<ApiSuccessResponse<ToggleBlogLikeResponse>>(`/api/blogs/${id}/toggle-like`)
    return response.data
  },

  async createBlog(data: CreateBlogRequest): Promise<ApiSuccessResponse<UserBlogItem>> {
    const response = await apiClient.post<ApiSuccessResponse<UserBlogItem>>('/api/blogs', data)
    return response.data
  },

  async updateBlog(id: number | string, data: UpdateBlogRequest): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.put<ApiSuccessResponse<boolean>>(`/api/blogs/${id}`, data)
    return response.data
  },

  async deleteBlog(id: number | string): Promise<ApiSuccessResponse<boolean>> {
    const response = await apiClient.delete<ApiSuccessResponse<boolean>>(`/api/blogs/${id}`)
    return response.data
  }
}
