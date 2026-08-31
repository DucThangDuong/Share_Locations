export interface PaginationParams {
  page?: number
  size?: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

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
