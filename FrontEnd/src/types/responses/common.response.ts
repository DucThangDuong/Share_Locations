import type { PaginationMeta, ValidationErrorDetail } from '../models/common.model'

export interface ApiSuccessResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  code: string
  message: string
  path: string
  requestId: string
  timestamp: string
  errors?: ValidationErrorDetail[]
}
