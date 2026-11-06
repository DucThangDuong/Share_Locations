import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { catalogService } from '@/services/catalogService'
import { geographyService } from '@/services/geographyService'
import type { CollectionDto } from '@/types/models/place.model'
import type { RegionDto } from '@/types/models/geography.model'
import {
  getRecentIntentProvinces,
  getTopCategoryIds,
  snapGpsToGrid
} from '@/utils/deviceContext'
import { PlaceCardInCollection } from './PlaceCardInCollection'
import { RegionShowcaseCard } from './RegionShowcaseCard'

const CollectionTrack: React.FC<{ collection: CollectionDto }> = ({ collection }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: 'smooth' })
  }

  const places = collection.places || []
  if (places.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="space-y-1.5">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-xs text-slate-500 line-clamp-1">{collection.description}</p>
          )}
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
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {places.map((place) => (
          <PlaceCardInCollection key={place.id} place={place} />
        ))}
      </div>
    </section>
  )
}

export const HomeFeaturedInterleaved: React.FC = () => {
  const [collections, setCollections] = useState<CollectionDto[]>([])
  const [regions, setRegions] = useState<RegionDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const intentProvinces = getRecentIntentProvinces()
      const topCategoryIds = getTopCategoryIds()

      let lat: number | undefined
      let lng: number | undefined

      const getGpsCoords = (): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null)
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 2500, maximumAge: 300000 }
          )
        })
      }

      const coords = await getGpsCoords()
      if (coords) {
        const grid = snapGpsToGrid(coords.lat, coords.lng)
        lat = grid.roundedLat
        lng = grid.roundedLng
      }

      const [colRes, regRes] = await Promise.all([
        catalogService.getFeaturedCollections({
          count: 6,
          lat,
          lng,
          intentProvinceIds: intentProvinces.map((p) => p.provinceId),
          topCategoryIds
        }),
        geographyService.getRegions()
      ])

      if (colRes.success && colRes.data) {
        setCollections(colRes.data.filter((c) => c.isFeatured))
      }

      if (regRes.success && regRes.data) {
        setRegions(regRes.data)
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handleIntentChanged = () => {
      loadData()
    }
    window.addEventListener('langthang:intent_changed', handleIntentChanged)
    return () => window.removeEventListener('langthang:intent_changed', handleIntentChanged)
  }, [loadData])

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="w-[290px] h-[320px] rounded-lg skeleton-shimmer shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const maxGroups = Math.max(Math.ceil(collections.length / 2), regions.length)
  const items: React.ReactNode[] = []

  for (let g = 0; g < maxGroups; g++) {
    collections.slice(g * 2, g * 2 + 2).forEach((col) => {
      items.push(<CollectionTrack key={`col-${col.id}`} collection={col} />)
    })
    if (regions[g]) {
      items.push(<RegionShowcaseCard key={`reg-${regions[g].id}`} region={regions[g]} />)
    }
  }

  return <div className="space-y-14">{items}</div>
}
