import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Search,
  Compass,
  MapPin,
  Utensils,
  Route,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'

export const Header: React.FC = () => {
  const { isAuthenticated, profile, user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const displayName = user?.fullName || profile?.fullName || 'Người dùng'
  const shortName = displayName.split(' ').slice(-2).join(' ')
  const avatarUrl = user?.avatarUrl || profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
  const rankLevel = user?.rankLevel || profile?.rankLevel || 'Tân binh'

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

  const navLinks = [
    { label: 'Khám phá', href: '/', icon: Compass, exact: true },
    { label: 'Địa điểm', href: '/#diadiem', icon: MapPin },
    { label: 'Ẩm thực', href: '/#amthuc', icon: Utensils },
    { label: 'Hành trình', href: '/#hanhtrinh', icon: Route },
    { label: 'Cộng đồng', href: '/#blog', icon: BookOpen }
  ]

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
        >
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary-container transition-colors">
            LangThang<span className="text-secondary-container">.</span>
          </span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative">
          <input
            className="w-full h-10 px-4 pl-10 text-xs sm:text-sm border border-slate-200 rounded-full bg-slate-50/80 placeholder:text-slate-400 text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all"
            placeholder="Tìm kiếm địa danh, ẩm thực..."
            type="text"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <nav className="hidden lg:flex items-center space-x-1 font-medium text-xs text-slate-600">
          {navLinks.map((item) => {
            const isActive = item.exact
              ? location.pathname === '/' && !location.hash
              : location.hash === item.href.replace('/', '')

            return (
              <a
                key={item.label}
                href={item.href}
                className={`px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-primary-container font-bold bg-primary-light/80 shadow-2xs'
                    : 'hover:text-primary-container hover:bg-slate-100/70'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-slate-200 bg-white/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs active-press transition-all cursor-pointer"
                aria-expanded={isDropdownOpen}
              >
                <div className="relative">
                  <img
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 ring-2 ring-emerald-500/20"
                    src={avatarUrl}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                    {shortName}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-700 leading-none">
                    {rankLevel}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-3xl shadow-xl border border-slate-100 z-50 py-2.5 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100">
                  <div className="px-4 py-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || profile?.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                      <span>{rankLevel}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-container transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ & Đóng góp</span>
                    </Link>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary-hover text-xs font-semibold text-white shadow-sm hover:shadow-md active-press transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <button
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
          <div className="relative mb-3">
            <input
              className="w-full h-10 px-4 pl-10 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400"
              placeholder="Tìm kiếm địa điểm..."
              type="text"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary-container transition-colors"
              >
                <item.icon className="w-4 h-4 text-emerald-700" />
                <span>{item.label}</span>
              </a>
            ))}
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
                className="flex-1 py-2.5 text-center text-xs font-semibold text-white bg-primary-container rounded-xl shadow-xs"
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
