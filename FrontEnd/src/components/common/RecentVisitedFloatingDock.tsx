import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  MapPin,
  Star,
  Compass
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { userService } from '@/services/userService'

export interface RecentVisitedItem {
  id: number | string
  name: string
  province?: string
  category?: string
  rating?: number
  coverUrl?: string
  visitedAt: string
}

export const RecentVisitedFloatingDock: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentVisitedItem[]>([])

  const loadRecentItems = async () => {
    if (isAuthenticated) {
      try {
        const res = await userService.getAccessHistories(10)
        if (res.success && res.data && res.data.length > 0) {
          const mapped: RecentVisitedItem[] = res.data.map((item) => ({
            id: item.placeId,
            name: item.placeName,
            province: item.province,
            coverUrl: item.coverImg,
            rating: item.avgRating,
            visitedAt: item.viewedAt ? new Date(item.viewedAt).toLocaleDateString('vi-VN') : 'Gần đây'
          }))
          setRecentItems(mapped)
          return
        }
      } catch {
      }
    }

    try {
      const stored = localStorage.getItem('langthang_recent_visited')
      if (stored) {
        setRecentItems(JSON.parse(stored))
      } else {
        setRecentItems([])
      }
    } catch {
      setRecentItems([])
    }
  }

  useEffect(() => {
    loadRecentItems()

    const handleStorageChange = () => {
      loadRecentItems()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isAuthenticated])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentItems([])
    localStorage.removeItem('langthang_recent_visited')
  }

  const handleRemoveOne = (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation()
    const updated = recentItems.filter((item) => item.id !== id)
    setRecentItems(updated)
    localStorage.setItem('langthang_recent_visited', JSON.stringify(updated))
  }

  const handleItemClick = (id: number | string) => {
    setIsOpen(false)
    navigate(`/places/${id}`)
  }

  if (recentItems.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-xl backdrop-blur-md border border-slate-700/80 flex items-center gap-2.5 transition-all duration-300 hover:scale-103 cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Clock size={14} className="text-emerald-400" />
          <span>Đã xem gần đây</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-800 text-emerald-100 text-[11px]">
            {recentItems.length}
          </span>
          <ChevronUp size={14} className="text-slate-400 group-hover:text-white transition-colors" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <div className="p-3.5 px-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-emerald-400" />
              <span className="text-xs font-bold">Địa điểm đã xem gần đây</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {recentItems.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClear}
                title="Xóa tất cả lịch sử"
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-xs"
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
                className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="group flex items-center gap-2.5 p-2 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={item.coverUrl || 'https://images.unsplash.com/photo-1527997921830-de1cf1f9b430?w=200&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      {item.province && (
                        <span className="truncate flex items-center gap-0.5">
                          <MapPin size={9} />
                          {item.province}
                        </span>
                      )}
                      {item.rating && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 font-bold text-slate-800">
                            <Star size={9} className="fill-amber-400 text-amber-400" />
                            {item.rating.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRemoveOne(e, item.id)}
                  className="p-1 rounded-full text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                  title="Xóa khỏi danh sách"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/profile')
              }}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Compass size={12} />
              <span>Xem nhật ký cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
