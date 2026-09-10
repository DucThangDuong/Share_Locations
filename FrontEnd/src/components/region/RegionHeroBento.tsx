import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { RegionLandingData } from '@/types/models/region.model'

interface RegionHeroBentoProps {
  data: RegionLandingData
}

export const RegionHeroBento: React.FC<RegionHeroBentoProps> = ({ data }) => {
  const images = data.heroImages || []
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const currentImage = images[currentIdx] || images[0]

  return (
    <section className="relative pt-4 pb-2">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
              {data.name}, Việt Nam
            </h1>

            <p className="mt-2 text-sm sm:text-base text-stone-700 font-semibold max-w-3xl">
              {data.heroHeadline}
            </p>
          </div>
        </div>

        <div className="mt-3 max-w-4xl">
          <p className={`text-xs sm:text-sm text-stone-600 leading-relaxed font-normal ${isExpanded ? '' : 'line-clamp-2'}`}>
            {data.heroSubheadline}
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-xs font-bold text-stone-800 hover:text-[#C0392B] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Đọc thêm'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-stone-900 shadow-xl border border-stone-200 aspect-16/9 sm:aspect-21/9 min-h-[280px] sm:min-h-[420px] lg:min-h-[480px]">
        {currentImage && (
          <img
            src={currentImage.url}
            alt="Hero scenery"
            className="w-full h-full object-cover transition-all duration-700 ease-out"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        <button
          type="button"
          onClick={handlePrev}
          aria-label="Ảnh trước"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer z-10 active-press hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Ảnh tiếp theo"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer z-10 active-press hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {images.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentIdx(dotIdx)}
              aria-label={`Chuyển đến ảnh ${dotIdx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${dotIdx === currentIdx
                ? 'w-6 bg-white shadow-sm'
                : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
            />
          ))}
        </div>

        <div className="absolute bottom-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/15">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{currentIdx + 1} / {images.length}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
