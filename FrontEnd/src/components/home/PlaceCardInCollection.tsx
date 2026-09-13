import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react'
import type { PlaceCardDto } from '@/types/models/place.model'

interface PlaceCardInCollectionProps {
  place: PlaceCardDto
}

export const PlaceCardInCollection: React.FC<PlaceCardInCollectionProps> = ({ place }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList = place.mediaUrls && place.mediaUrls.length > 0 ? place.mediaUrls : []
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

  const ratingScore = Number(place.avgRating || 0)

  return (
    <div
      onClick={() => navigate(`/places/${place.id}`)}
      className="group flex flex-col cursor-pointer shrink-0 w-full sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] snap-start select-none"
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100">
        {mediaList.length > 0 ? (
          <img
            src={mediaList[activeImageIndex]}
            alt={place.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <MapPin className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none"></div>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-xs text-[10px] font-bold text-white z-10">
              {activeImageIndex + 1}/{mediaList.length}
            </div>
          </>
        )}
      </div>

      <div className="pt-3 flex flex-col space-y-1.5">
        <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug tracking-tight">
          {place.name}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span>{ratingScore > 0 ? ratingScore.toFixed(1) : '5.0'}</span>
          <span className="text-slate-400 font-normal">·</span>
          <span className="text-slate-500 font-normal">
            {place.reviewCount ? `${place.reviewCount} đánh giá` : 'Mới'}
          </span>
        </div>

        {place.categoryName && (
          <div className="text-xs font-medium text-slate-600">
            {place.categoryName}
          </div>
        )}
      </div>
    </div>
  )
}
