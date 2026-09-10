import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, Tag, Store, ArrowLeft, ArrowRight } from 'lucide-react'
import type { RegionFood } from '@/types/models/region.model'

interface RegionFoodSpecialtiesProps {
  foods: RegionFood[]
  regionName: string
}

const FoodSpecialtyCard: React.FC<{ food: RegionFood; regionName: string }> = ({ food }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)

  const mediaList = food.mediaUrls && food.mediaUrls.length > 0
    ? food.mediaUrls
    : (food.imageUrl ? [food.imageUrl] : [])
  const hasMultipleImages = mediaList.length > 1
  const suggestedPlaces = food.suggestedPlaces || []

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

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsSaved(!isSaved)
  }

  const handlePlaceClick = (place: { id?: number | string; name: string }) => {
    if (place.id) {
      navigate(`/places/${place.id}`)
    } else if (place.name) {
      navigate(`/explore?q=${encodeURIComponent(place.name)}`)
    }
  }

  return (
    <div className="group flex flex-col shrink-0 w-[270px] sm:w-[290px] md:w-[310px] select-none bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs hover:shadow-md transition-all duration-300 justify-between">
      <div>
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
          <img
            src={mediaList[activeImageIndex]}
            alt={food.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={isSaved ? 'Bỏ lưu món ăn' : 'Lưu món ăn'}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center z-10 transition-transform active:scale-95 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-800 stroke-[2]'
                }`}
            />
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

              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-xs text-[10px] font-bold text-white z-10">
                {activeImageIndex + 1}/{mediaList.length}
              </div>
            </>
          )}
        </div>

        <div className="pt-3 space-y-2">
          <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight">
            {food.name}
          </h4>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {food.description}
          </p>

          {suggestedPlaces.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5 mt-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                <Store className="w-3.5 h-3.5" />
                <span>QUÁN NGON ĐỀ XUẤT</span>
              </div>

              <div className="space-y-1.5">
                {suggestedPlaces.slice(0, 2).map((place, idx) => (
                  <div
                    key={idx}
                    onClick={() => handlePlaceClick(place)}
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
                      <span>{(place.rating || 5.0).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Mức giá:</span>
        </div>
        <div className="font-extrabold text-sm sm:text-[15px] text-[#004f32]">
          {food.priceRange || 'Tham khảo'}
        </div>
      </div>
    </div>
  )
}

export const RegionFoodSpecialties: React.FC<RegionFoodSpecialtiesProps> = ({ foods, regionName }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  if (!foods || foods.length === 0) return null

  return (
    <section className="space-y-4 my-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tinh Hoa Ẩm Thực {regionName}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 sm:gap-5 pb-4 hide-scrollbar snap-x scroll-smooth"
      >
        {foods.map((food) => (
          <FoodSpecialtyCard key={food.id} food={food} regionName={regionName} />
        ))}
      </div>
    </section>
  )
}
