import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { geographyService } from '@/services/geographyService'
import type { RegionLandingData } from '@/types/models/region.model'
import { RegionHeroBento } from '@/components/region/RegionHeroBento'
import { RegionSearchBar } from '@/components/region/RegionSearchBar'
import { RegionCollections } from '@/components/region/RegionCollections'
import { RegionLandmarks } from '@/components/region/RegionLandmarks'
import { RegionFoodSpecialties } from '@/components/region/RegionFoodSpecialties'
import { RegionBlogSection } from '@/components/region/RegionBlogSection'
import { RegionSpotlightReviews } from '@/components/region/RegionSpotlightReviews'
import { AlertCircle, RefreshCw } from 'lucide-react'

export const RegionPage: React.FC = () => {
  const { regionSlug } = useParams<{ regionSlug?: string }>()
  const [regionData, setRegionData] = useState<RegionLandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeSlug = regionSlug || 'mien-bac'

  const fetchRegionData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await geographyService.getRegionLanding(activeSlug)
      if (res.success && res.data) {
        setRegionData(res.data)
      } else {
        setError(res.message || 'Không thể tải thông tin vùng miền.')
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(errorMsg || 'Đã có lỗi xảy ra khi tải dữ liệu vùng miền.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchRegionData()
  }, [activeSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-stone-200 rounded-full" />
            <div className="h-10 w-72 bg-stone-300 rounded-xl" />
            <div className="h-5 w-full max-w-xl bg-stone-200 rounded-lg" />
          </div>

          <div className="w-full aspect-16/9 sm:aspect-21/9 rounded-3xl bg-stone-200 min-h-[320px]" />

          <div className="h-20 bg-white rounded-2xl border border-stone-200 p-4" />

          <div className="space-y-4">
            <div className="h-8 w-60 bg-stone-200 rounded-lg" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[260px] h-[300px] bg-stone-200 rounded-2xl shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !regionData) {
    return (
      <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#C0392B] flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-stone-900">
            Không thể tải dữ liệu
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {error || 'Không tìm thấy dữ liệu cho vùng miền này.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={fetchRegionData}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#004f32] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#003d27] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>

            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all text-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RegionHeroBento data={regionData} />

        <RegionSearchBar data={regionData} />

        {regionData.collections && regionData.collections.length > 0 && (
          <RegionCollections
            collections={regionData.collections}
            regionName={regionData.name}
          />
        )}

        {regionData.landmarks && regionData.landmarks.length > 0 && (
          <RegionLandmarks
            landmarks={regionData.landmarks}
            regionName={regionData.name}
          />
        )}

        {regionData.foods && regionData.foods.length > 0 && (
          <RegionFoodSpecialties
            foods={regionData.foods}
            regionName={regionData.name}
          />
        )}

        {regionData.blogPosts && regionData.blogPosts.length > 0 && (
          <RegionBlogSection
            posts={regionData.blogPosts}
            regionName={regionData.name}
          />
        )}

        {(regionData.spotlight || (regionData.reviews && regionData.reviews.length > 0)) && (
          <RegionSpotlightReviews
            spotlight={regionData.spotlight}
            reviews={regionData.reviews}
          />
        )}
      </div>
    </div>
  )
}

export default RegionPage
