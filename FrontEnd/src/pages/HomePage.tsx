import React from 'react'
import { HeroBanner } from '@/components/home/HeroBanner'
import { PlaceTypeQuickNav } from '@/components/home/PlaceTypeQuickNav'
import { HomeFeaturedInterleaved } from '@/components/home/HomeFeaturedInterleaved'
import { TopRatedPlacesSection } from '@/components/home/TopRatedPlacesSection'

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-4 pb-20">
      <HeroBanner />
      <PlaceTypeQuickNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-20">
        <HomeFeaturedInterleaved />
        <TopRatedPlacesSection />
      </main>
    </div>
  )
}
