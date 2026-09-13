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

export const blogService = {
  async getBlogs(params?: BlogFilterParams): Promise<ApiSuccessResponse<BlogListItemDto[]>> {
    const cleanParams: Record<string, unknown> = {}

    if (params?.category && params.category !== 'Tất cả') cleanParams.category = params.category
    if (params?.keyword?.trim()) cleanParams.keyword = params.keyword.trim()
    cleanParams.page = params?.page || 1
    cleanParams.pageSize = params?.pageSize || 12

    return getWithFallback<BlogListItemDto[]>('/api/blogs', '/api/v1/blogs', {
      params: cleanParams
    })
  },

  async getFeaturedBlog(): Promise<ApiSuccessResponse<BlogListItemDto>> {
    return getWithFallback<BlogListItemDto>('/api/blogs/featured', '/api/v1/blogs/featured')
  },

  async getBlogDetail(idOrSlug: string | number): Promise<ApiSuccessResponse<BlogDetailDto>> {
    return getWithFallback<BlogDetailDto>(`/api/blogs/${idOrSlug}`, `/api/v1/blogs/${idOrSlug}`)
  },

  async createBlog(data: CreateBlogRequest): Promise<ApiSuccessResponse<UserBlogItem>> {
    return postWithFallback<UserBlogItem>('/api/blogs', '/api/v1/blogs', data)
  },

  async updateBlog(id: number | string, data: UpdateBlogRequest): Promise<ApiSuccessResponse<boolean>> {
    return putWithFallback<boolean>(`/api/blogs/${id}`, `/api/v1/blogs/${id}`, data)
  },

  async deleteBlog(id: number | string): Promise<ApiSuccessResponse<boolean>> {
    return deleteWithFallback<boolean>(`/api/blogs/${id}`, `/api/v1/blogs/${id}`)
  }
}
