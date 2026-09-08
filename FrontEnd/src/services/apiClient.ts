import axios, { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as { _retry?: boolean; headers?: Record<string, string> } | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const currentToken = localStorage.getItem('access_token')
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh-token`,
          {},
          {
            headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
            withCredentials: true,
          }
        )

        if (refreshResponse.data?.data?.accessToken) {
          const newToken = refreshResponse.data.data.accessToken
          localStorage.setItem('access_token', newToken)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          processQueue(null, newToken)
          return apiClient(originalRequest)
        } else {
          processQueue(new Error('Refresh token failed'), null)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_info')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
