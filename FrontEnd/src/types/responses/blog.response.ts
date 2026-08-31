import type { BlogDto } from '../models/blog.model'
import type { ApiSuccessResponse } from './common.response'

export type BlogResponse = ApiSuccessResponse<BlogDto[]>
export type BlogDetailResponse = ApiSuccessResponse<BlogDto>
