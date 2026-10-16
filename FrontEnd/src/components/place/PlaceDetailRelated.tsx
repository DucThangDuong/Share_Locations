import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Compass, ArrowLeft, ArrowRight } from 'lucide-react'
import { recommendationService } from '@/services/recommendationService'
import { placeService } from '@/services/placeService'
import type { SimilarPlaceItem } from '@/types/recommendation.types'

interface PlaceDetailRelatedProps {
  currentPlaceId: number
}

const SimilarPlaceCard: React.FC<{ place: SimilarPlaceItem }> = ({ place }) => {
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
      onClick={() => {
        navigate(`/places/${place.placeId}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
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

export const PlaceDetailRelated: React.FC<PlaceDetailRelatedProps> = ({ currentPlaceId }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [places, setPlaces] = useState<SimilarPlaceItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const fetchSimilar = async () => {
      try {
        const res = await recommendationService.getSimilarPlaces(currentPlaceId, {
          topK: 12,
          radiusKm: 30
        })

        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPlaces(res.data)
          return
        }

        const fallbackRes = await placeService.getRelatedPlaces(currentPlaceId, 12)
        if (isMounted && fallbackRes.success && fallbackRes.data) {
          const adapted: SimilarPlaceItem[] = fallbackRes.data.map((p) => ({
            placeId: p.id,
            name: p.name,
            coverImageUrl: p.thumbnailUrl,
            mediaUrls: p.mediaUrls || undefined,
            categoryName: p.categoryName,
            provinceName: p.provinceName,
            avgRating: p.avgRating || 0,
            reviewCount: p.reviewCount || 0,
            matchPercentage: 85
          }))
          setPlaces(adapted)
        }
      } catch {
        try {
          const fallbackRes = await placeService.getRelatedPlaces(currentPlaceId, 12)
          if (isMounted && fallbackRes.success && fallbackRes.data) {
            const adapted: SimilarPlaceItem[] = fallbackRes.data.map((p) => ({
              placeId: p.id,
              name: p.name,
              coverImageUrl: p.thumbnailUrl,
              mediaUrls: p.mediaUrls || undefined,
              categoryName: p.categoryName,
              provinceName: p.provinceName,
              avgRating: p.avgRating || 0,
              reviewCount: p.reviewCount || 0,
              matchPercentage: 80
            }))
            setPlaces(adapted)
          }
        } catch {
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSimilar()

    return () => {
      isMounted = false
    }
  }, [currentPlaceId])

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: 'smooth' })
    }
  }

  if (!loading && places.length === 0) {
    return null
  }

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Địa Điểm Tương Tự Có Thể Bạn Sẽ Thích
          </h2>
        </div>

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

      {loading ? (
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
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
            <SimilarPlaceCard key={place.placeId} place={place} />
          ))}
        </div>
      )}
    </div>
  )
}

export default PlaceDetailRelated
