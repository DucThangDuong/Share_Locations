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

  const [draftSearch, setDraftSearch] = useState<string>(searchParams.get('q') || '')
  const [draftCategoryName, setDraftCategoryName] = useState<string>(searchParams.get('cat') || '')
  const [draftCategoryId, setDraftCategoryId] = useState<number | undefined>(
    searchParams.get('catId') ? Number(searchParams.get('catId')) : undefined
  )
  const [draftRegions, setDraftRegions] = useState<string[]>(
    searchParams.get('region') ? searchParams.get('region')!.split(',').map((s) => s.trim()).filter(Boolean) : []
  )
  const [draftRegionIds, setDraftRegionIds] = useState<number[]>(
    searchParams.get('regionId') ? searchParams.get('regionId')!.split(',').map(Number).filter(Boolean) : []
  )
  const [draftProvinces, setDraftProvinces] = useState<string[]>(
    searchParams.get('province') ? searchParams.get('province')!.split(',').map((s) => s.trim()).filter(Boolean) : []
  )
  const [draftProvinceIds, setDraftProvinceIds] = useState<number[]>(
    searchParams.get('provinceId') ? searchParams.get('provinceId')!.split(',').map(Number).filter(Boolean) : []
  )
  const [draftPriceTier, setDraftPriceTier] = useState<number>(
    searchParams.get('priceTier') ? Number(searchParams.get('priceTier')) : 0
  )
  const [draftMinRating, setDraftMinRating] = useState<number>(
    searchParams.get('minRating') ? Number(searchParams.get('minRating')) : 0
  )

  const [appliedSearch, setAppliedSearch] = useState<string>(searchParams.get('q') || '')
  const [appliedCategoryName, setAppliedCategoryName] = useState<string>(searchParams.get('cat') || '')
  const [appliedCategoryId, setAppliedCategoryId] = useState<number | undefined>(
    searchParams.get('catId') ? Number(searchParams.get('catId')) : undefined
  )
  const [appliedRegions, setAppliedRegions] = useState<string[]>(
    searchParams.get('region') ? searchParams.get('region')!.split(',').map((s) => s.trim()).filter(Boolean) : []
  )
  const [appliedRegionIds, setAppliedRegionIds] = useState<number[]>(
    searchParams.get('regionId') ? searchParams.get('regionId')!.split(',').map(Number).filter(Boolean) : []
  )
  const [appliedProvinces, setAppliedProvinces] = useState<string[]>(
    searchParams.get('province') ? searchParams.get('province')!.split(',').map((s) => s.trim()).filter(Boolean) : []
  )
  const [appliedProvinceIds, setAppliedProvinceIds] = useState<number[]>(
    searchParams.get('provinceId') ? searchParams.get('provinceId')!.split(',').map(Number).filter(Boolean) : []
  )
  const [appliedPriceTier, setAppliedPriceTier] = useState<number>(
    searchParams.get('priceTier') ? Number(searchParams.get('priceTier')) : 0
  )
  const [appliedMinRating, setAppliedMinRating] = useState<number>(
    searchParams.get('minRating') ? Number(searchParams.get('minRating')) : 0
  )
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'popular_desc')
  const [currentPage, setCurrentPage] = useState<number>(
    searchParams.get('page') ? Number(searchParams.get('page')) : 1
  )

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false)
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<number>>(new Set())

  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [regions, setRegions] = useState<RegionLookupDto[]>([])
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [totalElements, setTotalElements] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const pageSize = 12

  const allProvinces = useMemo(() => {
    return regions.flatMap((r) => r.provinces || [])
  }, [regions])

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

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('cat') || ''
    const catIdStr = searchParams.get('catId')
    const catId = catIdStr ? Number(catIdStr) : undefined
    const regionStr = searchParams.get('region') || ''
    const regionIdStr = searchParams.get('regionId') || ''
    const provinceStr = searchParams.get('province') || ''
    const provinceIdStr = searchParams.get('provinceId') || ''
    const priceStr = searchParams.get('priceTier')
    const priceTier = priceStr ? Number(priceStr) : 0
    const ratingStr = searchParams.get('minRating')
    const rating = ratingStr ? Number(ratingStr) : 0
    const sort = searchParams.get('sort') || 'popular_desc'
    const pageStr = searchParams.get('page')
    const page = pageStr ? Number(pageStr) : 1

    const regList = regionStr ? regionStr.split(',').map((s) => s.trim()).filter(Boolean) : []
    const regIdList = regionIdStr ? regionIdStr.split(',').map(Number).filter(Boolean) : []
    const provList = provinceStr ? provinceStr.split(',').map((s) => s.trim()).filter(Boolean) : []
    const provIdList = provinceIdStr ? provinceIdStr.split(',').map(Number).filter(Boolean) : []

    let resolvedCatId = catId
    if (!resolvedCatId && cat && categories.length > 0) {
      const found = categories.find((c) => c.name.toLowerCase() === cat.toLowerCase())
      if (found) resolvedCatId = found.id
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

    setAppliedSearch(q)
    setAppliedCategoryName(cat)
    setAppliedCategoryId(resolvedCatId)
    setAppliedRegions(regList)
    setAppliedRegionIds(resolvedRegIds)
    setAppliedProvinces(provList)
    setAppliedProvinceIds(resolvedProvIds)
    setAppliedPriceTier(priceTier)
    setAppliedMinRating(rating)
    setSortBy(sort)
    setCurrentPage(page)

    setDraftSearch(q)
    setDraftCategoryName(cat)
    setDraftCategoryId(resolvedCatId)
    setDraftRegions(regList)
    setDraftRegionIds(resolvedRegIds)
    setDraftProvinces(provList)
    setDraftProvinceIds(resolvedProvIds)
    setDraftPriceTier(priceTier)
    setDraftMinRating(rating)
  }, [searchParams, categories, regions, allProvinces])

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true)
    try {
      const tier = PRICE_TIERS[appliedPriceTier] || PRICE_TIERS[0]
      const primaryRegionId = appliedRegionIds.length > 0 ? appliedRegionIds[0] : undefined
      const primaryProvinceId = appliedProvinceIds.length > 0 ? appliedProvinceIds[0] : undefined

      const res = await placeService.searchPlaces({
        keyword: appliedSearch.trim() || undefined,
        regionId: primaryRegionId,
        provinceId: primaryProvinceId,
        categoryId: appliedCategoryId,
        minPrice: tier.min > 0 ? tier.min : undefined,
        maxPrice: tier.max > 0 ? tier.max : undefined,
        minRating: appliedMinRating > 0 ? appliedMinRating : undefined,
        sortBy: sortBy,
        page: currentPage,
        pageSize: pageSize
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
  }, [
    appliedSearch,
    appliedRegionIds,
    appliedProvinceIds,
    appliedCategoryId,
    appliedPriceTier,
    appliedMinRating,
    sortBy,
    currentPage
  ])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  const applyFilters = (overrides?: { search?: string; category?: { id?: number; name: string }; regionIds?: number[]; provinceIds?: number[]; regions?: string[]; provinces?: string[]; priceTier?: number; minRating?: number }) => {
    const finalSearch = overrides?.search !== undefined ? overrides.search : draftSearch
    const finalCatName = overrides?.category !== undefined ? overrides.category.name : draftCategoryName
    const finalCatId = overrides?.category !== undefined ? overrides.category.id : draftCategoryId
    const finalRegs = overrides?.regions !== undefined ? overrides.regions : draftRegions
    const finalRegIds = overrides?.regionIds !== undefined ? overrides.regionIds : draftRegionIds
    const finalProvs = overrides?.provinces !== undefined ? overrides.provinces : draftProvinces
    const finalProvIds = overrides?.provinceIds !== undefined ? overrides.provinceIds : draftProvinceIds
    const finalPriceTier = overrides?.priceTier !== undefined ? overrides.priceTier : draftPriceTier
    const finalMinRating = overrides?.minRating !== undefined ? overrides.minRating : draftMinRating

    const params = new URLSearchParams()

    if (finalSearch.trim()) params.set('q', finalSearch.trim())
    if (finalCatName) params.set('cat', finalCatName)
    if (finalCatId) params.set('catId', String(finalCatId))
    if (finalRegs.length > 0) params.set('region', finalRegs.join(','))
    if (finalRegIds.length > 0) params.set('regionId', finalRegIds.join(','))
    if (finalProvs.length > 0) params.set('province', finalProvs.join(','))
    if (finalProvIds.length > 0) params.set('provinceId', finalProvIds.join(','))
    if (finalPriceTier > 0) params.set('priceTier', String(finalPriceTier))
    if (finalMinRating > 0) params.set('minRating', String(finalMinRating))
    if (sortBy !== 'popular_desc') params.set('sort', sortBy)

    params.delete('page')

    setSearchParams(params)
    setIsMobileFilterOpen(false)
  }

  const resetFilters = () => {
    setDraftSearch('')
    setDraftCategoryName('')
    setDraftCategoryId(undefined)
    setDraftRegions([])
    setDraftRegionIds([])
    setDraftProvinces([])
    setDraftProvinceIds([])
    setDraftPriceTier(0)
    setDraftMinRating(0)

    setAppliedSearch('')
    setAppliedCategoryName('')
    setAppliedCategoryId(undefined)
    setAppliedRegions([])
    setAppliedRegionIds([])
    setAppliedProvinces([])
    setAppliedProvinceIds([])
    setAppliedPriceTier(0)
    setAppliedMinRating(0)

    setSearchParams({})
    setIsMobileFilterOpen(false)
  }

  const removeFilterItem = (type: 'search' | 'category' | 'region' | 'province' | 'price' | 'rating', value?: string | number) => {
    const params = new URLSearchParams(searchParams)

    if (type === 'search') {
      params.delete('q')
      setDraftSearch('')
      setAppliedSearch('')
    } else if (type === 'category') {
      params.delete('cat')
      params.delete('catId')
      setDraftCategoryName('')
      setDraftCategoryId(undefined)
      setAppliedCategoryName('')
      setAppliedCategoryId(undefined)
    } else if (type === 'region' && typeof value === 'string') {
      const nextRegs = appliedRegions.filter((r) => r !== value)
      const rObj = regions.find((r) => r.name === value)
      const nextRegIds = rObj ? appliedRegionIds.filter((id) => id !== rObj.id) : appliedRegionIds
      if (nextRegs.length) {
        params.set('region', nextRegs.join(','))
        params.set('regionId', nextRegIds.join(','))
      } else {
        params.delete('region')
        params.delete('regionId')
      }
      setDraftRegions(nextRegs)
      setDraftRegionIds(nextRegIds)
      setAppliedRegions(nextRegs)
      setAppliedRegionIds(nextRegIds)
    } else if (type === 'province' && typeof value === 'string') {
      const nextProvs = appliedProvinces.filter((p) => p !== value)
      const pObj = allProvinces.find((p) => p.name === value)
      const nextProvIds = pObj ? appliedProvinceIds.filter((id) => id !== pObj.id) : appliedProvinceIds
      if (nextProvs.length) {
        params.set('province', nextProvs.join(','))
        params.set('provinceId', nextProvIds.join(','))
      } else {
        params.delete('province')
        params.delete('provinceId')
      }
      setDraftProvinces(nextProvs)
      setDraftProvinceIds(nextProvIds)
      setAppliedProvinces(nextProvs)
      setAppliedProvinceIds(nextProvIds)
    } else if (type === 'price') {
      params.delete('priceTier')
      setDraftPriceTier(0)
      setAppliedPriceTier(0)
    } else if (type === 'rating') {
      params.delete('minRating')
      setDraftMinRating(0)
      setAppliedMinRating(0)
    }

    params.delete('page')
    setSearchParams(params)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    const params = new URLSearchParams(searchParams)
    if (newSort !== 'popular_desc') {
      params.set('sort', newSort)
    } else {
      params.delete('sort')
    }
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    const params = new URLSearchParams(searchParams)
    if (newPage > 1) {
      params.set('page', String(newPage))
    } else {
      params.delete('page')
    }
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSave = (id: number) => {
    setSavedPlaceIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRegionCheck = (region: RegionLookupDto) => {
    const isSelected = draftRegionIds.includes(region.id)
    let nextRegs: string[]
    let nextRegIds: number[]
    let nextProvs = [...draftProvinces]
    let nextProvIds = [...draftProvinceIds]

    if (isSelected) {
      nextRegs = draftRegions.filter((r) => r !== region.name)
      nextRegIds = draftRegionIds.filter((id) => id !== region.id)
      const regionProvinceIds = (region.provinces || []).map((p) => p.id)
      nextProvIds = nextProvIds.filter((id) => !regionProvinceIds.includes(id))
      nextProvs = nextProvs.filter((name) => {
        const provObj = (region.provinces || []).find((p) => p.name === name)
        return !provObj
      })
    } else {
      nextRegs = [...draftRegions, region.name]
      nextRegIds = [...draftRegionIds, region.id]
    }

    setDraftRegions(nextRegs)
    setDraftRegionIds(nextRegIds)
    setDraftProvinces(nextProvs)
    setDraftProvinceIds(nextProvIds)
    applyFilters({ regions: nextRegs, regionIds: nextRegIds, provinces: nextProvs, provinceIds: nextProvIds })
  }

  const handleProvinceCheck = (province: LookupItemDto) => {
    const isSelected = draftProvinceIds.includes(province.id)
    let nextProvs: string[]
    let nextProvIds: number[]

    if (isSelected) {
      nextProvs = draftProvinces.filter((p) => p !== province.name)
      nextProvIds = draftProvinceIds.filter((id) => id !== province.id)
    } else {
      nextProvs = [...draftProvinces, province.name]
      nextProvIds = [...draftProvinceIds, province.id]
    }

    setDraftProvinces(nextProvs)
    setDraftProvinceIds(nextProvIds)
    applyFilters({ provinces: nextProvs, provinceIds: nextProvIds })
  }

  const handleCategorySelect = (cat?: LookupItemDto) => {
    const catName = cat ? cat.name : ''
    const catId = cat ? cat.id : undefined
    setDraftCategoryName(catName)
    setDraftCategoryId(catId)
    applyFilters({ category: { id: catId, name: catName } })
  }

  const handlePriceTierChange = (idx: number) => {
    setDraftPriceTier(idx)
    applyFilters({ priceTier: idx })
  }

  const handleMinRatingChange = (rating: number) => {
    setDraftMinRating(rating)
    applyFilters({ minRating: rating })
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

    if (appliedSearch) {
      chips.push({
        label: `Từ khóa: "${appliedSearch}"`,
        onRemove: () => removeFilterItem('search')
      })
    }

    if (appliedCategoryName) {
      chips.push({
        label: `Danh mục: ${appliedCategoryName}`,
        onRemove: () => removeFilterItem('category')
      })
    }

    appliedRegions.forEach((reg) => {
      chips.push({
        label: `Vùng: ${reg}`,
        onRemove: () => removeFilterItem('region', reg)
      })
    })

    appliedProvinces.forEach((prov) => {
      chips.push({
        label: `Tỉnh: ${prov}`,
        onRemove: () => removeFilterItem('province', prov)
      })
    })

    if (appliedPriceTier > 0) {
      chips.push({
        label: `Giá: ${PRICE_TIERS[appliedPriceTier]?.label || ''}`,
        onRemove: () => removeFilterItem('price')
      })
    }

    if (appliedMinRating > 0) {
      chips.push({
        label: `Từ ${appliedMinRating}★ trở lên`,
        onRemove: () => removeFilterItem('rating')
      })
    }

    return chips
  }, [
    appliedSearch,
    appliedCategoryName,
    appliedRegions,
    appliedProvinces,
    appliedPriceTier,
    appliedMinRating
  ])

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <ExploreSearchBar
          value={draftSearch}
          onChange={setDraftSearch}
          onSubmit={(val) => applyFilters({ search: val })}
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
            draftCategoryId={draftCategoryId}
            draftCategoryName={draftCategoryName}
            draftRegionIds={draftRegionIds}
            draftProvinceIds={draftProvinceIds}
            draftPriceTier={draftPriceTier}
            draftMinRating={draftMinRating}
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            onCategorySelect={handleCategorySelect}
            onRegionCheck={handleRegionCheck}
            onProvinceCheck={handleProvinceCheck}
            onPriceTierChange={handlePriceTierChange}
            onMinRatingChange={handleMinRatingChange}
          />

          <main className="lg:col-span-3 space-y-5">
            <ExploreActiveChips
              chips={activeChips}
              onResetAll={resetFilters}
            />

            <ExploreToolbar
              totalElements={totalElements}
              sortBy={sortBy}
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
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
