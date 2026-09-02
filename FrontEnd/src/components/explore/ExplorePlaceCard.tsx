import React, { useState, useEffect } from 'react'
import { MapPin, Star, Heart, Clock } from 'lucide-react'
import type { PlaceSummaryDto } from '@/types/models/place.model'

const ImgWithFallback: React.FC<{ src?: string | null; alt: string; className?: string }> = ({ src, alt, className }) => {
  const fallbackUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=500&fit=crop&auto=format'
  const [imgSrc, setImgSrc] = useState(src || fallbackUrl)

  useEffect(() => {
    setImgSrc(src || fallbackUrl)
  }, [src])

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setImgSrc(fallbackUrl)
      }}
    />
  )
}

interface ExplorePlaceCardProps {
  place: PlaceSummaryDto
  viewMode: 'grid' | 'list'
  isSaved: boolean
  onToggleSave: (id: number) => void
}

export const ExplorePlaceCard: React.FC<ExplorePlaceCardProps> = ({
  place,
  viewMode,
  isSaved,
  onToggleSave
}) => {
  const priceDisplay = place.minPrice && place.maxPrice
    ? `${place.minPrice.toLocaleString('vi-VN')}đ – ${place.maxPrice.toLocaleString('vi-VN')}đ`
    : place.minPrice
      ? `Từ ${place.minPrice.toLocaleString('vi-VN')}đ`
      : 'Miễn phí'

  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 transition-colors duration-300 flex flex-col sm:flex-row">
        <div className="sm:w-64 aspect-16/10 sm:aspect-auto relative bg-slate-100 shrink-0 overflow-hidden">
          <ImgWithFallback
            src={place.thumbnailUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none"></div>
          <div className="absolute top-3 left-3">
            {place.categoryName && (
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                {place.categoryName}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{place.provinceName ? `${place.provinceName}, ${place.regionName}` : place.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{Number(place.avgRating || 0).toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span>
              </div>
              <button
                onClick={() => onToggleSave(place.id)}
                aria-label={`Lưu ${place.name} vào danh sách yêu thích`}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active-press ${isSaved
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-primary transition-colors">
            {place.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {place.description || place.address}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[place.categoryName, place.placeTypeName, place.provinceName].filter(Boolean).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{place.openingHours || '08:00 – 17:00'}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${place.status === 2
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
                  }`}
              >
                {place.status === 2 ? 'Đang hoạt động' : 'Tạm đóng'}
              </span>
            </div>
            <div className="font-extrabold text-emerald-800 text-xs">
              {priceDisplay}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 transition-colors duration-300 flex flex-col">
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
        <ImgWithFallback
          src={place.thumbnailUrl}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none"></div>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {place.categoryName && (
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
              {place.categoryName}
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${place.status === 2
              ? 'bg-emerald-600/90 text-white'
              : 'bg-rose-600/90 text-white'
              }`}
          >
            {place.status === 2 ? 'Đang hoạt động' : 'Tạm đóng'}
          </span>
        </div>
        <button
          onClick={() => onToggleSave(place.id)}
          aria-label={`Lưu ${place.name} vào danh sách yêu thích`}
          className={`w-9 h-9 absolute top-3 right-3 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active-press ${isSaved
            ? 'bg-rose-500 text-white'
            : 'bg-white/80 text-slate-600 hover:bg-white'
            }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{place.provinceName ? `${place.provinceName}, ${place.regionName}` : place.address}</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-900 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(place.avgRating || 0).toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span>
          </div>
        </div>

        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
          {place.name}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {place.description || place.address}
        </p>

        <div className="flex flex-wrap gap-1 pt-1">
          {[place.categoryName, place.placeTypeName, place.provinceName].filter(Boolean).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{place.openingHours || '08:00 – 17:00'}</span>
          </div>
          <div className="font-extrabold text-emerald-800 text-xs">
            {priceDisplay}
          </div>
        </div>
      </div>
    </div>
  )
}
