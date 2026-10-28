import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Star,
  Plus,
  ExternalLink,
  Navigation,
  Compass
} from 'lucide-react'
import type { MentionedPlaceDto } from '@/types/models/blogArticle.model'

interface BlogMentionedPlacesWidgetProps {
  places: MentionedPlaceDto[]
  onSelectPlaceByName?: (name: string, province: string) => void
  onAddToItinerary?: (place: MentionedPlaceDto) => void
}

export const BlogMentionedPlacesWidget: React.FC<BlogMentionedPlacesWidgetProps> = ({
  places,
  onSelectPlaceByName,
  onAddToItinerary
}) => {
  const navigate = useNavigate()

  if (!places || places.length === 0) return null

  const handleViewPlace = (pl: MentionedPlaceDto) => {
    if (typeof pl.id === 'number') {
      navigate(`/places/${pl.id}`)
      return
    }
    if (onSelectPlaceByName) {
      onSelectPlaceByName(pl.name, pl.province || '')
      return
    }
    navigate(`/explore?q=${encodeURIComponent(pl.name)}`)
  }

  const handleAddItineraryClick = (pl: MentionedPlaceDto, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToItinerary) {
      onAddToItinerary(pl)
    } else {
      navigate(`/itinerary?addPlace=${encodeURIComponent(pl.name)}`)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <Navigation size={15} className="text-emerald-700" />
          <span>Địa điểm trong bài viết</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
          {places.length} điểm
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar py-1">
        {places.map((pl, i) => (
          <div
            key={pl.id || `place-${i}`}
            className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-all duration-200 space-y-2.5 group"
          >
            <div className="flex items-start gap-3">
              {pl.coverUrl ? (
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Compass size={20} />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider truncate">
                    {pl.category || 'Địa điểm du lịch'}
                  </span>
                  {pl.rating && (
                    <span className="flex items-center gap-0.5 text-xs font-extrabold text-amber-600 shrink-0">
                      <Star size={11} className="fill-amber-400 text-amber-500" />
                      <span>{pl.rating}</span>
                    </span>
                  )}
                </div>

                <h4
                  onClick={() => handleViewPlace(pl)}
                  className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-1"
                  title={pl.name}
                >
                  {pl.name}
                </h4>

                {pl.province && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span>{pl.province}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => handleViewPlace(pl)}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Xem chi tiết địa điểm"
              >
                <span>Xem địa điểm</span>
                <ExternalLink size={11} />
              </button>

              <button
                type="button"
                onClick={(e) => handleAddItineraryClick(pl, e)}
                className="py-1.5 px-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                title="Thêm địa điểm vào chuyến đi"
              >
                <Plus size={12} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Chuyến đi</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlogMentionedPlacesWidget
