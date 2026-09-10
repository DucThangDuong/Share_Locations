import React, { useRef } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { RegionCollection } from '@/types/models/region.model'
import { PlaceCardInCollection } from '@/components/home/PlaceCardInCollection'

interface RegionCollectionsProps {
  collections: RegionCollection[]
  regionName?: string
}

const RegionCollectionTrack: React.FC<{ collection: RegionCollection }> = ({ collection }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  const places = collection.places || []
  if (places.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {collection.title}
          </h3>
          {collection.subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {collection.subtitle}
            </p>
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
        className="flex overflow-x-auto gap-4 sm:gap-5 pb-4 hide-scrollbar snap-x scroll-smooth"
      >
        {places.map((place) => (
          <PlaceCardInCollection key={place.id} place={place} />
        ))}
      </div>
    </section>
  )
}

export const RegionCollections: React.FC<RegionCollectionsProps> = ({ collections }) => {
  if (!collections || collections.length === 0) return null

  const validCollections = collections.filter((col) => col.places && col.places.length > 0)
  if (validCollections.length === 0) return null

  return (
    <div className="space-y-12 my-10">
      {validCollections.map((col) => (
        <RegionCollectionTrack key={col.id} collection={col} />
      ))}
    </div>
  )
}
