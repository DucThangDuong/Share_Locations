import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { RegionLandingData } from '@/types/models/region.model'

interface RegionSearchBarProps {
  data: RegionLandingData
}

export const RegionSearchBar: React.FC<RegionSearchBarProps> = ({ data }) => {
  const navigate = useNavigate()

  const handleProvinceSelect = (prov: string) => {
    navigate(`/provinces?province=${encodeURIComponent(prov)}`)
  }

  return (
    <div className="w-full relative my-6">
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 sm:p-5 transition-all space-y-3.5">
        {data.provinces && data.provinces.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/provinces')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border bg-[#C0392B] text-white border-[#C0392B] shadow-xs hover:bg-[#a93226]"
            >
              Tất cả tỉnh thành
            </button>
            {data.provinces.map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => handleProvinceSelect(prov)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-700 border-stone-200"
              >
                {prov}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RegionSearchBar
