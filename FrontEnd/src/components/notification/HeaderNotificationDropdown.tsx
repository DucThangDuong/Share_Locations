import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  Loader2,
  Users,
  MessageSquare,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Info
} from 'lucide-react'
import { useNotification } from '@/context/NotificationContext'
import { useSystemSettings } from '@/context/SystemSettingsContext'
import type { NotificationItem } from '@/types/notification.types'

interface HeaderNotificationDropdownProps {
  onClose: () => void
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  } catch {
    return ''
  }
}

function getNotificationTypeMeta(type: number) {
  switch (type) {
    case 1:
      return {
        icon: Info,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        border: 'border-blue-200',
        label: 'Hệ thống'
      }
    case 2:
      return {
        icon: Users,
        color: 'text-indigo-600',
        bg: 'bg-indigo-100',
        border: 'border-indigo-200',
        label: 'Tương tác'
      }
    case 3:
      return {
        icon: MessageSquare,
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        label: 'Đánh giá'
      }
    case 4:
      return {
        icon: Compass,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
        label: 'Chuyến đi'
      }
    case 5:
      return {
        icon: CheckCircle2,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        border: 'border-purple-200',
        label: 'Đề xuất'
      }
    case 6:
      return {
        icon: ShieldAlert,
        color: 'text-rose-600',
        bg: 'bg-rose-100',
        border: 'border-rose-200',
        label: 'Kiểm duyệt'
      }
    default:
      return {
        icon: Bell,
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        label: 'Thông báo'
      }
  }
}

export const HeaderNotificationDropdown: React.FC<HeaderNotificationDropdownProps> = ({
  onClose
}) => {
  const navigate = useNavigate()
  const { defaultUserAvatar } = useSystemSettings()
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    unreadFilter,
    setUnreadFilter,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotification()

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleClickItem = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id)
    }
    onClose()
    if (item.targetUrl) {
      navigate(item.targetUrl)
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[360px] sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col font-sans"
    >
      {/* Top Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Thông báo</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              {unreadCount} mới
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            title="Đánh dấu tất cả đã đọc"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setUnreadFilter(false)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            !unreadFilter
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setUnreadFilter(true)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            unreadFilter
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Items List */}
      <div className="flex-1 max-h-[420px] overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Đang tải thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {unreadFilter ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              {unreadFilter
                ? 'Bạn đã xem hết các thông báo mới.'
                : 'Các hoạt động và thông báo mới sẽ xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((item) => {
              const typeMeta = getNotificationTypeMeta(item.type)
              const IconComponent = typeMeta.icon
              const avatar = item.actorAvatarUrl || defaultUserAvatar

              return (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className={`group relative flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !item.isRead ? 'bg-emerald-50/30 font-medium' : 'bg-white'
                  }`}
                >
                  {/* Left: Avatar with type mini-badge */}
                  <div className="relative shrink-0 mt-0.5">
                    {item.actorAvatarUrl || item.actorName ? (
                      <img
                        src={avatar}
                        alt={item.actorName || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          if (defaultUserAvatar) {
                            (e.target as HTMLImageElement).src = defaultUserAvatar
                          }
                        }}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${typeMeta.bg} ${typeMeta.color} border ${typeMeta.border}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                    )}

                    {/* Mini Type Icon Badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${typeMeta.bg} ${typeMeta.color} border-2 border-white shadow-2xs`}
                      title={typeMeta.label}
                    >
                      <IconComponent className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.title}
                      </span>
                    </div>

                    <p
                      className={`text-xs text-slate-600 line-clamp-2 leading-relaxed ${
                        !item.isRead ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {item.content}
                    </p>

                    <div className="mt-1.5 text-[11px] text-slate-400 font-normal">
                      <span>{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right: Unread Dot & Actions */}
                  <div className="absolute right-3 top-4 flex items-center gap-1">
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 group-hover:hidden" />
                    )}

                    <div className="hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur-xs rounded-lg p-0.5 shadow-2xs border border-slate-200">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(item.id)
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(item.id)
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <div className="p-3 text-center bg-slate-50/50">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="w-full py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tải thêm...</span>
                    </>
                  ) : (
                    <span>Xem thông báo cũ hơn</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default HeaderNotificationDropdown
