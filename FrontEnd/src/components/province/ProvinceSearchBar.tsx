import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Map, ArrowRight, X } from 'lucide-react'
import type { ProvinceDto } from '@/types/models/geography.model'

interface ProvinceSearchBarProps {
  currentProvince: ProvinceDto
}

export const ProvinceSearchBar: React.FC<ProvinceSearchBarProps> = ({
  currentProvince
}) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('q', searchTerm.trim())
    params.set('province', currentProvince.name)
    navigate(`/explore?${params.toString()}`)
  }

  const handleOpenMap = () => {
    const params = new URLSearchParams()
    params.set('province', currentProvince.name)
    if (searchTerm.trim()) params.set('q', searchTerm.trim())
    navigate(`/map?${params.toString()}`)
  }

  return (
    <div className="w-full relative my-6">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200/90 p-3.5 sm:p-5 transition-all space-y-3.5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm địa điểm, quán ăn, tọa độ check-in tại ${currentProvince.name}...`}
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:bg-white focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/15 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-initial h-12 px-6 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all active-press"
            >
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenMap}
              className="h-12 px-4 sm:px-5 rounded-xl bg-stone-100 hover:bg-[#2D6A4F] text-stone-700 hover:text-white border border-stone-200 hover:border-[#2D6A4F] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active-press"
              title="Mở bản đồ tương tác tỉnh thành"
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Mở bản đồ tỉnh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
