import React, { useState } from 'react'
import { Sliders, ChevronDown, X, Check, RotateCcw } from 'lucide-react'
import type { LookupItemDto, RegionLookupDto } from '@/types/models/place.model'

interface MapFilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  categories: LookupItemDto[]
  regions: RegionLookupDto[]
  selectedCategoryId: number
  selectedProvinceId: number
  onSelectCategory: (categoryId: number) => void
  onSelectProvince: (provinceId: number) => void
  onResetFilters: () => void
}

export const MapFilterSidebar: React.FC<MapFilterSidebarProps> = ({
  isOpen,
  onClose,
  categories,
  regions,
  selectedCategoryId,
  selectedProvinceId,
  onSelectCategory,
  onSelectProvince,
  onResetFilters
}) => {
  const [openRegionAccordion, setOpenRegionAccordion] = useState<Record<string, boolean>>({
    'Miền Bắc': true,
    'Miền Trung': true,
    'Miền Nam': true
  })

  if (!isOpen) return null

  const toggleRegion = (regionName: string) => {
    setOpenRegionAccordion((prev) => ({
      ...prev,
      [regionName]: !prev[regionName]
    }))
  }

  const activeFilterCount = (selectedCategoryId > 0 ? 1 : 0) + (selectedProvinceId > 0 ? 1 : 0)

  return (
    <div className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-xs flex justify-start animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>Bộ lọc tìm kiếm</span>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bộ lọc"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section 1: Categories (Single-select) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Danh mục trải nghiệm
              </h3>
              {selectedCategoryId > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  1 đã chọn
                </span>
              )}
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => onSelectCategory(0)}
                className={`w-full flex items-center justify-between text-xs cursor-pointer min-h-[36px] px-3 py-1.5 rounded-xl transition-colors text-left ${
                  selectedCategoryId === 0
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      selectedCategoryId === 0
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedCategoryId === 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span>Tất cả danh mục</span>
                </div>
                {selectedCategoryId === 0 && <Check className="w-3.5 h-3.5 text-emerald-700" />}
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(isSelected ? 0 : cat.id)}
                    className={`w-full flex items-center justify-between text-xs cursor-pointer min-h-[36px] px-3 py-1.5 rounded-xl transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Regions & Provinces (Single-select province) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vùng miền & Tỉnh thành
              </h3>
              {selectedProvinceId > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  1 tỉnh đã chọn
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelectProvince(0)}
              className={`w-full flex items-center justify-between text-xs cursor-pointer min-h-[36px] px-3 py-1.5 rounded-xl transition-colors text-left ${
                selectedProvinceId === 0
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    selectedProvinceId === 0
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {selectedProvinceId === 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span>Tất cả tỉnh thành</span>
              </div>
              {selectedProvinceId === 0 && <Check className="w-3.5 h-3.5 text-emerald-700" />}
            </button>

            {regions.map((region) => {
              const regionProvinces = region.provinces || []
              const hasSelectedInRegion = regionProvinces.some((p) => p.id === selectedProvinceId)
              const isOpenAccordion = openRegionAccordion[region.name] ?? true

              return (
                <div
                  key={region.id}
                  className="border border-slate-200/70 rounded-2xl overflow-hidden bg-white shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleRegion(region.name)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-800 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{region.name}</span>
                      {hasSelectedInRegion && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpenAccordion ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpenAccordion && (
                    <div className="p-2 border-t border-slate-100 grid grid-cols-2 gap-1 max-h-56 overflow-y-auto">
                      {regionProvinces.map((province) => {
                        const isSelected = selectedProvinceId === province.id
                        return (
                          <button
                            key={province.id}
                            type="button"
                            onClick={() => onSelectProvince(isSelected ? 0 : province.id)}
                            className={`flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl transition-colors text-left ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1 truncate">
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-600'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1 h-1 rounded-full bg-white" />
                                )}
                              </div>
                              <span className="truncate text-[11px]">{province.name}</span>
                            </div>
                            {isSelected && <Check className="w-3 h-3 text-emerald-700 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetFilters}
            disabled={activeFilterCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  )
}
