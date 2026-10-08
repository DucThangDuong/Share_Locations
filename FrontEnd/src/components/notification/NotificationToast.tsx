import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Bell } from 'lucide-react'
import { useNotification } from '@/context/NotificationContext'
import { useSystemSettings } from '@/context/SystemSettingsContext'

export const NotificationToast: React.FC = () => {
  const navigate = useNavigate()
  const { activeToast, dismissToast, markAsRead } = useNotification()
  const { defaultUserAvatar } = useSystemSettings()

  if (!activeToast) return null

  const handleClick = () => {
    if (!activeToast.isRead) {
      markAsRead(activeToast.id)
    }
    dismissToast()
    if (activeToast.targetUrl) {
      navigate(activeToast.targetUrl)
    }
  }

  const avatar = activeToast.actorAvatarUrl || defaultUserAvatar

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        onClick={handleClick}
        className="relative flex items-start gap-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 hover:border-emerald-500/50 transition-all cursor-pointer group overflow-hidden"
      >

        {/* Avatar / Icon */}
        <div className="shrink-0 mt-0.5">
          {avatar ? (
            <img
              src={avatar}
              alt="Notification sender"
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Thông báo mới
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{activeToast.title}</h4>
          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
            {activeToast.content}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dismissToast()
          }}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default NotificationToast
