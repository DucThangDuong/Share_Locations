import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'
import { HeaderChatDropdown } from './HeaderChatDropdown'
import { UserUtilityDrawer } from './UserUtilityDrawer'
import {
  Search,
  Compass,
  MapPin,
  Route,
  BookOpen,
  Menu,
  X,
  ChevronDown,
  Plus,
  MessageCircle
} from 'lucide-react'

export const Header: React.FC = () => {
  const { isAuthenticated, profile, user } = useAuth()
  const { isHeaderDropdownOpen, setIsHeaderDropdownOpen, toggleHeaderDropdown, totalUnreadCount } = useChat()
  const [isUtilityDrawerOpen, setIsUtilityDrawerOpen] = useState(false)
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')
  const drawerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isChatRoute = location.pathname === '/chat'

  const displayName = user?.fullName || profile?.fullName || 'Người dùng'
  const avatarUrl = user?.avatarUrl || profile?.avatarUrl || null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsNavDrawerOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNavDrawerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (isNavDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isNavDrawerOpen])

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (headerSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(headerSearch.trim())}`)
      setHeaderSearch('')
      setIsNavDrawerOpen(false)
    }
  }

  const navLinks = [
    { label: 'Trang chủ', href: '/', icon: Compass, exact: true },
    { label: 'Khám phá', href: '/explore', icon: MapPin },
    { label: 'Bản đồ', href: '/map', icon: MapPin },
    { label: 'Lịch trình', href: '/itinerary', icon: Route },
    { label: 'Cẩm nang', href: '/blog', icon: BookOpen }
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen(true)}
            className="min-h-11 min-w-11 p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Mở danh mục điều hướng"
            title="Danh mục điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 group shrink-0"
          >
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
              LangThang<span className="text-emerald-600">.</span>
            </span>
          </Link>

          <form onSubmit={handleHeaderSearch} className="flex flex-1 max-w-xs sm:max-w-sm md:max-w-md relative min-w-0 ml-1">
            <input
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full h-10 px-4 pl-10 text-xs sm:text-sm border border-slate-200 rounded-full bg-slate-50/90 placeholder:text-slate-400 text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              placeholder="Tìm kiếm địa danh, ẩm thực..."
              type="text"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/propose-place"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer border border-emerald-200/60"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Đề xuất địa điểm</span>
          </Link>

          {isAuthenticated && !isChatRoute && (
            <div className="relative">
              <button
                type="button"
                onClick={toggleHeaderDropdown}
                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isHeaderDropdownOpen
                    ? 'bg-blue-100 text-[#0084FF]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-label="Mở tin nhắn"
                title="Tin nhắn"
                aria-expanded={isHeaderDropdownOpen}
              >
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-black border-2 border-white flex items-center justify-center shadow-xs animate-pulse">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {isHeaderDropdownOpen && (
                <HeaderChatDropdown onClose={() => setIsHeaderDropdownOpen(false)} />
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div>
              <button
                type="button"
                onClick={() => setIsUtilityDrawerOpen(true)}
                className="flex items-center gap-1.5 p-1 pr-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs group"
                aria-expanded={isUtilityDrawerOpen}
                aria-label="Mở tiện ích cá nhân"
                title="Tiện ích cá nhân"
              >
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500/20 ring-1 ring-emerald-500/30"
                      src={avatarUrl}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-500/20 ring-1 ring-emerald-500/30">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors mr-0.5" />
              </button>

              <UserUtilityDrawer
                isOpen={isUtilityDrawerOpen}
                onClose={() => setIsUtilityDrawerOpen(false)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-xs font-semibold text-white transition-colors shadow-2xs"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {isNavDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
              onClick={() => setIsNavDrawerOpen(false)}
            />

            <aside
              ref={drawerRef}
              className="relative w-80 max-w-[85vw] bg-white h-screen shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200 overflow-y-auto"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setIsNavDrawerOpen(false)}
                  className="flex items-center gap-2 group"
                >
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                    LangThang<span className="text-emerald-600">.</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsNavDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-1 flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                  Khám phá hệ thống
                </div>

                {navLinks.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.href
                    : location.pathname.startsWith(item.href)

                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setIsNavDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-colors ${isActive
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-800' : 'text-slate-500'}`} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </header>
  )
}

export default Header
