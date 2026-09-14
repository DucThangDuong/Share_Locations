import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Search,
  Compass,
  MapPin,
  Route,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Sliders
} from 'lucide-react'

export const Header: React.FC = () => {
  const { isAuthenticated, profile, user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const displayName = user?.fullName || profile?.fullName || 'Người dùng'
  const avatarUrl = user?.avatarUrl || profile?.avatarUrl || null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (headerSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(headerSearch.trim())}`)
      setHeaderSearch('')
      setIsMobileMenuOpen(false)
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
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/80 transition-all duration-300 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
        >
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary transition-colors">
            LangThang<span className="text-secondary-container">.</span>
          </span>
        </Link>

        <form onSubmit={handleHeaderSearch} className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative">
          <input
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            className="w-full h-10 px-4 pl-10 text-xs sm:text-sm border border-slate-200 rounded-full bg-slate-50/80 placeholder:text-slate-400 text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm kiếm địa danh, ẩm thực..."
            type="text"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>

        <nav className="hidden lg:flex items-center space-x-1 font-medium text-xs text-slate-600">
          {navLinks.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href)

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${isActive
                    ? 'text-primary font-bold bg-emerald-50'
                    : 'hover:text-primary hover:bg-slate-100/70'
                  }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/propose-place"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer border border-emerald-200/60"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>Đề xuất địa điểm</span>
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 p-1 pr-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 active-press transition-all cursor-pointer shadow-2xs"
                aria-expanded={isDropdownOpen}
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
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl border border-slate-200/90 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100 shadow-xl">
                  <div className="px-4 py-3 flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/30 ring-1 ring-emerald-500/20 shrink-0"
                        src={avatarUrl}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold border border-emerald-500/30 shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Xem trang cá nhân</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700 transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-slate-400" />
                      <span>Cài đặt</span>
                    </Link>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-semibold text-white active-press transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleHeaderSearch} className="relative mb-3">
            <input
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full h-10 px-4 pl-10 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400"
              placeholder="Tìm kiếm địa điểm..."
              type="text"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          {isAuthenticated && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {avatarUrl ? (
                  <img
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover border border-emerald-500/30"
                    src={avatarUrl}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || profile?.email}</p>
                </div>
              </div>
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Cài đặt"
              >
                <Sliders className="w-4 h-4" />
              </Link>
            </div>
          )}

          <Link
            to="/propose-place"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Đề xuất địa điểm mới</span>
          </Link>

          <div className="space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
              >
                <item.icon className="w-4 h-4 text-emerald-700" />
                <span>{item.label}</span>
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>Trang cá nhân</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
                >
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  <span>Cài đặt tài khoản</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </>
            )}
          </div>

          {!isAuthenticated && (
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-white bg-primary rounded-xl"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
