import React, { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { ExplorePlaceCard } from '@/components/explore/ExplorePlaceCard'
import type { PlaceSummaryDto } from '@/types/models/place.model'

interface PlaceDetailRelatedProps {
  currentPlaceId: number
}

export const PlaceDetailRelated: React.FC<PlaceDetailRelatedProps> = ({ currentPlaceId }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    placeService
      .getRelatedPlaces(currentPlaceId, 8)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setPlaces(res.data)
        }
      })
      .catch((err) => {
        console.error('Không thể tải danh sách địa điểm liên quan:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentPlaceId])

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const timer = setTimeout(checkScroll, 150)
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)

    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [places, loading])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const containerWidth = scrollRef.current.clientWidth
    const scrollAmount = containerWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  if (loading) {
    return (
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="h-5 w-44 bg-slate-200 rounded-lg animate-pulse mb-1.5" />
            <div className="h-3.5 w-64 bg-slate-100 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] shrink-0 bg-white rounded-lg overflow-hidden border border-slate-200/80 p-0 space-y-3 animate-pulse flex flex-col"
            >
              <div className="aspect-square w-full bg-slate-200" />
              <div className="p-3.5 sm:p-4 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="pt-2.5 border-t border-slate-100 flex justify-between">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!places || places.length === 0) {
    return null
  }

  return (
    <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/80 shadow-2xs space-y-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Địa điểm tương tự</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:border-slate-200 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              title="Địa điểm trước"
              aria-label="Địa điểm trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:border-slate-200 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              title="Địa điểm tiếp theo"
              aria-label="Địa điểm tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {places.map((place) => (
          <div
            key={place.id}
            className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] shrink-0 snap-start"
          >
            <ExplorePlaceCard
              place={place}
              viewMode="grid"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlaceDetailRelated
