import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'
import { useAuth } from './AuthContext'
import {
  notificationService,
} from '@/services/notificationService'
import { notificationSignalR } from '@/services/notificationSignalR'
import type {
  NotificationItem,
  NotificationPagedResult
} from '@/types/notification.types'

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  page: number
  unreadFilter: boolean
  setUnreadFilter: (unreadOnly: boolean) => void
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
  toggleDropdown: () => void
  activeToast: NotificationItem | null
  dismissToast: () => void
  fetchNotifications: (reset?: boolean, unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [unreadFilter, setUnreadFilterState] = useState<boolean>(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null)

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setActiveToast(null)
  }, [])

  const showToast = useCallback(
    (item: NotificationItem) => {
      dismissToast()
      setActiveToast(item)
      toastTimerRef.current = setTimeout(() => {
        setActiveToast(null)
      }, 5000)
    },
    [dismissToast]
  )

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Ignore
    }
  }, [isAuthenticated])

  const fetchNotifications = useCallback(
    async (reset = false, unreadOnly?: boolean) => {
      if (!isAuthenticated) return
      const targetUnreadOnly = unreadOnly !== undefined ? unreadOnly : unreadFilter
      const targetPage = reset ? 1 : page

      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const result: NotificationPagedResult = await notificationService.getNotifications(
          targetPage,
          20,
          targetUnreadOnly
        )

        if (reset) {
          setNotifications(result.items || [])
          setPage(1)
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id))
            const newItems = (result.items || []).filter((n) => !existingIds.has(n.id))
            return [...prev, ...newItems]
          })
        }

        setHasMore(result.hasNextPage ?? false)
        if (result.unreadCount !== undefined) {
          setUnreadCount(result.unreadCount)
        }
      } catch (err) {
        console.warn('Failed to fetch notifications:', err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [isAuthenticated, page, unreadFilter]
  )

  const setUnreadFilter = useCallback(
    (unreadOnly: boolean) => {
      setUnreadFilterState(unreadOnly)
      setPage(1)
      fetchNotifications(true, unreadOnly)
    },
    [fetchNotifications]
  )

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !isAuthenticated) return
    const nextPage = page + 1
    setIsLoadingMore(true)

    try {
      const result = await notificationService.getNotifications(nextPage, 20, unreadFilter)
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const newItems = (result.items || []).filter((n) => !existingIds.has(n.id))
        return [...prev, ...newItems]
      })
      setPage(nextPage)
      setHasMore(result.hasNextPage ?? false)
      if (result.unreadCount !== undefined) {
        setUnreadCount(result.unreadCount)
      }
    } catch (err) {
      console.warn('Failed to load more notifications:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, isAuthenticated, page, unreadFilter])

  const markAsRead = useCallback(async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await notificationService.markAsRead(id)
    } catch {
      // Re-sync unread count if failed
      fetchUnreadCount()
    }
  }, [fetchUnreadCount])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
    )
    setUnreadCount(0)

    try {
      await notificationService.markAllAsRead()
    } catch {
      fetchUnreadCount()
    }
  }, [fetchUnreadCount])

  const deleteNotification = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.id === id)
      // Optimistic delete
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      try {
        await notificationService.deleteNotification(id)
      } catch {
        fetchNotifications(true)
      }
    },
    [notifications, fetchNotifications]
  )

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => {
      const nextState = !prev
      if (nextState) {
        fetchNotifications(true)
      }
      return nextState
    })
  }, [fetchNotifications])

  // SignalR setup & initial sync
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      notificationSignalR.stop()
      return
    }

    // Initial count fetch
    fetchUnreadCount()

    // Start SignalR
    notificationSignalR.start()

    // Listen to ReceiveNotification
    const unsubNotification = notificationSignalR.onNotification((item) => {
      // Add to top of notification list
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== item.id)
        return [item, ...filtered]
      })
      // Increment unread count
      if (!item.isRead) {
        setUnreadCount((prev) => prev + 1)
      }
      // Show real-time popup toast
      showToast(item)
    })

    // Listen to UnreadCountUpdated
    const unsubUnreadCount = notificationSignalR.onUnreadCount((count) => {
      setUnreadCount(count)
    })

    return () => {
      unsubNotification()
      unsubUnreadCount()
    }
  }, [isAuthenticated, fetchUnreadCount, showToast])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isLoadingMore,
        hasMore,
        page,
        unreadFilter,
        setUnreadFilter,
        isDropdownOpen,
        setIsDropdownOpen,
        toggleDropdown,
        activeToast,
        dismissToast,
        fetchNotifications,
        fetchUnreadCount,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
