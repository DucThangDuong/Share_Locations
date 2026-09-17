import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { geographyService } from '@/services/geographyService'
import { placeService } from '@/services/placeService'
import type { ProvinceLandingData } from '@/types/models/province.model'
import type { PlaceSummaryDto, LookupItemDto } from '@/types/models/place.model'
import { ProvinceHeroBento } from '@/components/province/ProvinceHeroBento'
import { ProvinceSearchBar } from '@/components/province/ProvinceSearchBar'
import { RegionCollections } from '@/components/region/RegionCollections'
import { RegionLandmarks } from '@/components/region/RegionLandmarks'
import { RegionFoodSpecialties } from '@/components/region/RegionFoodSpecialties'
import { ProvinceItinerarySection } from '@/components/province/ProvinceItinerarySection'
import { RegionBlogSection } from '@/components/region/RegionBlogSection'
import { RegionSpotlightReviews } from '@/components/region/RegionSpotlightReviews'
import { ProvincePlaceSection } from '@/components/province/ProvincePlaceSection'

export const ProvincePage: React.FC = () => {
  const { provinceId } = useParams<{ provinceId?: string }>()
  const [searchParams] = useSearchParams()

  const queryProvince = searchParams.get('province') || searchParams.get('id') || provinceId || '26'

  const [landingData, setLandingData] = useState<ProvinceLandingData | null>(null)
  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('rating')

  const [initialLoading, setInitialLoading] = useState(true)
  const [placesLoading, setPlacesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProvinceLanding = async (targetIdOrSlug: string | number) => {
    setInitialLoading(true)
    setError(null)
    try {
      const [landingRes, filterRes] = await Promise.all([
        geographyService.getProvinceLanding(targetIdOrSlug),
        placeService.getFilterOptions()
      ])

      if (landingRes.success && landingRes.data) {
        setLandingData(landingRes.data)
      } else {
        setError(landingRes.message || 'Không thể tải thông tin tỉnh thành.')
      }

      if (filterRes.success && filterRes.data) {
        setCategories(filterRes.data.categories || [])
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(errorMsg || 'Đã có lỗi xảy ra khi tải dữ liệu tỉnh thành.')
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchProvinceLanding(queryProvince)
  }, [queryProvince])

  useEffect(() => {
    if (!landingData?.province) return

    let isMounted = true

    const loadPlaces = async () => {
      setPlacesLoading(true)
      try {
        const res = await placeService.searchPlaces({
          provinceId: landingData.province.id,
          categoryId: selectedCategoryId || undefined,
          sortBy: sortBy === 'rating' ? 'avgRating_desc' : sortBy === 'newest' ? 'newest' : sortBy === 'price_asc' ? 'price_asc' : 'price_desc',
          pageSize: 24
        })

        if (isMounted && res.success && res.data) {
          setPlaces(res.data)
        } else if (isMounted) {
          setPlaces([])
        }
      } catch {
        if (isMounted) setPlaces([])
      } finally {
        if (isMounted) setPlacesLoading(false)
      }
    }

    loadPlaces()

    return () => {
      isMounted = false
    }
  }, [landingData?.province?.id, selectedCategoryId, sortBy])

  if (initialLoading) {
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

  if (error || !landingData) {
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
            {error || 'Không tìm thấy dữ liệu cho tỉnh thành này.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fetchProvinceLanding(queryProvince)}
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
        <ProvinceHeroBento data={landingData} />

        <ProvinceSearchBar
          currentProvince={landingData.province}
        />

        {landingData.collections && landingData.collections.length > 0 && (
          <RegionCollections
            collections={landingData.collections}
            regionName={landingData.province.name}
          />
        )}

        {landingData.landmarks && landingData.landmarks.length > 0 && (
          <RegionLandmarks
            landmarks={landingData.landmarks}
            regionName={landingData.province.name}
          />
        )}

        {landingData.foods && landingData.foods.length > 0 && (
          <RegionFoodSpecialties
            foods={landingData.foods}
            regionName={landingData.province.name}
          />
        )}

        <ProvinceItinerarySection
          provinceName={landingData.province.name}
          initialItineraries={landingData.itineraries}
        />

        {landingData.blogPosts && landingData.blogPosts.length > 0 && (
          <RegionBlogSection
            posts={landingData.blogPosts}
            regionName={landingData.province.name}
          />
        )}

        <ProvincePlaceSection
          places={places}
          provinceName={landingData.province.name}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          sortBy={sortBy}
          onSortChange={setSortBy}
          loading={placesLoading}
        />

        {(landingData.spotlight || (landingData.reviews && landingData.reviews.length > 0)) && (
          <RegionSpotlightReviews
            spotlight={landingData.spotlight}
            reviews={landingData.reviews}
          />
        )}
      </div>
    </div>
  )
}

export default ProvincePage
