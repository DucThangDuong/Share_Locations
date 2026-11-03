import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Compass,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { recommendationService } from '@/services/recommendationService'
import type {
  RecommendedPlaceItem,
  NearbyPlaceItem,
  DualContextHomeFeedResponse
} from '@/types/recommendation.types'
import {
  getIntentContext,
  getRecentIntentProvinces,
  getTopCategoryIds,
  snapGpsToGrid,
  buildCacheSignature,
  getHomeFeedCache,
  setHomeFeedCache
} from '@/utils/deviceContext'

const DEFAULT_LAT = 10.762622
const DEFAULT_LNG = 106.660172

const NearbyPlaceCard: React.FC<{ place: NearbyPlaceItem }> = ({ place }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList =
    place.mediaUrls && place.mediaUrls.length > 0
      ? place.mediaUrls
      : place.coverImageUrl || place.thumbnailUrl
        ? [place.coverImageUrl || place.thumbnailUrl!]
        : []
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
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
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
        <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 leading-snug tracking-tight">
          {place.name}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold flex-wrap">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span>{Number(place.avgRating || 0).toFixed(1)}</span>
          <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span>
        </div>
      </div>
    </div>
  )
}

const IntentPlaceCard: React.FC<{ place: RecommendedPlaceItem }> = ({ place }) => {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList =
    place.mediaUrls && place.mediaUrls.length > 0
      ? place.mediaUrls
      : place.coverImageUrl || place.thumbnailUrl
        ? [place.coverImageUrl || place.thumbnailUrl!]
        : []
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
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
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
        <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 leading-snug tracking-tight">
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
  const shelf1ScrollRef = useRef<HTMLDivElement>(null)
  const shelf2ScrollRef = useRef<HTMLDivElement>(null)

  const [feedData, setFeedData] = useState<DualContextHomeFeedResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeIntentProvinceId, setActiveIntentProvinceId] = useState<number | null>(null)

  const scrollShelf = (ref: React.RefObject<HTMLDivElement | null>, dir: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' })
    }
  }

  const loadFeed = useCallback(async (bypassCache = false) => {
    setIsLoading(true)

    let lat = DEFAULT_LAT
    let lng = DEFAULT_LNG

    const getGpsCoords = (): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            })
          },
          () => {
            resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
          },
          { timeout: 2500, maximumAge: 300000 }
        )
      })
    }

    try {
      const coords = await getGpsCoords()
      lat = coords.lat
      lng = coords.lng
    } catch {
      lat = DEFAULT_LAT
      lng = DEFAULT_LNG
    }

    const { gridKey } = snapGpsToGrid(lat, lng)
    const intentProvinces = getRecentIntentProvinces()
    const intentIds = intentProvinces.map((p) => p.provinceId)
    const primaryIntent = intentProvinces[0] || getIntentContext()
    const topCats = getTopCategoryIds()
    const signature = buildCacheSignature(gridKey, intentIds, topCats)

    if (!bypassCache) {
      const cached = getHomeFeedCache<DualContextHomeFeedResponse>(signature)
      if (cached) {
        setFeedData(cached)
        setIsLoading(false)
        return
      }
    }

    try {
      const res = await recommendationService.getDualContextHomeFeed({
        lat,
        lng,
        intentProvinceId: primaryIntent?.provinceId,
        intentProvinceIds: intentIds.length > 0 ? intentIds.join(',') : undefined,
        intentLabel: primaryIntent?.label,
        topCategoryIds: topCats.length > 0 ? topCats.join(',') : undefined,
        topK: 8
      })

      if (res.success && res.data) {
        setFeedData(res.data)
        setHomeFeedCache(signature, res.data)
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()

    const handleStorageChange = () => {
      loadFeed()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [loadFeed])

  const intentGroups = useMemo(() => {
    if (!feedData) return []
    if (feedData.shelf2IntentGroups && feedData.shelf2IntentGroups.length > 0) {
      return feedData.shelf2IntentGroups.filter((g) => g.places && g.places.length > 0)
    }
    if (feedData.shelf2IntentPlaces && feedData.shelf2IntentPlaces.length > 0) {
      return [
        {
          provinceId: feedData.intentProvinceId || 0,
          provinceName: feedData.intentProvinceName || 'Điểm đến',
          intentLabel: feedData.intentLabel || feedData.intentProvinceName || 'sắp tới',
          places: feedData.shelf2IntentPlaces
        }
      ]
    }
    return []
  }, [feedData])

  useEffect(() => {
    if (intentGroups.length > 0) {
      const exists = intentGroups.some((g) => g.provinceId === activeIntentProvinceId)
      if (!exists) {
        setActiveIntentProvinceId(intentGroups[0].provinceId)
      }
    }
  }, [intentGroups, activeIntentProvinceId])

  const activeGroup = useMemo(() => {
    if (intentGroups.length === 0) return null
    return intentGroups.find((g) => g.provinceId === activeIntentProvinceId) || intentGroups[0]
  }, [intentGroups, activeIntentProvinceId])

  if (isLoading) {
    return (
      <section className="space-y-10 my-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="h-7 w-64 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-8 w-20 bg-slate-200 rounded-full animate-pulse" />
          </div>
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
        </div>
      </section>
    )
  }

  if (!feedData) return null

  const hasShelf1 = feedData.shelf1NearbyPlaces && feedData.shelf1NearbyPlaces.length > 0
  const hasShelf2 = activeGroup && activeGroup.places.length > 0

  if (!hasShelf1 && !hasShelf2) return null

  return (
    <div className="space-y-14">
      {hasShelf1 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Quanh bạn tại {feedData.physicalProvinceName || 'Khu vực lân cận'}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => scrollShelf(shelf1ScrollRef, -1)}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#2D6A4F] hover:text-white transition-all cursor-pointer shadow-xs active-press"
                  title="Lướt sang trái"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollShelf(shelf1ScrollRef, 1)}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#2D6A4F] hover:text-white transition-all cursor-pointer shadow-xs active-press"
                  title="Lướt sang phải"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={shelf1ScrollRef}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {feedData.shelf1NearbyPlaces.map((place) => (
              <NearbyPlaceCard key={place.placeId} place={place} />
            ))}
          </div>
        </section>
      )}

      {hasShelf2 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dành cho chuyến đi {activeGroup?.intentLabel || activeGroup?.provinceName || 'sắp tới'}
              </h3>

              {intentGroups.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Điểm đến quan tâm:</span>
                  {intentGroups.map((group) => {
                    const isActive = group.provinceId === activeGroup?.provinceId
                    return (
                      <button
                        key={group.provinceId}
                        type="button"
                        onClick={() => setActiveIntentProvinceId(group.provinceId)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer font-medium flex items-center gap-1 select-none ${isActive
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <span>{group.intentLabel || group.provinceName}</span>
                        <span
                          className={`text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-[#1b4332] text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                          {group.places.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-1.5 ml-1">
                <button
                  type="button"
                  onClick={() => scrollShelf(shelf2ScrollRef, -1)}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#2D6A4F] hover:text-white transition-all cursor-pointer shadow-xs active-press"
                  title="Lướt sang trái"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollShelf(shelf2ScrollRef, 1)}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#2D6A4F] hover:text-white transition-all cursor-pointer shadow-xs active-press"
                  title="Lướt sang phải"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={shelf2ScrollRef}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {activeGroup?.places.map((place) => (
              <IntentPlaceCard key={place.placeId} place={place} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default PersonalizedRecommendationSection
