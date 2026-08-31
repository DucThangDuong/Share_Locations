import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Search } from 'lucide-react'

export const Header: React.FC = () => {
  const { isAuthenticated, profile, user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const displayName = profile?.fullName || user?.fullName || 'Người dùng'
  const shortName = displayName.split(' ').slice(-2).join(' ')
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || 'https://i.pravatar.cc/150?img=47'

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
    navigate('/login')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md py-3.5 border-b border-surface-variant sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center gap-6">
        <Link
          to="/"
          className="font-serif text-2xl md:text-3xl italic text-primary-container font-bold tracking-tight hover:opacity-90 transition-opacity shrink-0"
        >
          LangThang<span className="text-secondary-container">.</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-sm relative">
          <input
            className="block w-full px-4 py-2 pl-9 text-xs sm:text-sm border border-surface-variant rounded-full bg-slate-50 placeholder:text-outline text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all"
            placeholder="Tìm kiếm địa điểm, bài viết..."
            type="text"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="hidden lg:flex space-x-7 items-center text-sm font-medium text-slate-600">
          <Link className="hover:text-primary-container transition-colors" to="/">
            Khám phá
          </Link>
          <a className="hover:text-primary-container transition-colors" href="/#diadiem">
            Địa điểm
          </a>
          <a className="hover:text-primary-container transition-colors" href="/#amthuc">
            Ẩm thực
          </a>
          <a className="hover:text-primary-container transition-colors" href="/#hanhtrinh">
            Hành trình
          </a>
          <a className="hover:text-primary-container transition-colors" href="/#blog">
            Blog
          </a>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center space-x-3.5 shrink-0" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2.5 border border-surface-variant rounded-full p-1 pr-3 bg-white hover:bg-slate-50 transition-colors focus:outline-hidden cursor-pointer"
                aria-expanded={isDropdownOpen}
              >
                <img
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  src={avatarUrl}
                />
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                  {shortName}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-surface-variant z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-surface-variant">
                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{profile?.email || user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-container transition-colors"
                    >
                      Hồ sơ cá nhân
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-surface-variant">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl border border-surface-variant text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary-hover text-xs font-semibold text-white shadow-xs transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
