import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Store, Utensils, ArrowLeft, ArrowRight } from 'lucide-react'
import { recommendationService } from '@/services/recommendationService'
import type { RecommendedFoodItem } from '@/types/recommendation.types'

const FoodSpecialtyCard: React.FC<{ food: RecommendedFoodItem }> = ({ food }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList = food.mediaUrls && food.mediaUrls.length > 0
    ? food.mediaUrls
    : (food.coverImageUrl ? [food.coverImageUrl] : [])
  const hasMultipleImages = mediaList.length > 1

  const displayPlaces = food.suggestedPlaces && food.suggestedPlaces.length > 0
    ? food.suggestedPlaces.slice(0, 2)
    : (food.matchedPlaceName
        ? [{
            id: food.matchedPlaceId || undefined,
            name: food.matchedPlaceName,
            address: food.matchedPlaceAddress || 'Địa điểm ẩm thực uy tín',
            rating: food.matchedPlaceRating || 4.8
          }]
        : [])

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

  const handlePlaceClick = (placeId?: number | string) => {
    if (placeId) {
      navigate(`/places/${placeId}`)
    }
  }

  return (
    <div
      onClick={() => {
        if (food.matchedPlaceId) navigate(`/places/${food.matchedPlaceId}`)
      }}
      className="group flex flex-col justify-between select-none bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-300 p-3 sm:p-3.5 cursor-pointer shrink-0 w-full sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] snap-start"
    >
      <div>
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
          {mediaList.length > 0 ? (
            <img
              src={mediaList[activeImageIndex]}
              alt={food.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-300">
              <Utensils className="w-10 h-10" />
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

        <div className="pt-3 space-y-1.5">
          <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight">
            {food.name}
          </h4>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {food.description || 'Hương vị ẩm thực truyền thống địa phương nổi tiếng với công thức chế biến độc đáo.'}
          </p>

          {displayPlaces.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5 mt-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                <Store className="w-3.5 h-3.5" />
                <span>QUÁN NGON ĐỀ XUẤT</span>
              </div>

              <div className="space-y-1.5">
                {displayPlaces.map((place, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaceClick(place.id)
                    }}
                    className="p-2 rounded-lg bg-white border border-emerald-100/80 hover:border-emerald-300 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs active-press"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {place.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {place.address}
                      </div>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-700 text-[11px] font-bold shrink-0 flex items-center gap-0.5">
                      <span>★</span>
                      <span>{(place.rating || 4.7).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const PersonalizedFoodSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [foods, setFoods] = useState<RecommendedFoodItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchFoods = async () => {
      setIsLoading(true)
      try {
        const res = await recommendationService.getRecommendedFoods({ topK: 12 })
        if (isMounted && res.success && res.data) {
          setFoods(res.data || [])
        }
      } catch {
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchFoods()

    return () => {
      isMounted = false
    }
  }, [])

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: 'smooth' })
    }
  }

  if (!isLoading && foods.length === 0) {
    return null
  }

  return (
    <section className="space-y-4 my-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Món Ngon Đặc Sản Đề Xuất Theo Gu
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
              <div className="aspect-square w-full rounded-xl bg-slate-200" />
              <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
              <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
              <div className="h-20 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {foods.map((food) => (
            <FoodSpecialtyCard key={food.foodId} food={food} />
          ))}
        </div>
      )}
    </section>
  )
}

export default PersonalizedFoodSection
