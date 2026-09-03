import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Star } from 'lucide-react'
import { geographyService } from '@/services/geographyService'
import { placeService } from '@/services/placeService'
import type { RegionDto } from '@/types/models/geography.model'
import type { PlaceSummaryDto } from '@/types/models/place.model'

interface RegionTrackProps {
  region: RegionDto
}

const RegionTrack: React.FC<RegionTrackProps> = ({ region }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRegionPlaces = async () => {
      setIsLoading(true)
      try {
        const res = await placeService.searchPlaces({
          regionId: region.id,
          pageSize: 8,
          sortBy: 'popular_desc'
        })
        if (res.success && res.data) {
          setPlaces(res.data)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }

    fetchRegionPlaces()
  }, [region.id])

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = 330
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=500&fit=crop&auto=format'

  if (!isLoading && places.length === 0) {
    return null
  }

  return (
    <div className="mb-14">
      <div className="flex justify-between items-end mb-5 border-b border-slate-200/80 pb-3">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider rounded-md mb-1.5 border border-emerald-100">
            {region.tagline || `${region.provinceCount || ''} Tỉnh thành`}
          </span>
          <h3 className="text-2xl text-slate-900 font-extrabold tracking-tight">{region.name}</h3>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/explore?region=${encodeURIComponent(region.name)}&regionId=${region.id}`}
            className="hidden sm:inline-flex text-xs font-bold text-primary hover:text-primary-hover transition-colors"
          >
            Xem tất cả {region.name} &rarr;
          </Link>
          <div className="flex space-x-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer"
              title="Lướt sang trái"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer"
              title="Lướt sang phải"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-5 pb-4 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[280px] sm:w-[310px] h-[380px] rounded-3xl skeleton-shimmer shrink-0"></div>
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="flex overflow-x-auto gap-5 pb-4 hide-scrollbar snap-x scroll-smooth"
        >
          {places.map((place) => (
            <div
              key={place.id}
              onClick={() => navigate(`/explore?q=${encodeURIComponent(place.name)}&regionId=${region.id}`)}
              className="w-[280px] sm:w-[310px] h-[380px] relative rounded-3xl overflow-hidden shrink-0 snap-start group transition-all duration-300 cursor-pointer border border-slate-200/60"
            >
              <img
                src={place.thumbnailUrl || fallbackImage}
                className="w-full h-full object-cover"
                alt={place.name}
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = fallbackImage
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none z-10"></div>

              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{Number(place.avgRating || 0).toFixed(1)}</span>
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5 text-white z-20">
                <span className="text-secondary-container text-xs font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 inline" /> {place.provinceName || region.name}
                </span>
                <h4 className="text-xl font-extrabold mb-1.5 group-hover:text-emerald-300 transition-colors tracking-tight line-clamp-1">
                  {place.name}
                </h4>
                <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed font-normal">
                  {place.description || place.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const RegionsSection: React.FC = () => {
  const [regions, setRegions] = useState<RegionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoading(true)
      try {
        const res = await geographyService.getRegions()
        if (res.success && res.data) {
          setRegions(res.data)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }
    fetchRegions()
  }, [])

  if (!isLoading && regions.length === 0) {
    return null
  }

  return (
    <section id="diadiem" className="py-16 scroll-mt-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-secondary-container uppercase tracking-widest bg-secondary-container/10 px-3.5 py-1 rounded-full inline-block mb-2.5">
          Khám phá theo vùng miền
        </span>
        <h2 className="text-3xl md:text-4xl text-slate-900 font-extrabold tracking-tight mb-3">
          Hành trình 3 miền Bắc - Trung - Nam
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-xs sm:text-sm font-normal">
          Từ những đỉnh núi mờ sương Tây Bắc đến vẻ trù phú của miệt vườn phương Nam, mỗi vùng miền là một trang ký ức rực rỡ.
        </p>
      </div>

      {regions.map((region) => (
        <RegionTrack key={region.id} region={region} />
      ))}
    </section>
  )
}
