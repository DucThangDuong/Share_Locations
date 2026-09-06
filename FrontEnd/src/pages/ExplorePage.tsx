import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Compass } from 'lucide-react'
import { placeService } from '@/services/placeService'
import type { PlaceSummaryDto, LookupItemDto, RegionLookupDto } from '@/types/models/place.model'
import { PRICE_TIERS } from '@/components/explore/explore.types'
import { ExploreSearchBar } from '@/components/explore/ExploreSearchBar'
import { ExploreFilterSidebar } from '@/components/explore/ExploreFilterSidebar'
import { ExploreActiveChips } from '@/components/explore/ExploreActiveChips'
import { ExploreToolbar } from '@/components/explore/ExploreToolbar'
import { ExplorePlaceCard } from '@/components/explore/ExplorePlaceCard'
import { ExplorePagination } from '@/components/explore/ExplorePagination'

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [regions, setRegions] = useState<RegionLookupDto[]>([])
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [totalElements, setTotalElements] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false)
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<number>>(new Set())

  const pageSize = 12

  const allProvinces = useMemo(() => regions.flatMap((r) => r.provinces || []), [regions])

  const appliedFilters = useMemo(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('cat') || ''
    const catIdStr = searchParams.get('catId')
    let catId = catIdStr ? Number(catIdStr) : undefined
    const placeTypeIdStr = searchParams.get('placeTypeId')
    const placeTypeId = placeTypeIdStr ? Number(placeTypeIdStr) : undefined
    const regionStr = searchParams.get('region') || ''
    const regionIdStr = searchParams.get('regionId') || ''
    const provinceStr = searchParams.get('province') || ''
    const provinceIdStr = searchParams.get('provinceId') || ''
    const priceStr = searchParams.get('priceTier')
    const priceTier = priceStr ? Number(priceStr) : 0
    const ratingStr = searchParams.get('minRating')
    const minRating = ratingStr ? Number(ratingStr) : 0
    const sort = searchParams.get('sort') || 'popular_desc'
    const pageStr = searchParams.get('page')
    const page = pageStr ? Number(pageStr) : 1

    const regList = regionStr ? regionStr.split(',').map((s) => s.trim()).filter(Boolean) : []
    const regIdList = regionIdStr ? regionIdStr.split(',').map(Number).filter(Boolean) : []
    const provList = provinceStr ? provinceStr.split(',').map((s) => s.trim()).filter(Boolean) : []
    const provIdList = provinceIdStr ? provinceIdStr.split(',').map(Number).filter(Boolean) : []

    if (!catId && cat && categories.length > 0) {
      const found = categories.find((c) => c.name.toLowerCase() === cat.toLowerCase())
      if (found) catId = found.id
    }

    const resolvedRegIds = [...regIdList]
    if (resolvedRegIds.length === 0 && regList.length > 0 && regions.length > 0) {
      regList.forEach((rName) => {
        const found = regions.find((r) => r.name.toLowerCase() === rName.toLowerCase())
        if (found && !resolvedRegIds.includes(found.id)) resolvedRegIds.push(found.id)
      })
    }

    const resolvedProvIds = [...provIdList]
    if (resolvedProvIds.length === 0 && provList.length > 0 && allProvinces.length > 0) {
      provList.forEach((pName) => {
        const found = allProvinces.find((p) => p.name.toLowerCase() === pName.toLowerCase())
        if (found && !resolvedProvIds.includes(found.id)) resolvedProvIds.push(found.id)
      })
    }

    return {
      search: q,
      categoryName: cat,
      categoryId: catId,
      placeTypeId,
      regions: regList,
      regionIds: resolvedRegIds,
      provinces: provList,
      provinceIds: resolvedProvIds,
      priceTier,
      minRating,
      sort,
      page
    }
  }, [searchParams, categories, regions, allProvinces])

  const [draftSearch, setDraftSearch] = useState<string>(appliedFilters.search)

  useEffect(() => {
    setDraftSearch(appliedFilters.search)
  }, [appliedFilters.search])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await placeService.getFilterOptions()
        if (res.success && res.data) {
          setCategories(res.data.categories || [])
          setRegions(res.data.regions || [])
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }

    fetchFilterOptions()
  }, [])

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true)
    try {
      const tier = PRICE_TIERS[appliedFilters.priceTier] || PRICE_TIERS[0]
      const primaryRegionId = appliedFilters.regionIds.length > 0 ? appliedFilters.regionIds[0] : undefined
      const primaryProvinceId = appliedFilters.provinceIds.length > 0 ? appliedFilters.provinceIds[0] : undefined

      const res = await placeService.searchPlaces({
        keyword: appliedFilters.search.trim() || undefined,
        regionId: primaryRegionId,
        provinceId: primaryProvinceId,
        categoryId: appliedFilters.categoryId,
        placeTypeId: appliedFilters.placeTypeId,
        minPrice: tier.min > 0 ? tier.min : undefined,
        maxPrice: tier.max > 0 ? tier.max : undefined,
        minRating: appliedFilters.minRating > 0 ? appliedFilters.minRating : undefined,
        sortBy: appliedFilters.sort,
        page: appliedFilters.page,
        pageSize
      })

      if (res.success && res.data) {
        setPlaces(res.data)
        if (res.meta) {
          setTotalElements(res.meta.totalElements)
          setTotalPages(res.meta.totalPages)
        }
      } else {
        setPlaces([])
        setTotalElements(0)
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Error searching places:', err)
      setPlaces([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  const updateFilters = (updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 0) {
        params.delete(key)
      } else {
        params.set(key, String(val))
      }
    })
    params.delete('page')
    setSearchParams(params)
    setIsMobileFilterOpen(false)
  }

  const resetFilters = () => {
    setDraftSearch('')
    setSearchParams({})
    setIsMobileFilterOpen(false)
  }

  const removeFilterItem = (type: 'search' | 'category' | 'placeType' | 'region' | 'province' | 'price' | 'rating', value?: string | number) => {
    const params = new URLSearchParams(searchParams)
    if (type === 'search') {
      params.delete('q')
      setDraftSearch('')
    } else if (type === 'category') {
      params.delete('cat')
      params.delete('catId')
    } else if (type === 'placeType') {
      params.delete('placeTypeId')
    } else if (type === 'region' && typeof value === 'string') {
      const nextRegs = appliedFilters.regions.filter((r) => r !== value)
      const rObj = regions.find((r) => r.name === value)
      const nextRegIds = rObj ? appliedFilters.regionIds.filter((id) => id !== rObj.id) : appliedFilters.regionIds
      if (nextRegs.length) {
        params.set('region', nextRegs.join(','))
        params.set('regionId', nextRegIds.join(','))
      } else {
        params.delete('region')
        params.delete('regionId')
      }
    } else if (type === 'province' && typeof value === 'string') {
      const nextProvs = appliedFilters.provinces.filter((p) => p !== value)
      const pObj = allProvinces.find((p) => p.name === value)
      const nextProvIds = pObj ? appliedFilters.provinceIds.filter((id) => id !== pObj.id) : appliedFilters.provinceIds
      if (nextProvs.length) {
        params.set('province', nextProvs.join(','))
        params.set('provinceId', nextProvIds.join(','))
      } else {
        params.delete('province')
        params.delete('provinceId')
      }
    } else if (type === 'price') {
      params.delete('priceTier')
    } else if (type === 'rating') {
      params.delete('minRating')
    }

    params.delete('page')
    setSearchParams(params)
  }

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams)
    if (newSort !== 'popular_desc') {
      params.set('sort', newSort)
    } else {
      params.delete('sort')
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    if (newPage > 1) {
      params.set('page', String(newPage))
    } else {
      params.delete('page')
    }
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSave = async (id: number) => {
    const isCurrentlySaved = savedPlaceIds.has(id)
    setSavedPlaceIds((prev) => {
      const next = new Set(prev)
      if (isCurrentlySaved) next.delete(id)
      else next.add(id)
      return next
    })
    try {
      if (isCurrentlySaved) {
        await placeService.unsavePlace(id)
      } else {
        await placeService.savePlace(id)
      }
    } catch {
    }
  }

  const handleRegionCheck = (region: RegionLookupDto) => {
    const isSelected = appliedFilters.regionIds.includes(region.id)
    let nextRegs: string[]
    let nextRegIds: number[]
    let nextProvs = [...appliedFilters.provinces]
    let nextProvIds = [...appliedFilters.provinceIds]

    if (isSelected) {
      nextRegs = appliedFilters.regions.filter((r) => r !== region.name)
      nextRegIds = appliedFilters.regionIds.filter((id) => id !== region.id)
      const regionProvinceIds = (region.provinces || []).map((p) => p.id)
      nextProvIds = nextProvIds.filter((id) => !regionProvinceIds.includes(id))
      nextProvs = nextProvs.filter((name) => !(region.provinces || []).some((p) => p.name === name))
    } else {
      nextRegs = [...appliedFilters.regions, region.name]
      nextRegIds = [...appliedFilters.regionIds, region.id]
    }

    const params = new URLSearchParams(searchParams)
    if (nextRegs.length > 0) {
      params.set('region', nextRegs.join(','))
      params.set('regionId', nextRegIds.join(','))
    } else {
      params.delete('region')
      params.delete('regionId')
    }
    if (nextProvs.length > 0) {
      params.set('province', nextProvs.join(','))
      params.set('provinceId', nextProvIds.join(','))
    } else {
      params.delete('province')
      params.delete('provinceId')
    }
    params.delete('page')
    setSearchParams(params)
    setIsMobileFilterOpen(false)
  }

  const handleProvinceCheck = (province: LookupItemDto) => {
    const isSelected = appliedFilters.provinceIds.includes(province.id)
    let nextProvs: string[]
    let nextProvIds: number[]

    if (isSelected) {
      nextProvs = appliedFilters.provinces.filter((p) => p !== province.name)
      nextProvIds = appliedFilters.provinceIds.filter((id) => id !== province.id)
    } else {
      nextProvs = [...appliedFilters.provinces, province.name]
      nextProvIds = [...appliedFilters.provinceIds, province.id]
    }

    const params = new URLSearchParams(searchParams)
    if (nextProvs.length > 0) {
      params.set('province', nextProvs.join(','))
      params.set('provinceId', nextProvIds.join(','))
    } else {
      params.delete('province')
      params.delete('provinceId')
    }
    params.delete('page')
    setSearchParams(params)
    setIsMobileFilterOpen(false)
  }

  const searchSuggestions = useMemo(() => {
    if (!draftSearch.trim()) {
      return categories.slice(0, 5).map((c) => c.name)
    }
    const term = draftSearch.toLowerCase().trim()
    const matches: string[] = []

    allProvinces.forEach((p) => {
      if (p.name.toLowerCase().includes(term)) matches.push(p.name)
    })

    categories.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) matches.push(c.name)
    })

    places.forEach((pl) => {
      if (pl.name.toLowerCase().includes(term)) matches.push(pl.name)
    })

    return Array.from(new Set(matches)).slice(0, 6)
  }, [draftSearch, categories, allProvinces, places])

  const activeChips = useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = []

    if (appliedFilters.search) {
      chips.push({
        label: `Từ khóa: "${appliedFilters.search}"`,
        onRemove: () => removeFilterItem('search')
      })
    }

    if (appliedFilters.categoryName) {
      chips.push({
        label: `Danh mục: ${appliedFilters.categoryName}`,
        onRemove: () => removeFilterItem('category')
      })
    }

    appliedFilters.regions.forEach((reg) => {
      chips.push({
        label: `Vùng: ${reg}`,
        onRemove: () => removeFilterItem('region', reg)
      })
    })

    appliedFilters.provinces.forEach((prov) => {
      chips.push({
        label: `Tỉnh: ${prov}`,
        onRemove: () => removeFilterItem('province', prov)
      })
    })

    if (appliedFilters.priceTier > 0) {
      chips.push({
        label: `Giá: ${PRICE_TIERS[appliedFilters.priceTier]?.label || ''}`,
        onRemove: () => removeFilterItem('price')
      })
    }

    if (appliedFilters.minRating > 0) {
      chips.push({
        label: `Từ ${appliedFilters.minRating}★ trở lên`,
        onRemove: () => removeFilterItem('rating')
      })
    }

    return chips
  }, [appliedFilters, regions, allProvinces])

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <ExploreSearchBar
          value={draftSearch}
          onChange={setDraftSearch}
          onSubmit={(val) => updateFilters({ q: (val || '').trim() || undefined })}
          suggestions={searchSuggestions}
        />

        <div className="flex items-center justify-between gap-4 lg:hidden">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer min-h-[44px]"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Bộ lọc ({activeChips.length})</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              <strong className="text-slate-900">{totalElements}</strong> kết quả
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ExploreFilterSidebar
            categories={categories}
            regions={regions}
            draftCategoryId={appliedFilters.categoryId}
            draftCategoryName={appliedFilters.categoryName}
            draftRegionIds={appliedFilters.regionIds}
            draftProvinceIds={appliedFilters.provinceIds}
            draftPriceTier={appliedFilters.priceTier}
            draftMinRating={appliedFilters.minRating}
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            onCategorySelect={(cat) => updateFilters({ cat: cat?.name, catId: cat?.id })}
            onRegionCheck={handleRegionCheck}
            onProvinceCheck={handleProvinceCheck}
            onPriceTierChange={(idx) => updateFilters({ priceTier: idx || undefined })}
            onMinRatingChange={(rating) => updateFilters({ minRating: rating || undefined })}
          />

          <main className="lg:col-span-3 space-y-5">
            <ExploreActiveChips
              chips={activeChips}
              onResetAll={resetFilters}
            />

            <ExploreToolbar
              sortBy={appliedFilters.sort}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-lg p-4 border border-slate-200/60 space-y-3">
                    <div className="aspect-square rounded-lg skeleton-shimmer"></div>
                    <div className="h-4 w-3/4 skeleton-shimmer rounded-md"></div>
                    <div className="h-3 w-1/2 skeleton-shimmer rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-slate-300 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-primary flex items-center justify-center mx-auto">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-800">
                    Chưa tìm thấy địa điểm nào
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Hệ thống chưa tìm thấy địa điểm nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc đặt lại bộ lọc.
                  </p>
                </div>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5' : 'space-y-4'}>
                {places.map((place) => (
                  <ExplorePlaceCard
                    key={place.id}
                    place={place}
                    viewMode={viewMode}
                    isSaved={savedPlaceIds.has(place.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )}

            <ExplorePagination
              currentPage={appliedFilters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
