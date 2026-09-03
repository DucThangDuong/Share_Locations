import React, { useState } from 'react'
import { Sliders, ChevronDown, Star, X } from 'lucide-react'
import type { LookupItemDto, RegionLookupDto } from '@/types/models/place.model'
import { PRICE_TIERS } from './explore.types'

interface ExploreFilterSidebarProps {
  categories: LookupItemDto[]
  regions: RegionLookupDto[]
  draftCategoryId?: number
  draftCategoryName: string
  draftRegionIds: number[]
  draftProvinceIds: number[]
  draftPriceTier: number
  draftMinRating: number
  isOpen: boolean
  onClose: () => void
  onCategorySelect: (cat?: LookupItemDto) => void
  onRegionCheck: (region: RegionLookupDto) => void
  onProvinceCheck: (province: LookupItemDto) => void
  onPriceTierChange: (tierIdx: number) => void
  onMinRatingChange: (rating: number) => void
}

export const ExploreFilterSidebar: React.FC<ExploreFilterSidebarProps> = ({
  categories,
  regions,
  draftCategoryId,
  draftCategoryName,
  draftRegionIds,
  draftProvinceIds,
  draftPriceTier,
  draftMinRating,
  isOpen,
  onClose,
  onCategorySelect,
  onRegionCheck,
  onProvinceCheck,
  onPriceTierChange,
  onMinRatingChange
}) => {
  const [openRegionAccordion, setOpenRegionAccordion] = useState<Record<string, boolean>>({})

  return (
    <aside
      className={`lg:block ${isOpen
        ? 'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end p-4'
        : 'hidden'
        }`}
    >
      <div
        className={`bg-white rounded-lg p-6 border border-slate-200/80 space-y-5 overflow-y-auto max-h-[85vh] ${isOpen
          ? 'w-full max-w-xs h-full rounded-lg animate-in slide-in-from-right'
          : 'sticky top-24'
          }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Sliders className="w-4 h-4 text-primary" />
            <span>Bộ lọc tìm kiếm</span>
          </div>
          {isOpen && (
            <button
              onClick={onClose}
              aria-label="Đóng bộ lọc"
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Danh mục trải nghiệm
          </h3>
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            <label
              className={`flex items-center justify-between text-xs cursor-pointer min-h-[32px] px-2.5 py-1.5 rounded-lg transition-colors ${!draftCategoryId && !draftCategoryName
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="categoryFilter"
                  checked={!draftCategoryId && !draftCategoryName}
                  onChange={() => onCategorySelect(undefined)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span>Tất cả danh mục</span>
              </div>
            </label>

            {categories.map((cat) => {
              const isSelected = draftCategoryId === cat.id || draftCategoryName === cat.name
              return (
                <label
                  key={cat.id}
                  className={`flex items-center justify-between text-xs cursor-pointer min-h-[32px] px-2.5 py-1.5 rounded-lg transition-colors ${isSelected
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <input
                      type="radio"
                      name="categoryFilter"
                      checked={isSelected}
                      onChange={() => onCategorySelect(cat)}
                      className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Vùng miền & Tỉnh thành
          </h3>
          {regions.map((region) => {
            const isRegionSelected = draftRegionIds.includes(region.id)
            const isOpen = openRegionAccordion[region.name]
            const regionProvinces = region.provinces || []

            return (
              <div key={region.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer min-h-[32px]">
                    <input
                      type="checkbox"
                      checked={isRegionSelected}
                      onChange={() => onRegionCheck(region)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                    <span>{region.name}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Mở rộng danh sách tỉnh thành ${region.name}`}
                    onClick={() =>
                      setOpenRegionAccordion((prev) => ({
                        ...prev,
                        [region.name]: !prev[region.name]
                      }))
                    }
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {isOpen && regionProvinces.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1 pl-5 border-t border-slate-200/60">
                    {regionProvinces.map((prov) => {
                      const isProvSelected = draftProvinceIds.includes(prov.id)
                      return (
                        <label
                          key={prov.id}
                          className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer min-h-[28px]"
                        >
                          <input
                            type="checkbox"
                            checked={isProvSelected}
                            onChange={() => onProvinceCheck(prov)}
                            className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
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

        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Khoảng giá & Ngân sách
          </h3>
          <div className="space-y-1.5">
            {PRICE_TIERS.map((tier, idx) => (
              <label
                key={tier.label}
                className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer min-h-[30px]"
              >
                <input
                  type="radio"
                  name="priceTier"
                  checked={draftPriceTier === idx}
                  onChange={() => onPriceTierChange(idx)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span>{tier.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Đánh giá tối thiểu
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {[0, 4.5, 4.0, 3.5].map((rating) => {
              const active = draftMinRating === rating
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onMinRatingChange(rating)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer min-h-[36px] ${active
                    ? 'bg-primary text-white border-primary'
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
      </div>
    </aside>
  )
}
