import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Compass, ArrowLeft, ArrowRight } from 'lucide-react'
import { recommendationService } from '@/services/recommendationService'
import type { RecommendedPlaceItem } from '@/types/recommendation.types'

const RecommendationPlaceCard: React.FC<{ place: RecommendedPlaceItem }> = ({ place }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList = place.mediaUrls && place.mediaUrls.length > 0
    ? place.mediaUrls
    : (place.coverImageUrl || place.thumbnailUrl ? [place.coverImageUrl || place.thumbnailUrl!] : [])
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

  return (
    <div
      onClick={() => navigate(`/places/${place.placeId}`)}
      className="group flex flex-col cursor-pointer shrink-0 w-full sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] snap-start select-none"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
        {mediaList.length > 0 ? (
          <img
            src={mediaList[activeImageIndex]}
            alt={place.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <Compass className="w-10 h-10" />
          </div>
        )}

        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-xs text-[10px] font-bold text-white z-10">
              {activeImageIndex + 1}/{mediaList.length}
            </div>
          </>
        )}
      </div>

      <div className="pt-2.5 flex flex-col space-y-1">
        <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight">
          {place.name}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span>{Number(place.avgRating || 0).toFixed(1)}</span>
          <span className="text-slate-400 font-normal">·</span>
          <span className="text-slate-500 font-normal">
            {place.reviewCount || 0} đánh giá
          </span>
        </div>
      </div>
    </div>
  )
}

export const PersonalizedRecommendationSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [places, setPlaces] = useState<RecommendedPlaceItem[]>([])
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        const res = await recommendationService.getPersonalizedPlaces({ topK: 12 })
        if (isMounted && res.success && res.data) {
          setPlaces(res.data.items || [])
          setIsPersonalized(Boolean(res.data.isPersonalized))
        }
      } catch {
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchRecommendations()

    return () => {
      isMounted = false
    }
  }, [])

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: 'smooth' })
    }
  }

  if (!isLoading && places.length === 0) {
    return null
  }

  return (
    <section className="space-y-4 my-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isPersonalized ? 'Địa Điểm Gợi Ý Dành Riêng Cho Bạn' : 'Địa Điểm Không Thể Bỏ Lỡ'}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#2D6A4F] hover:text-white transition-all cursor-pointer shadow-xs active-press"
              title="Lướt sang trái"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#2D6A4F] hover:text-white transition-all cursor-pointer shadow-xs active-press"
              title="Lướt sang phải"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-full sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 space-y-2.5 animate-pulse"
            >
              <div className="aspect-square w-full rounded-2xl bg-slate-200" />
              <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
              <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {places.map((place) => (
            <RecommendationPlaceCard key={place.placeId} place={place} />
          ))}
        </div>
      )}
    </section>
  )
}

export default PersonalizedRecommendationSection
