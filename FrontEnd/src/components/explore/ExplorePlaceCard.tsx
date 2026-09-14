import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Clock } from 'lucide-react'
import type { PlaceSummaryDto } from '@/types/models/place.model'

interface ExplorePlaceCardProps {
  place: PlaceSummaryDto
  viewMode: 'grid' | 'list'
}

export const ExplorePlaceCard: React.FC<ExplorePlaceCardProps> = ({
  place,
  viewMode
}) => {
  const navigate = useNavigate()

  const priceDisplay = place.minPrice && place.maxPrice
    ? `${place.minPrice.toLocaleString('vi-VN')}đ – ${place.maxPrice.toLocaleString('vi-VN')}đ`
    : place.minPrice
      ? `Từ ${place.minPrice.toLocaleString('vi-VN')}đ`
      : 'Miễn phí'

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => navigate(`/places/${place.id}`)}
        className="group bg-white rounded-lg overflow-hidden border border-slate-200/80 transition-colors duration-300 flex flex-col sm:flex-row cursor-pointer"
      >
        <div className="w-full sm:w-52 md:w-56 aspect-square sm:aspect-square relative bg-slate-100 shrink-0 overflow-hidden">
          {place.thumbnailUrl ? (
            <img
              src={place.thumbnailUrl}
              alt={place.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
              <MapPin className="w-10 h-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none"></div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-2 overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{place.provinceName ? `${place.provinceName}, ${place.regionName}` : place.address}</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-slate-900 text-xs shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{Number(place.avgRating || 0).toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span>
              </div>
            </div>

            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mt-1">
              {place.name}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 font-normal">
              {place.description || place.address}
            </p>
          </div>

          <div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs mt-1">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{place.openingHours || '08:00 – 17:00'}</span>
                </div>
              </div>
              <div className="font-extrabold text-emerald-800 text-xs">
                {priceDisplay}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate(`/places/${place.id}`)}
      className="group bg-white rounded-lg overflow-hidden border border-slate-200/80 transition-colors duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden shrink-0">
        {place.thumbnailUrl ? (
          <img
            src={place.thumbnailUrl}
            alt={place.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <MapPin className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none"></div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{place.provinceName ? `${place.provinceName}, ${place.regionName}` : place.address}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-slate-900 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(place.avgRating || 0).toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span>
            </div>
          </div>

          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mt-1.5">
            {place.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 font-normal">
            {place.description || place.address}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{place.openingHours || '08:00 – 17:00'}</span>
          </div>
          <div className="font-extrabold text-emerald-800">
            {priceDisplay}
          </div>
        </div>
      </div>
    </div>
  )
}

