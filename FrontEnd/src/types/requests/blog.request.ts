import type { PaginationParams } from '../models/common.model'

export interface BlogFilterRequest extends PaginationParams {
  category?: string
  authorId?: number
}

export interface CreateBlogRequest {
  title: string
  summary: string
  content: string
  imageUrl: string
  category: string
}

export interface CreateCommentRequest {
  blogId: number | string
  content: string
}
