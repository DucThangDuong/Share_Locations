export interface PaginationMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ValidationErrorDetail {
  field: string
  message: string
  rejectedValue?: unknown
}

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
