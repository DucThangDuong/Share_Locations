import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Star,
  MapPin,
  Clock,
  LayoutGrid,
  List,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Compass
} from 'lucide-react'
import { placeService } from '@/services/placeService'
import type {
  PlaceSummaryDto,
  LookupItemDto,
  RegionLookupDto
} from '@/types/models/place.model'
import { PRICE_TIERS, SORT_OPTIONS } from '@/components/explore/explore.types'

export interface PlaceItem {
  id: number
  name: string
  location: string
  category: string
  rating?: number
  price?: string
  priceMax?: number
  image?: string
  desc?: string
}

interface ItineraryPlacePickerDrawerProps {
  targetDayIndex?: number
  days?: { dayNumber: number; title: string }[]
  onSelectTargetDay?: (dayIndex: number) => void
  onAddPlace: (place: PlaceItem, targetDayIndex: number) => void
}

export const ItineraryPlacePickerDrawer: React.FC<ItineraryPlacePickerDrawerProps> = ({
  targetDayIndex = -1,
  days = [],
  onSelectTargetDay,
  onAddPlace
}) => {
  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [regions, setRegions] = useState<RegionLookupDto[]>([])

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | 'all'>('all')
  const [selectedRegionId, setSelectedRegionId] = useState<number | 'all'>('all')
  const [selectedPriceTier, setSelectedPriceTier] = useState<number>(0)
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0)
  const [selectedSort, setSelectedSort] = useState<string>('popular_desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [openRegionAccordion, setOpenRegionAccordion] = useState<Record<string, boolean>>({})

  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [totalElements, setTotalElements] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [addedPlaceIds, setAddedPlaceIds] = useState<Set<number>>(new Set())

  const pageSize = 9

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await placeService.getFilterOptions()
        if (res.success && res.data) {
          setCategories(res.data.categories || [])
          setRegions(res.data.regions || [])
        }
      } catch {
      }
    }
    fetchOptions()
  }, [])

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true)
    try {
      const tier = PRICE_TIERS[selectedPriceTier] || PRICE_TIERS[0]
      const res = await placeService.searchPlaces({
        keyword: searchQuery.trim() || undefined,
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        regionId: selectedRegionId !== 'all' ? selectedRegionId : undefined,
        provinceId: selectedProvinceId !== 'all' ? selectedProvinceId : undefined,
        minPrice: tier.min > 0 ? tier.min : undefined,
        maxPrice: tier.max > 0 ? tier.max : undefined,
        minRating: selectedMinRating > 0 ? selectedMinRating : undefined,
        sortBy: selectedSort,
        page: currentPage,
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
    } catch {
      setPlaces([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [
    searchQuery,
    selectedCategoryId,
    selectedRegionId,
    selectedProvinceId,
    selectedPriceTier,
    selectedMinRating,
    selectedSort,
    currentPage
  ])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedCategoryId('all')
    setSelectedRegionId('all')
    setSelectedProvinceId('all')
    setSelectedPriceTier(0)
    setSelectedMinRating(0)
    setSelectedSort('popular_desc')
    setCurrentPage(1)
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategoryId !== 'all') count++
    if (selectedRegionId !== 'all') count++
    if (selectedProvinceId !== 'all') count++
    if (selectedPriceTier > 0) count++
    if (selectedMinRating > 0) count++
    if (searchQuery.trim()) count++
    return count
  }, [
    selectedCategoryId,
    selectedRegionId,
    selectedProvinceId,
    selectedPriceTier,
    selectedMinRating,
    searchQuery
  ])

  const formatPrice = (min?: number | null, max?: number | null) => {
    const hasMin = min !== undefined && min !== null
    const hasMax = max !== undefined && max !== null

    if (!hasMin && !hasMax) return 'Miễn phí'

    if (hasMin && hasMax) {
      if (min === 0 && max === 0) return 'Miễn phí'
      if (min === max) return `${min.toLocaleString('vi-VN')}đ`
      return `${min.toLocaleString('vi-VN')}đ – ${max.toLocaleString('vi-VN')}đ`
    }

    if (hasMin) {
      if (min === 0) return 'Miễn phí'
      return `Từ ${min.toLocaleString('vi-VN')}đ`
    }

    if (hasMax) {
      if (max === 0) return 'Miễn phí'
      return `Đến ${max.toLocaleString('vi-VN')}đ`
    }

    return 'Miễn phí'
  }

  const handleAdd = (place: PlaceSummaryDto) => {
    const priceText = formatPrice(place.minPrice, place.maxPrice)
    const mappedPlace: PlaceItem = {
      id: place.id,
      name: place.name,
      location: place.address || place.provinceName || 'Việt Nam',
      category: place.categoryName || 'Tham quan',
      rating: place.avgRating,
      price: priceText,
      priceMax: place.maxPrice || place.minPrice || 50000,
      image: place.thumbnailUrl || '',
      desc: place.description || ''
    }

    onAddPlace(mappedPlace, targetDayIndex)

    setAddedPlaceIds((prev) => new Set(prev).add(place.id))
    setTimeout(() => {
      setAddedPlaceIds((prev) => {
        const next = new Set(prev)
        next.delete(place.id)
        return next
      })
    }, 2000)
  }

  const targetDayLabel = useMemo(() => {
    if (targetDayIndex === -1) return 'Kho lưu trữ'
    const found = days[targetDayIndex]
    return found ? `Ngày ${found.dayNumber}` : `Ngày ${targetDayIndex + 1}`
  }, [targetDayIndex, days])

  return (
    <section
      id="itinerary-place-explorer"
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0 scroll-mt-24"
    >
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
            <Compass size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>Kho địa điểm toàn quốc</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                {totalElements} địa điểm
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tìm kiếm và thêm địa điểm trực tiếp vào lịch trình hoặc kho lưu trữ
            </p>
          </div>
        </div>

        {days && days.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Thêm vào:
            </span>
            <select
              value={targetDayIndex}
              onChange={(e) => onSelectTargetDay?.(Number(e.target.value))}
              className="text-xs font-extrabold text-emerald-900 bg-transparent outline-none cursor-pointer pr-1"
            >
              <option value={-1}>⭐ Kho địa điểm đã lưu (Chờ xếp ngày)</option>
              {days.map((d, idx) => (
                <option key={idx} value={idx}>
                  📍 Ngày {d.dayNumber}: {d.title || `Ngày ${d.dayNumber}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên địa điểm, tỉnh thành, món ăn đặc sản...."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/15 transition-all shadow-2xs font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 sm:px-7 py-3 bg-[#064e3b] hover:bg-emerald-950 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      <div className="p-4 sm:p-6 bg-slate-50/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs sm:text-sm">
                <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
                <span>Bộ lọc tìm kiếm</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Danh mục trải nghiệm
              </h4>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <label
                  className={`flex items-center justify-between text-xs cursor-pointer min-h-[32px] px-2.5 py-1.5 rounded-xl transition-colors ${
                    selectedCategoryId === 'all'
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/70'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="radio"
                      name="itineraryCategoryFilter"
                      checked={selectedCategoryId === 'all'}
                      onChange={() => {
                        setSelectedCategoryId('all')
                        setCurrentPage(1)
                      }}
                      className="w-3.5 h-3.5 accent-emerald-800 cursor-pointer shrink-0"
                    />
                    <span className="truncate">Tất cả danh mục</span>
                  </div>
                </label>

                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center justify-between text-xs cursor-pointer min-h-[32px] px-2.5 py-1.5 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/70'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="radio"
                          name="itineraryCategoryFilter"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCategoryId(cat.id)
                            setCurrentPage(1)
                          }}
                          className="w-3.5 h-3.5 accent-emerald-800 cursor-pointer shrink-0"
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Vùng miền & Tỉnh thành
              </h4>
              <div className="space-y-1.5">
                {regions.map((region) => {
                  const isRegionSelected = selectedRegionId === region.id
                  const isAccordionOpen = openRegionAccordion[region.name]
                  const regionProvinces = region.provinces || []

                  return (
                    <div
                      key={region.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer min-h-[28px]">
                          <input
                            type="checkbox"
                            checked={isRegionSelected}
                            onChange={() => {
                              if (isRegionSelected) {
                                setSelectedRegionId('all')
                                setSelectedProvinceId('all')
                              } else {
                                setSelectedRegionId(region.id)
                                setSelectedProvinceId('all')
                              }
                              setCurrentPage(1)
                            }}
                            className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                          />
                          <span>{region.name}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRegionAccordion((prev) => ({
                              ...prev,
                              [region.name]: !prev[region.name]
                            }))
                          }
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isAccordionOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {isAccordionOpen && regionProvinces.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 pt-1.5 pl-4 border-t border-slate-200/60 max-h-40 overflow-y-auto">
                          {regionProvinces.map((prov) => {
                            const isProvSelected = selectedProvinceId === prov.id
                            return (
                              <label
                                key={prov.id}
                                className={`flex items-center gap-1.5 text-[11px] cursor-pointer min-h-[24px] px-1.5 py-0.5 rounded-md truncate transition-colors ${
                                  isProvSelected
                                    ? 'bg-emerald-100/80 text-emerald-900 font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="itineraryProvinceFilter"
                                  checked={isProvSelected}
                                  onChange={() => {
                                    setSelectedProvinceId(prov.id)
                                    setSelectedRegionId(region.id)
                                    setCurrentPage(1)
                                  }}
                                  className="w-3 h-3 accent-emerald-800 cursor-pointer shrink-0"
                                />
                                <span className="truncate">{prov.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Khoảng giá & Ngân sách
              </h4>
              <div className="space-y-1">
                {PRICE_TIERS.map((tier, idx) => (
                  <label
                    key={tier.label}
                    className={`flex items-center gap-2 text-xs cursor-pointer min-h-[28px] px-2 py-1 rounded-lg transition-colors ${
                      selectedPriceTier === idx
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="itineraryPriceTier"
                      checked={selectedPriceTier === idx}
                      onChange={() => {
                        setSelectedPriceTier(idx)
                        setCurrentPage(1)
                      }}
                      className="w-3.5 h-3.5 accent-emerald-800 cursor-pointer"
                    />
                    <span>{tier.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Đánh giá tối thiểu
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[0, 4.5, 4.0, 3.0].map((rating) => {
                  const active = selectedMinRating === rating
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => {
                        setSelectedMinRating(rating)
                        setCurrentPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {rating === 0 ? (
                        'Tất cả'
                      ) : (
                        <>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{rating}+</span>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:px-4 flex items-center justify-between gap-3 shadow-2xs flex-wrap">
              <div className="flex items-center gap-2">
                <select
                  value={selectedSort}
                  onChange={(e) => {
                    setSelectedSort(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-emerald-700"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Hiển thị <strong className="text-slate-800">{places.length}</strong> / {totalElements}
                </span>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-emerald-900 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Dạng lưới"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-emerald-900 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Dạng danh sách"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Đang tìm kiếm địa điểm phù hợp...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200 p-6">
                <Compass size={40} className="mx-auto text-slate-300 stroke-1" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">Không tìm thấy địa điểm nào</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Xóa toàn bộ bộ lọc
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {places.map((place) => {
                  const isJustAdded = addedPlaceIds.has(place.id)
                  const priceDisplay = formatPrice(place.minPrice, place.maxPrice)

                  return (
                    <div
                      key={place.id}
                      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col h-full shadow-2xs"
                    >
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden shrink-0">
                        {place.thumbnailUrl ? (
                          <img
                            src={place.thumbnailUrl}
                            alt={place.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <Compass className="w-10 h-10 stroke-1" />
                          </div>
                        )}
                        {place.categoryName && (
                          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-emerald-950 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-2xs">
                            {place.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
                            <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="truncate">
                                {place.provinceName
                                  ? `${place.provinceName}${place.regionName ? `, ${place.regionName}` : ''}`
                                  : place.address}
                              </span>
                            </div>
                            {place.avgRating !== undefined && place.avgRating > 0 && (
                              <div className="flex items-center gap-1 font-bold text-slate-900 shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{place.avgRating.toFixed(1)}</span>
                                {place.reviewCount !== undefined && place.reviewCount > 0 && (
                                  <span className="text-slate-400 font-normal">({place.reviewCount})</span>
                                )}
                              </div>
                            )}
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                            {place.name}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {place.description || place.address}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">{place.openingHours || '08:00 – 22:00'}</span>
                            </div>
                            <div className="font-extrabold text-emerald-800 text-xs">
                              {priceDisplay}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdd(place)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                              isJustAdded
                                ? 'bg-emerald-700 text-white'
                                : 'bg-emerald-800 hover:bg-emerald-900 text-white hover:shadow-xs'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check size={14} strokeWidth={3} />
                                <span>Đã thêm vào {targetDayLabel}</span>
                              </>
                            ) : (
                              <>
                                <Plus size={14} strokeWidth={2.5} />
                                <span>Thêm vào {targetDayLabel}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {places.map((place) => {
                  const isJustAdded = addedPlaceIds.has(place.id)
                  const priceDisplay = formatPrice(place.minPrice, place.maxPrice)

                  return (
                    <div
                      key={place.id}
                      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row shadow-2xs"
                    >
                      <div className="w-full sm:w-48 aspect-4/3 sm:aspect-square relative bg-slate-100 shrink-0 overflow-hidden">
                        {place.thumbnailUrl ? (
                          <img
                            src={place.thumbnailUrl}
                            alt={place.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <Compass className="w-10 h-10 stroke-1" />
                          </div>
                        )}
                        {place.categoryName && (
                          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-emerald-950 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-2xs">
                            {place.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
                            <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="truncate">
                                {place.provinceName
                                  ? `${place.provinceName}${place.regionName ? `, ${place.regionName}` : ''}`
                                  : place.address}
                              </span>
                            </div>
                            {place.avgRating !== undefined && place.avgRating > 0 && (
                              <div className="flex items-center gap-1 font-bold text-slate-900 shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{place.avgRating.toFixed(1)}</span>
                                {place.reviewCount !== undefined && place.reviewCount > 0 && (
                                  <span className="text-slate-400 font-normal">({place.reviewCount})</span>
                                )}
                              </div>
                            )}
                          </div>

                          <h4 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 mt-1">
                            {place.name}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                            {place.description || place.address}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{place.openingHours || '08:00 – 22:00'}</span>
                            </div>
                            <div className="font-extrabold text-emerald-800 text-xs">
                              {priceDisplay}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdd(place)}
                            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              isJustAdded
                                ? 'bg-emerald-700 text-white'
                                : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check size={14} strokeWidth={3} />
                                <span>Đã thêm</span>
                              </>
                            ) : (
                              <>
                                <Plus size={14} strokeWidth={2.5} />
                                <span>Thêm vào {targetDayLabel}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                <span className="text-slate-500 font-medium">
                  Trang <strong className="text-slate-900">{currentPage}</strong> / {totalPages} (Tổng {totalElements} địa điểm)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <ChevronLeft size={14} />
                    <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <span>Sau</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}

export default ItineraryPlacePickerDrawer
