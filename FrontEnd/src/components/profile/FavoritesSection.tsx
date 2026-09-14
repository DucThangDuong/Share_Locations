import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Heart,
  LayoutGrid,
  List,
  Search,
  Star,
  MapPin,
  Compass,
  UtensilsCrossed,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import type { FavoriteItem, FavoriteType } from '@/types/models/userProfile.model'

interface FavoritesSectionProps {
  favorites: FavoriteItem[]
  onRemoveFavorite: (targetType: number, targetId: number) => void
  onSelectPlaceById?: (placeId: number) => void
}

interface FavoriteCardProps {
  item: FavoriteItem
  onRemove: (targetType: number, targetId: number) => void
  onSelect: (item: FavoriteItem) => void
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ item, onRemove, onSelect }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList =
    item.mediaUrls && item.mediaUrls.length > 0
      ? item.mediaUrls
      : item.coverImg
        ? [item.coverImg]
        : []
  const hasMultipleImages = mediaList.length > 1

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveImageIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveImageIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1))
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onRemove(item.targetType, item.targetId)
  }

  const ratingScore = item.rating || 0

  return (
    <div
      onClick={() => onSelect(item)}
      className="group flex flex-col cursor-pointer select-none transition-all duration-300"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
        {mediaList.length > 0 ? (
          <img
            src={mediaList[activeImageIndex]}
            alt={item.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <Compass className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

        <button
          type="button"
          onClick={handleRemoveClick}
          aria-label="Bỏ lưu khỏi danh sách yêu thích"
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-rose-400 hover:text-rose-500 backdrop-blur-xs transition-transform active:scale-95 z-10 cursor-pointer shadow-xs"
        >
          <Heart size={14} className="fill-current text-rose-500" />
        </button>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="pt-3 flex flex-col space-y-1">
        <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight">
          {item.title}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span>{ratingScore > 0 ? ratingScore.toFixed(1) : '5.0'}</span>
          <span className="text-slate-400 font-normal">·</span>
          <span className="text-slate-500 font-normal">
            {item.reviewCount ? `${item.reviewCount} đánh giá` : 'Mới'}
          </span>
          {item.price && (
            <>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-emerald-700 font-semibold">{item.price}</span>
            </>
          )}
        </div>

        <div className="text-xs text-slate-500 truncate">
          {item.subtitle || 'Địa điểm hấp dẫn'}
        </div>
      </div>
    </div>
  )
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  onRemoveFavorite,
  onSelectPlaceById,
}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const typeParam = searchParams.get('type')
  const activeTab: 'all' | FavoriteType = (() => {
    if (typeParam === 'places' || typeParam === '1') return 1
    if (typeParam === 'food' || typeParam === '2') return 2
    if (typeParam === 'itinerary' || typeParam === '3') return 3
    if (typeParam === 'blogs' || typeParam === '4') return 4
    return 'all'
  })()

  const setActiveTab = (val: 'all' | FavoriteType) => {
    const newParams = new URLSearchParams(searchParams)
    if (val === 'all') {
      newParams.delete('type')
    } else {
      const typeMap: Record<FavoriteType, string> = {
        1: 'places',
        2: 'food',
        3: 'itinerary',
        4: 'blogs'
      }
      newParams.set('type', typeMap[val] || String(val))
    }
    setSearchParams(newParams, { replace: true })
  }

  const viewParam = searchParams.get('view')
  const viewMode: 'grid' | 'list' = viewParam === 'list' ? 'list' : 'grid'

  const setViewMode = (mode: 'grid' | 'list') => {
    const newParams = new URLSearchParams(searchParams)
    if (mode === 'grid') {
      newParams.delete('view')
    } else {
      newParams.set('view', mode)
    }
    setSearchParams(newParams, { replace: true })
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'name'>('newest')

  const tabs = [
    { id: 'all', label: 'Tất cả', count: favorites.length },
    {
      id: 1 as FavoriteType,
      label: 'Địa điểm',
      icon: MapPin,
      count: favorites.filter((f) => f.targetType === 1).length
    },
    {
      id: 2 as FavoriteType,
      label: 'Ẩm thực',
      icon: UtensilsCrossed,
      count: favorites.filter((f) => f.targetType === 2).length
    },
    {
      id: 3 as FavoriteType,
      label: 'Hành trình',
      icon: Compass,
      count: favorites.filter((f) => f.targetType === 3).length
    },
    {
      id: 4 as FavoriteType,
      label: 'Bài viết',
      icon: BookOpen,
      count: favorites.filter((f) => f.targetType === 4).length
    }
  ]

  let filteredFavorites = favorites.filter((item) => {
    const matchesTab = activeTab === 'all' || item.targetType === activeTab
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      (item.title || '').toLowerCase().includes(query) ||
      (item.subtitle || '').toLowerCase().includes(query) ||
      (item.categoryTag || '').toLowerCase().includes(query)
    return matchesTab && matchesSearch
  })

  if (sortBy === 'rating') {
    filteredFavorites = [...filteredFavorites].sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    )
  } else if (sortBy === 'name') {
    filteredFavorites = [...filteredFavorites].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '')
    )
  }

  const handleItemClick = (item: FavoriteItem) => {
    if (onSelectPlaceById && item.targetType === 1) {
      onSelectPlaceById(item.targetId)
    } else if (item.targetType === 1) {
      navigate(`/places/${item.targetId}`)
    } else if (item.targetType === 4) {
      navigate('/blog')
    } else if (item.targetType === 3) {
      navigate('/itinerary')
    } else {
      navigate(`/explore?q=${encodeURIComponent(item.title)}`)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | FavoriteType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
                  }`}
              >
                {Icon && <Icon size={13} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm trong mục đã lưu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'rating' | 'name')}
            aria-label="Sắp xếp mục đã lưu"
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-700 cursor-pointer"
          >
            <option value="newest">Mới lưu gần đây</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="name">Theo tên A - Z</option>
          </select>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Hiển thị dạng lưới"
              className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Hiển thị dạng danh sách"
              className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Heart size={20} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Không tìm thấy mục đã lưu nào
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Hãy khám phá các địa điểm hoặc ẩm thực trên trang chủ để lưu lại cho hành trình của bạn.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredFavorites.map((item) => (
            <FavoriteCard
              key={`${item.targetType}-${item.targetId}`}
              item={item}
              onRemove={onRemoveFavorite}
              onSelect={handleItemClick}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFavorites.map((item) => (
            <div
              key={`${item.targetType}-${item.targetId}`}
              className="group bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-center gap-4"
            >
              <div
                onClick={() => handleItemClick(item)}
                className="relative aspect-square w-24 sm:w-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
              >
                <img
                  src={item.coverImg}
                  alt={item.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
              </div>

              <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                <h3
                  onClick={() => handleItemClick(item)}
                  className="font-bold text-sm text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer truncate"
                >
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 pt-1">
                  {item.rating && (
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{item.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {item.price && (
                    <span className="text-emerald-800 font-semibold">{item.price}</span>
                  )}
                  <span className="text-slate-400 text-[11px]">Đã lưu {item.savedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-800 text-slate-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem</span>
                  <ExternalLink size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveFavorite(item.targetType, item.targetId)}
                  aria-label="Bỏ lưu"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                >
                  <Heart size={14} className="fill-rose-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
