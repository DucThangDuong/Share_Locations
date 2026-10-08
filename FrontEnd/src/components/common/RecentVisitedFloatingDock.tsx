import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  MapPin,
  Star,
  History
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
  const dockRef = useRef<HTMLDivElement>(null)

  const loadRecentItems = async () => {
    const clearedAt = Number(localStorage.getItem('langthang_history_cleared_at') || 0)
    const deletedIds: (number | string)[] = (() => {
      try {
        return JSON.parse(localStorage.getItem('langthang_deleted_histories') || '[]')
      } catch {
        return []
      }
    })()

    if (isAuthenticated) {
      try {
        const res = await userService.getMyAccessHistories({ pageSize: 15 })
        if (res.success && Array.isArray(res.data)) {
          const validList = res.data.filter((item) => {
            if (deletedIds.includes(item.placeId)) return false
            if (item.viewedAt && clearedAt > 0) {
              const itemTime = new Date(item.viewedAt).getTime()
              if (itemTime <= clearedAt) return false
            }
            return true
          })

          const mapped: RecentVisitedItem[] = validList.slice(0, 10).map((item) => ({
            id: item.placeId,
            name: item.placeName,
            province: item.province || undefined,
            coverUrl: item.coverImg || undefined,
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
        const parsed: RecentVisitedItem[] = JSON.parse(stored)
        const validList = parsed.filter((item) => !deletedIds.includes(item.id))
        setRecentItems(validList.slice(0, 10))
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

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentItems([])
    localStorage.removeItem('langthang_recent_visited')
    localStorage.setItem('langthang_history_cleared_at', Date.now().toString())
    localStorage.removeItem('langthang_deleted_histories')
    setIsOpen(false)

    if (isAuthenticated) {
      await userService.clearMyAccessHistories()
    }
  }

  const handleRemoveOne = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation()
    const updated = recentItems.filter((item) => item.id !== id)
    setRecentItems(updated)
    localStorage.setItem('langthang_recent_visited', JSON.stringify(updated))

    try {
      const deletedIds = JSON.parse(localStorage.getItem('langthang_deleted_histories') || '[]')
      if (!deletedIds.includes(id)) {
        deletedIds.push(id)
        localStorage.setItem('langthang_deleted_histories', JSON.stringify(deletedIds))
      }
    } catch {
      // Ignore
    }

    if (updated.length === 0) {
      setIsOpen(false)
    }

    if (isAuthenticated) {
      await userService.deleteMyAccessHistory(id)
    }
  }

  const handleItemClick = (id: number | string) => {
    setIsOpen(false)
    navigate(`/places/${id}`)
  }

  if (recentItems.length === 0) return null

  return (
    <div ref={dockRef} className="fixed bottom-5 left-4 sm:left-6 z-40 font-sans">
      {!isOpen ? (
        /* Floating Button (Pill Mode) */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white/95 hover:bg-white text-slate-800 text-xs font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.18)] backdrop-blur-md border border-slate-200/90 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
            <History size={13} className="group-hover:rotate-[-20deg] transition-transform duration-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>
          <span className="hidden sm:inline font-semibold text-slate-700 group-hover:text-slate-900">
            Đã xem gần đây
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold">
            {recentItems.length}
          </span>
          <ChevronUp size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      ) : (
        /* Expanded Floating Card */
        <div className="w-[330px] sm:w-[380px] rounded-2xl bg-white border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
          {/* Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-emerald-50/90 via-slate-50/60 to-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900">Địa điểm đã xem</h3>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                title="Xóa tất cả lịch sử"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Xóa hết</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </div>

          {/* List Items */}
          <div className="max-h-[340px] overflow-y-auto p-2 space-y-1 divide-y divide-slate-50 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent]">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="group flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50/90 transition-all cursor-pointer pt-2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="w-13 h-13 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative flex items-center justify-center border border-slate-100 shadow-2xs">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <MapPin size={18} className="text-slate-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                      {item.province && (
                        <span className="truncate flex items-center gap-0.5 text-slate-500 font-medium">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          {item.province}
                        </span>
                      )}

                      {item.rating ? (
                        <span className="flex items-center gap-0.5 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          {item.rating.toFixed(1)}
                        </span>
                      ) : null}

                      {item.visitedAt && (
                        <span className="text-[10px] text-slate-400 ml-auto font-normal">
                          {item.visitedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove single item button */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveOne(e, item.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                  title="Xóa địa điểm này"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

