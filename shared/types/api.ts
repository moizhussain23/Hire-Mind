export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ErrorResponse {
  success: false
  error: string
  details?: any
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}
