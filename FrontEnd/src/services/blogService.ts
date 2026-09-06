import apiClient from './apiClient'
import type { ApiSuccessResponse } from '@/types/responses/common.response'
import type { BlogListItemDto, BlogDetailDto, BlogFilterParams } from '@/types/models/place.model'

export const blogService = {
  async getBlogs(params?: BlogFilterParams): Promise<ApiSuccessResponse<BlogListItemDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params?.category && params.category !== 'Tất cả') cleanParams.category = params.category
    if (params?.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    cleanParams.page = params?.page || 1
    cleanParams.pageSize = params?.pageSize || 12

    const response = await apiClient.get<ApiSuccessResponse<BlogListItemDto[]>>('/api/v1/blogs', {
      params: cleanParams
    })
    return response.data
  },

  async getFeaturedBlog(): Promise<ApiSuccessResponse<BlogListItemDto>> {
    const response = await apiClient.get<ApiSuccessResponse<BlogListItemDto>>('/api/v1/blogs/featured')
    return response.data
  },

  async getBlogDetail(idOrSlug: string | number): Promise<ApiSuccessResponse<BlogDetailDto>> {
    const response = await apiClient.get<ApiSuccessResponse<BlogDetailDto>>(`/api/v1/blogs/${idOrSlug}`)
    return response.data
  }
}
