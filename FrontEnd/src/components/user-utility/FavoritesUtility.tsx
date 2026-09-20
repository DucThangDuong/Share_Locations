import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bookmark,
  Heart,
  Star,
  Search,
  X,
  Loader2,
  Compass,
  MapPin,
  UtensilsCrossed,
  BookOpen
} from 'lucide-react'
import { userService } from '@/services/userService'
import type { FavoriteItem, PagedResultDto } from '@/types/models/userProfile.model'

interface FavoritesUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
  onToast?: (msg: string) => void
}

export const FavoritesUtility: React.FC<FavoritesUtilityProps> = ({
  isDrawer = false,
  onClose,
  onToast
}) => {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<number>(0) // 0: All, 1: Place, 2: Food, 3: Trip, 4: Blog
  const [searchQuery, setSearchQuery] = useState('')

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getMyFavorites({ pageSize: 50 })
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setFavorites(res.data)
        } else if (Array.isArray((res.data as PagedResultDto<FavoriteItem>).items)) {
          setFavorites((res.data as PagedResultDto<FavoriteItem>).items)
        } else {
          setFavorites([])
        }
      } else {
        setFavorites([])
      }
    } catch {
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleRemove = async (e: React.MouseEvent, item: FavoriteItem) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      const res = await userService.removeFavorite(item.targetType, item.targetId)
      if (res.success) {
        setFavorites((prev) =>
          prev.filter((f) => !(f.targetType === item.targetType && f.targetId === item.targetId))
        )
        onToast?.(`Đã bỏ lưu "${item.title}"`)
      } else {
        onToast?.('Không thể bỏ lưu lúc này.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi bỏ lưu.')
    }
  }

  const handleSelect = (item: FavoriteItem) => {
    onClose?.()
    if (item.targetType === 1) {
      navigate(`/places/${item.targetId}`)
    } else if (item.targetType === 2) {
      navigate(`/explore?category=food&id=${item.targetId}`)
    } else if (item.targetType === 3) {
      navigate(`/itinerary?tripId=${item.targetId}`)
    } else if (item.targetType === 4) {
      navigate(`/blog/${item.targetId}`)
    }
  }

  const filteredItems = useMemo(() => {
    return favorites.filter((item) => {
      if (activeFilter !== 0 && item.targetType !== activeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = item.title?.toLowerCase().includes(q)
        const matchesTag = item.categoryTag?.toLowerCase().includes(q)
        const matchesSub = item.subtitle?.toLowerCase().includes(q)
        return matchesTitle || matchesTag || matchesSub
      }
      return true
    })
  }, [favorites, activeFilter, searchQuery])

  const filterTabs = [
    { id: 0, label: 'Tất cả', count: favorites.length, icon: Bookmark },
    { id: 1, label: 'Địa điểm', count: favorites.filter((f) => f.targetType === 1).length, icon: MapPin },
    { id: 2, label: 'Ẩm thực', count: favorites.filter((f) => f.targetType === 2).length, icon: UtensilsCrossed },
    { id: 3, label: 'Hành trình', count: favorites.filter((f) => f.targetType === 3).length, icon: Compass },
    { id: 4, label: 'Bài viết', count: favorites.filter((f) => f.targetType === 4).length, icon: BookOpen }
  ]

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top filter chips and search */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === tab.id ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {!isDrawer && (
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm trong mục đã lưu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-emerald-800" />
            <span className="text-xs">Đang tải danh sách yêu thích...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <Bookmark size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có mục nào trong danh sách</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Bạn có thể lưu các địa điểm, ẩm thực, hành trình và bài viết thú vị khi khám phá hệ thống.
            </p>
            <Link
              to="/explore"
              onClick={onClose}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-800 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs"
            >
              Khám phá địa điểm ngay
            </Link>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Layout */
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const coverImg =
                item.coverImg ||
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop'
              return (
                <div
                  key={`${item.targetType}-${item.targetId}`}
                  onClick={() => handleSelect(item)}
                  className="group relative flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:shadow-xs bg-white"
                >
                  <img
                    src={coverImg}
                    alt={item.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/80 group-hover:opacity-80 transition-opacity duration-200"
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 mb-1">
                      {item.categoryTag || (item.targetType === 1 ? 'Địa điểm' : item.targetType === 2 ? 'Ẩm thực' : item.targetType === 3 ? 'Hành trình' : 'Bài viết')}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                      {item.title}
                    </h4>
                    {item.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-500">
                        <Star size={11} className="fill-current" />
                        <span>{item.rating.toFixed(1)}</span>
                        {item.reviewCount > 0 && (
                          <span className="text-slate-400 font-normal">({item.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, item)}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Bỏ lưu"
                    aria-label="Bỏ lưu"
                  >
                    <Heart size={14} className="fill-rose-500" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const coverImg =
                item.coverImg ||
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=400&fit=crop'
              return (
                <div
                  key={`${item.targetType}-${item.targetId}`}
                  onClick={() => handleSelect(item)}
                  className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/70 text-white backdrop-blur-xs">
                        {item.categoryTag || (item.targetType === 1 ? 'Địa điểm' : item.targetType === 2 ? 'Ẩm thực' : item.targetType === 3 ? 'Hành trình' : 'Bài viết')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, item)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-rose-400 hover:text-rose-500 backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                      title="Bỏ lưu"
                    >
                      <Heart size={14} className="fill-rose-500 text-rose-500" />
                    </button>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} className="shrink-0 text-slate-400" />
                          <span>{item.subtitle}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      {item.rating > 0 ? (
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star size={12} className="fill-current" />
                          <span>{item.rating.toFixed(1)}</span>
                          {item.reviewCount > 0 && (
                            <span className="text-slate-400 font-normal">({item.reviewCount})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Đã lưu</span>
                      )}
                      <span className="text-emerald-800 font-bold group-hover:underline text-[11px]">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesUtility
