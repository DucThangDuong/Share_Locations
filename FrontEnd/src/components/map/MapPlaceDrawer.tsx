import { Link } from 'react-router-dom'
import { MapPin, Star, ExternalLink, ChevronRight, X } from 'lucide-react'
import type { PlaceMapItemDto } from '@/types/models/place.model'

interface MapPlaceDrawerProps {
  place: PlaceMapItemDto | null
  onClose: () => void
}

export const MapPlaceDrawer = ({ place, onClose }: MapPlaceDrawerProps) => {
  if (!place) return null

  return (
    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-20 animate-in slide-in-from-bottom-6">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 relative flex gap-4">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 bg-white text-gray-700 hover:text-gray-900 rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-24 h-24 rounded-lg object-cover shrink-0 bg-gray-100"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 shrink-0">
            <MapPin className="w-8 h-8" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-2xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {place.category}
              </span>
              <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{place.avgRating}</span>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate mt-1">
              {place.name}
            </h3>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span>{place.address}</span>
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-2xs text-gray-600 hover:text-emerald-700 font-semibold"
            >
              <span>Chỉ đường</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <Link
              to={`/places/${place.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>Xem chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
