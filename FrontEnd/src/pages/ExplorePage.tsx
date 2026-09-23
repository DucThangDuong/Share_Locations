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

  const pageSize = 12

  const allProvinces = useMemo(() => regions.flatMap((r) => r.provinces || []), [regions])

  const appliedFilters = useMemo(() => {
    const q = searchParams.get('q') || ''

    // Categories: multi-select support (comma-separated or single)
    const catStr = searchParams.get('cat') || searchParams.get('cats') || ''
    const catIdStr = searchParams.get('catId') || searchParams.get('catIds') || searchParams.get('categoryIds') || ''
    const catNames = catStr ? catStr.split(',').map((s) => s.trim()).filter(Boolean) : []
    const catIds = catIdStr ? catIdStr.split(',').map(Number).filter(Boolean) : []

    const placeTypeIdStr = searchParams.get('placeTypeId') || searchParams.get('placeTypeIds') || ''
    const placeTypeIds = placeTypeIdStr ? placeTypeIdStr.split(',').map(Number).filter(Boolean) : []

    const regionStr = searchParams.get('region') || ''
    const regionIdStr = searchParams.get('regionId') || searchParams.get('regionIds') || ''
    const provinceStr = searchParams.get('province') || ''
    const provinceIdStr = searchParams.get('provinceId') || searchParams.get('provinceIds') || ''
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

    const resolvedCatIds = [...catIds]
    if (resolvedCatIds.length === 0 && catNames.length > 0 && categories.length > 0) {
      catNames.forEach((cName) => {
        const found = categories.find((c) => c.name.toLowerCase() === cName.toLowerCase())
        if (found && !resolvedCatIds.includes(found.id)) resolvedCatIds.push(found.id)
      })
    }

    const resolvedCatNames = [...catNames]
    if (resolvedCatNames.length === 0 && resolvedCatIds.length > 0 && categories.length > 0) {
      resolvedCatIds.forEach((id) => {
        const found = categories.find((c) => c.id === id)
        if (found && !resolvedCatNames.includes(found.name)) resolvedCatNames.push(found.name)
      })
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

    const resolvedProvs = [...provList]
    if (resolvedProvs.length === 0 && resolvedProvIds.length > 0 && allProvinces.length > 0) {
      resolvedProvIds.forEach((id) => {
        const found = allProvinces.find((p) => p.id === id)
        if (found && !resolvedProvs.includes(found.name)) resolvedProvs.push(found.name)
      })
    }

    // Automatically synchronize region IDs based on whether ALL their provinces are in resolvedProvIds
    if (regions.length > 0) {
      regions.forEach((reg) => {
        const rProvIds = (reg.provinces || []).map((p) => p.id)
        const isAllSelected = rProvIds.length > 0 && rProvIds.every((id) => resolvedProvIds.includes(id))
        if (isAllSelected) {
          if (!resolvedRegIds.includes(reg.id)) resolvedRegIds.push(reg.id)
          if (!regList.includes(reg.name)) regList.push(reg.name)
        } else {
          const idx = resolvedRegIds.indexOf(reg.id)
          if (idx !== -1) resolvedRegIds.splice(idx, 1)
          const nameIdx = regList.indexOf(reg.name)
          if (nameIdx !== -1) regList.splice(nameIdx, 1)
        }
      })
    }

    return {
      search: q,
      categoryNames: resolvedCatNames,
      categoryIds: resolvedCatIds,
      placeTypeIds,
      regions: regList,
      regionIds: resolvedRegIds,
      provinces: resolvedProvs,
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

      const res = await placeService.searchPlaces({
        keyword: appliedFilters.search.trim() || undefined,
        regionIds: appliedFilters.regionIds.length > 0 ? appliedFilters.regionIds : undefined,
        provinceIds: appliedFilters.provinceIds.length > 0 ? appliedFilters.provinceIds : undefined,
        categoryIds: appliedFilters.categoryIds.length > 0 ? appliedFilters.categoryIds : undefined,
        placeTypeIds: appliedFilters.placeTypeIds.length > 0 ? appliedFilters.placeTypeIds : undefined,
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

  const handleCategoryToggle = (cat: LookupItemDto) => {
    const isSelected = appliedFilters.categoryIds.includes(cat.id)
    let nextCatIds: number[]
    let nextCatNames: string[]

    if (isSelected) {
      nextCatIds = appliedFilters.categoryIds.filter((id) => id !== cat.id)
      nextCatNames = appliedFilters.categoryNames.filter((name) => name !== cat.name)
    } else {
      nextCatIds = [...appliedFilters.categoryIds, cat.id]
      nextCatNames = [...appliedFilters.categoryNames, cat.name]
    }

    const params = new URLSearchParams(searchParams)
    if (nextCatIds.length > 0) {
      params.set('cat', nextCatNames.join(','))
      params.set('catId', nextCatIds.join(','))
    } else {
      params.delete('cat')
      params.delete('catId')
      params.delete('cats')
      params.delete('catIds')
      params.delete('categoryIds')
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handleClearCategories = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('cat')
    params.delete('catId')
    params.delete('cats')
    params.delete('catIds')
    params.delete('categoryIds')
    params.delete('page')
    setSearchParams(params)
  }

  const handleRegionCheck = (region: RegionLookupDto) => {
    const regionProvinces = region.provinces || []
    const regionProvinceIds = regionProvinces.map((p) => p.id)
    const regionProvinceNames = regionProvinces.map((p) => p.name)

    const isAllSelected =
      regionProvinceIds.length > 0 &&
      regionProvinceIds.every((id) => appliedFilters.provinceIds.includes(id))

    let nextProvIds = [...appliedFilters.provinceIds]
    let nextProvs = [...appliedFilters.provinces]
    let nextRegIds = [...appliedFilters.regionIds]
    let nextRegs = [...appliedFilters.regions]

    if (isAllSelected) {
      // Uncheck all provinces of this region
      nextProvIds = nextProvIds.filter((id) => !regionProvinceIds.includes(id))
      nextProvs = nextProvs.filter((name) => !regionProvinceNames.includes(name))
      nextRegIds = nextRegIds.filter((id) => id !== region.id)
      nextRegs = nextRegs.filter((name) => name !== region.name)
    } else {
      // Check all provinces of this region
      regionProvinces.forEach((p) => {
        if (!nextProvIds.includes(p.id)) nextProvIds.push(p.id)
        if (!nextProvs.includes(p.name)) nextProvs.push(p.name)
      })
      if (!nextRegIds.includes(region.id)) nextRegIds.push(region.id)
      if (!nextRegs.includes(region.name)) nextRegs.push(region.name)
    }

    const params = new URLSearchParams(searchParams)
    if (nextRegIds.length > 0) {
      params.set('region', nextRegs.join(','))
      params.set('regionId', nextRegIds.join(','))
    } else {
      params.delete('region')
      params.delete('regionId')
    }
    if (nextProvIds.length > 0) {
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
    let nextProvIds = [...appliedFilters.provinceIds]
    let nextProvs = [...appliedFilters.provinces]

    if (isSelected) {
      nextProvIds = nextProvIds.filter((id) => id !== province.id)
      nextProvs = nextProvs.filter((p) => p !== province.name)
    } else {
      nextProvIds.push(province.id)
      nextProvs.push(province.name)
    }

    // Check parent region state: if even 1 province is unselected, region check disappears; if all are selected, region check appears
    const parentRegion = regions.find((r) =>
      (r.provinces || []).some((p) => p.id === province.id)
    )

    let nextRegIds = [...appliedFilters.regionIds]
    let nextRegs = [...appliedFilters.regions]

    if (parentRegion) {
      const parentProvIds = (parentRegion.provinces || []).map((p) => p.id)
      const isAllParentProvsSelected =
        parentProvIds.length > 0 &&
        parentProvIds.every((id) => nextProvIds.includes(id))

      if (isAllParentProvsSelected) {
        if (!nextRegIds.includes(parentRegion.id)) nextRegIds.push(parentRegion.id)
        if (!nextRegs.includes(parentRegion.name)) nextRegs.push(parentRegion.name)
      } else {
        nextRegIds = nextRegIds.filter((id) => id !== parentRegion.id)
        nextRegs = nextRegs.filter((name) => name !== parentRegion.name)
      }
    }

    const params = new URLSearchParams(searchParams)
    if (nextRegIds.length > 0) {
      params.set('region', nextRegs.join(','))
      params.set('regionId', nextRegIds.join(','))
    } else {
      params.delete('region')
      params.delete('regionId')
    }
    if (nextProvIds.length > 0) {
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

  const removeFilterItem = (
    type: 'search' | 'category' | 'placeType' | 'region' | 'province' | 'price' | 'rating',
    value?: string | number
  ) => {
    const params = new URLSearchParams(searchParams)
    if (type === 'search') {
      params.delete('q')
      setDraftSearch('')
    } else if (type === 'category') {
      if (typeof value === 'string' || typeof value === 'number') {
        const targetName = typeof value === 'string' ? value : categories.find((c) => c.id === value)?.name
        const targetId = typeof value === 'number' ? value : categories.find((c) => c.name === value)?.id
        const nextCatNames = appliedFilters.categoryNames.filter((n) => n !== targetName)
        const nextCatIds = appliedFilters.categoryIds.filter((id) => id !== targetId)
        if (nextCatNames.length > 0) {
          params.set('cat', nextCatNames.join(','))
          params.set('catId', nextCatIds.join(','))
        } else {
          params.delete('cat')
          params.delete('catId')
        }
      } else {
        params.delete('cat')
        params.delete('catId')
      }
    } else if (type === 'placeType') {
      params.delete('placeTypeId')
      params.delete('placeTypeIds')
    } else if (type === 'region' && typeof value === 'string') {
      const rObj = regions.find((r) => r.name === value)
      const regionProvinceIds = rObj ? (rObj.provinces || []).map((p) => p.id) : []
      const regionProvinceNames = rObj ? (rObj.provinces || []).map((p) => p.name) : []

      const nextRegs = appliedFilters.regions.filter((r) => r !== value)
      const nextRegIds = rObj ? appliedFilters.regionIds.filter((id) => id !== rObj.id) : appliedFilters.regionIds
      const nextProvIds = appliedFilters.provinceIds.filter((id) => !regionProvinceIds.includes(id))
      const nextProvs = appliedFilters.provinces.filter((name) => !regionProvinceNames.includes(name))

      if (nextRegs.length > 0) {
        params.set('region', nextRegs.join(','))
        params.set('regionId', nextRegIds.join(','))
      } else {
        params.delete('region')
        params.delete('regionId')
      }

      if (nextProvIds.length > 0) {
        params.set('province', nextProvs.join(','))
        params.set('provinceId', nextProvIds.join(','))
      } else {
        params.delete('province')
        params.delete('provinceId')
      }
    } else if (type === 'province' && typeof value === 'string') {
      const pObj = allProvinces.find((p) => p.name === value)
      const nextProvs = appliedFilters.provinces.filter((p) => p !== value)
      const nextProvIds = pObj ? appliedFilters.provinceIds.filter((id) => id !== pObj.id) : appliedFilters.provinceIds

      let nextRegs = [...appliedFilters.regions]
      let nextRegIds = [...appliedFilters.regionIds]

      if (pObj) {
        const parentRegion = regions.find((r) => (r.provinces || []).some((p) => p.id === pObj.id))
        if (parentRegion) {
          nextRegIds = nextRegIds.filter((id) => id !== parentRegion.id)
          nextRegs = nextRegs.filter((name) => name !== parentRegion.name)
        }
      }

      if (nextProvs.length > 0) {
        params.set('province', nextProvs.join(','))
        params.set('provinceId', nextProvIds.join(','))
      } else {
        params.delete('province')
        params.delete('provinceId')
      }

      if (nextRegs.length > 0) {
        params.set('region', nextRegs.join(','))
        params.set('regionId', nextRegIds.join(','))
      } else {
        params.delete('region')
        params.delete('regionId')
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

    appliedFilters.categoryNames.forEach((catName) => {
      chips.push({
        label: `Danh mục: ${catName}`,
        onRemove: () => removeFilterItem('category', catName)
      })
    })

    // If an entire region is selected, show region chip, else show individual province chips
    const fullySelectedRegionNames = new Set(appliedFilters.regions)

    appliedFilters.regions.forEach((reg) => {
      chips.push({
        label: `Vùng: ${reg}`,
        onRemove: () => removeFilterItem('region', reg)
      })
    })

    appliedFilters.provinces.forEach((prov) => {
      const pObj = allProvinces.find((p) => p.name === prov)
      const parentRegion = pObj ? regions.find((r) => (r.provinces || []).some((p) => p.id === pObj.id)) : null

      // Only show province chip if its entire parent region is not already shown as a region chip
      if (!parentRegion || !fullySelectedRegionNames.has(parentRegion.name)) {
        chips.push({
          label: `Tỉnh: ${prov}`,
          onRemove: () => removeFilterItem('province', prov)
        })
      }
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
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pt-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <ExploreSearchBar
          value={draftSearch}
          onChange={setDraftSearch}
          onSubmit={(val) => updateFilters({ q: (val || '').trim() || undefined })}
          suggestions={searchSuggestions}
        />

        <div className="flex items-center justify-between gap-4 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer min-h-[44px]"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Bộ lọc ({activeChips.length})</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              <strong className="text-slate-900 font-bold">{totalElements}</strong> kết quả
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ExploreFilterSidebar
            categories={categories}
            regions={regions}
            draftCategoryIds={appliedFilters.categoryIds}
            draftCategoryNames={appliedFilters.categoryNames}
            draftRegionIds={appliedFilters.regionIds}
            draftProvinceIds={appliedFilters.provinceIds}
            draftPriceTier={appliedFilters.priceTier}
            draftMinRating={appliedFilters.minRating}
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            onCategoryToggle={handleCategoryToggle}
            onClearCategories={handleClearCategories}
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
                  <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200/60 space-y-3">
                    <div className="aspect-square rounded-xl bg-slate-200"></div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
                    <div className="h-3 w-1/2 bg-slate-200 rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4 shadow-2xs">
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
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5' : 'space-y-4'}>
                {places.map((place) => (
                  <ExplorePlaceCard
                    key={place.id}
                    place={place}
                    viewMode={viewMode}
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

export default ExplorePage
