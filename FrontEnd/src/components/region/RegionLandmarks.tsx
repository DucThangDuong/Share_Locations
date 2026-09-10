import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, Star, MapPin, ArrowLeft, ArrowRight } from 'lucide-react'
import type { RegionLandmark } from '@/types/models/region.model'

interface RegionLandmarksProps {
  landmarks: RegionLandmark[]
  regionName: string
}

const LandmarkCard: React.FC<{ landmark: RegionLandmark }> = ({ landmark }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)

  const mediaList = landmark.mediaUrls && landmark.mediaUrls.length > 0
    ? landmark.mediaUrls
    : (landmark.imageUrl ? [landmark.imageUrl] : [])
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

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsSaved(!isSaved)
  }

  return (
    <div
      onClick={() => navigate(`/places/${landmark.id}`)}
      className="group flex flex-col cursor-pointer shrink-0 w-[240px] sm:w-[260px] md:w-[280px] select-none"
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100">
        <img
          src={mediaList[activeImageIndex]}
          alt={landmark.name}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={isSaved ? 'Bỏ lưu địa điểm' : 'Lưu địa điểm'}
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

      <div className="pt-3 flex flex-col space-y-1.5">
        <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug tracking-tight">
          {landmark.name}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span>{landmark.rating.toFixed(1)}</span>
          <span className="text-slate-400 font-normal">·</span>
          <span className="text-slate-500 font-normal">
            {landmark.reviewCount} đánh giá
          </span>
        </div>

        <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
          <span className="truncate">{landmark.location}</span>
        </div>
      </div>
    </div>
  )
}

export const RegionLandmarks: React.FC<RegionLandmarksProps> = ({ landmarks, regionName }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  if (!landmarks || landmarks.length === 0) return null

  return (
    <section className="space-y-4 my-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Địa Điểm Không Thể Bỏ Lỡ {regionName}
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

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 sm:gap-5 pb-4 hide-scrollbar snap-x scroll-smooth"
      >
        {landmarks.map((landmark) => (
          <LandmarkCard key={landmark.id} landmark={landmark} />
        ))}
      </div>
    </section>
  )
}
