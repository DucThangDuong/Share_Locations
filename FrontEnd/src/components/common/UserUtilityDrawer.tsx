import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Luggage,
  CalendarCheck,
  Users,
  MessageCircle,
  BookOpen,
  MapPin,
  Sliders,
  LogOut,
  Star,
  CheckCircle2
} from 'lucide-react'
import {
  FavoritesUtility,
  TripsUtility,
  VisitLogsUtility,
  FriendsUtility,
  ReviewsUtility,
  CommentsUtility,
  BlogsUtility,
  ProposalsUtility
} from '@/components/user-utility'

export type UtilityType =
  | 'favorites'
  | 'trips'
  | 'visitLogs'
  | 'friends'
  | 'reviews'
  | 'comments'
  | 'blogs'
  | 'proposals'

interface UserUtilityDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialUtility?: UtilityType | null
}

export const UserUtilityDrawer: React.FC<UserUtilityDrawerProps> = ({
  isOpen,
  onClose,
  initialUtility = null
}) => {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  const [activeUtility, setActiveUtility] = useState<UtilityType | null>(initialUtility)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const displayName = user?.fullName || profile?.fullName || 'Người dùng'
  const avatarUrl = user?.avatarUrl || profile?.avatarUrl || null
  const email = user?.email || profile?.email || ''

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  useEffect(() => {
    if (isOpen) {
      setActiveUtility(initialUtility || null)
    }
  }, [isOpen, initialUtility])

  // Keyboard Navigation (Escape key)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeUtility) {
          setActiveUtility(null)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeUtility, onClose])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = async () => {
    await logout()
    onClose()
    navigate('/login')
  }

  if (!isOpen) return null

  const utilityMenuItems: Array<{
    key: UtilityType
    title: string
    subtitle: string
    icon: React.ElementType
    iconColor: string
    bgColor: string
  }> = [
      {
        key: 'favorites',
        title: 'Yêu thích',
        subtitle: 'Địa điểm, ẩm thực, hành trình, cẩm nang đã lưu',
        icon: Bookmark,
        iconColor: 'text-amber-700',
        bgColor: 'bg-amber-50 group-hover:bg-amber-100'
      },
      {
        key: 'trips',
        title: 'Chuyến đi',
        subtitle: 'Lịch trình du lịch, điểm đến & hoạt động',
        icon: Luggage,
        iconColor: 'text-blue-800',
        bgColor: 'bg-blue-50 group-hover:bg-blue-100'
      },
      {
        key: 'visitLogs',
        title: 'Nhật ký',
        subtitle: 'Địa điểm đã check-in, đánh giá & ghi nhớ',
        icon: CalendarCheck,
        iconColor: 'text-emerald-800',
        bgColor: 'bg-emerald-50 group-hover:bg-emerald-100'
      },
      {
        key: 'friends',
        title: 'Bạn bè',
        subtitle: 'Danh sách bạn bè & nhắn tin trò chuyện',
        icon: Users,
        iconColor: 'text-indigo-800',
        bgColor: 'bg-indigo-50 group-hover:bg-indigo-100'
      },
      {
        key: 'reviews',
        title: 'Bài đánh giá',
        subtitle: 'Các đánh giá địa điểm của bạn',
        icon: Star,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-50 group-hover:bg-amber-100'
      },
      {
        key: 'comments',
        title: 'Bình luận',
        subtitle: 'Các bình luận về địa điểm đã chia sẻ',
        icon: MessageCircle,
        iconColor: 'text-cyan-800',
        bgColor: 'bg-cyan-50 group-hover:bg-cyan-100'
      },
      {
        key: 'blogs',
        title: 'Bài viết',
        subtitle: 'Cẩm nang & bài viết kinh nghiệm du lịch',
        icon: BookOpen,
        iconColor: 'text-violet-800',
        bgColor: 'bg-violet-50 group-hover:bg-violet-100'
      },
      {
        key: 'proposals',
        title: 'Đóng góp',
        subtitle: 'Địa điểm bạn đã đề xuất lên hệ thống',
        icon: MapPin,
        iconColor: 'text-rose-700',
        bgColor: 'bg-rose-50 group-hover:bg-rose-100'
      }
    ]

  const activeTitle = utilityMenuItems.find((i) => i.key === activeUtility)?.title || 'Tiện ích'

  const drawerPortal = (
    <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Main Drawer Shell */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white h-screen shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-slate-200 overflow-hidden">
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-4 left-4 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 truncate">{toastMsg}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 1: LEVEL 1 MAIN UTILITY MENU (8 TIỆN ÍCH)
            Zero API calls until user selects a utility!
        ══════════════════════════════════════════════════════════════════ */}
        {!activeUtility && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* User Profile Banner */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30 ring-2 ring-emerald-500/10 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-bold border border-emerald-500/20 shadow-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                    {displayName}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{email}</p>
                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="mt-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 inline-flex hover:underline"
                  >
                    <span>Quản lý tài khoản</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Đóng"
                aria-label="Đóng tiện ích"
              >
                <X size={20} />
              </button>
            </div>

            {/* Section Header */}
            <div className="px-5 pt-4 pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tiện ích cá nhân ({utilityMenuItems.length})
              </span>
            </div>

            {/* List of 8 Utilities */}
            <div className="p-3 space-y-1.5 flex-1">
              {utilityMenuItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveUtility(item.key)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all text-left cursor-pointer border border-transparent hover:border-slate-100 group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl ${item.bgColor} ${item.iconColor} flex items-center justify-center shrink-0 transition-colors shadow-2xs`}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate block">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2 text-slate-300 group-hover:text-slate-600 transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-1">
              <Link
                to="/settings"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
              >
                <Sliders size={16} className="text-slate-500" />
                <span>Cài đặt tài khoản</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 2: LEVEL 2 SUB-SIDEBAR
            Loads ONLY the active utility component on demand!
        ══════════════════════════════════════════════════════════════════ */}
        {activeUtility && (
          <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-200">
            {/* Top Navigation Bar */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveUtility(null)}
                  className="p-1.5 -ml-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Quay lại danh mục"
                  aria-label="Quay lại"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-sm font-extrabold text-slate-900 truncate">
                  {activeTitle}
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Dynamic Modular Sub-Utility Component: On-demand only */}
            {activeUtility === 'favorites' && (
              <FavoritesUtility isDrawer onClose={onClose} onToast={showToast} />
            )}
            {activeUtility === 'trips' && (
              <TripsUtility isDrawer onClose={onClose} onToast={showToast} />
            )}
            {activeUtility === 'visitLogs' && (
              <VisitLogsUtility isDrawer onClose={onClose} onToast={showToast} />
            )}
            {activeUtility === 'friends' && (
              <FriendsUtility isDrawer onClose={onClose} onToast={showToast} />
            )}
            {activeUtility === 'reviews' && (
              <ReviewsUtility isDrawer onClose={onClose} />
            )}
            {activeUtility === 'comments' && (
              <CommentsUtility isDrawer onClose={onClose} />
            )}
            {activeUtility === 'blogs' && (
              <BlogsUtility isDrawer onClose={onClose} onToast={showToast} />
            )}
            {activeUtility === 'proposals' && (
              <ProposalsUtility isDrawer onClose={onClose} onToast={showToast} />
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(drawerPortal, document.body)
}

export default UserUtilityDrawer
