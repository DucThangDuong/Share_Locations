import React from 'react'
import { HeroBanner } from '@/components/home/HeroBanner'
import { CategoryQuickNav } from '@/components/home/CategoryQuickNav'
import { FeaturedCollectionsSection } from '@/components/home/FeaturedCollectionsSection'
import { RegionsSection } from '@/components/home/RegionsSection'
import { CuisineSection } from '@/components/home/CuisineSection'
import { ItinerarySection } from '@/components/home/ItinerarySection'
import { BlogSection } from '@/components/home/BlogSection'

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-4 pb-20">
      <HeroBanner />
      <CategoryQuickNav />
      <FeaturedCollectionsSection />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
        <RegionsSection />
        <CuisineSection />
        <ItinerarySection />
        <BlogSection />
      </main>
    </div>
  )
}
