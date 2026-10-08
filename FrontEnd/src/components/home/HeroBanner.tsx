import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Compass, Layers, ArrowRight } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { useSystemSettings } from '@/context/SystemSettingsContext'
import type { LookupItemDto, RegionLookupDto } from '@/types/models/place.model'

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate()
  const { homeHeroImage } = useSystemSettings()
  const [keyword, setKeyword] = useState('')
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [regions, setRegions] = useState<RegionLookupDto[]>([])
  const [categories, setCategories] = useState<LookupItemDto[]>([])

  useEffect(() => {
    const loadHeroOptions = async () => {
      try {
        const res = await placeService.getFilterOptions()
        if (res.success && res.data) {
          setRegions(res.data.regions || [])
          setCategories(res.data.categories || [])
        }
      } catch {
      }
    }

    loadHeroOptions()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    if (region) params.set('region', region)
    if (category) params.set('cat', category)

    navigate(`/explore?${params.toString()}`)
  }

  return (
    <header className="relative w-full overflow-hidden mx-auto max-w-7xl md:mt-4 md:rounded-3xl border border-slate-200/60 shadow-md">
      <div className="relative min-h-[580px] sm:min-h-[640px] md:min-h-[680px] flex flex-col justify-between items-center text-center p-6 sm:p-10 lg:p-12">
        <img
          alt="Khám phá Việt Nam"
          className="absolute inset-0 w-full h-full object-cover"
          src={homeHeroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/90 via-sky-50/25 to-slate-900/40 pointer-events-none" />

        <div className="relative z-10 max-w-3xl sm:max-w-4xl space-y-3.5 pt-3 sm:pt-6 md:pt-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-slate-900 font-black tracking-tight leading-[1.18] sm:leading-[1.15]">
            Cảm Hứng Khám Phá & <br className="hidden sm:inline" />
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10">Vô Vàn Trải Nghiệm</span>
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed">
            Khám phá thế giới du lịch nhanh chóng, tiện lợi cùng LangThang — nơi đam mê xê dịch biến thành những hành trình đáng nhớ.
          </p>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto pb-2 sm:pb-4">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.15)] border border-white/90 flex flex-col sm:flex-row items-center gap-2 sm:gap-1.5"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50/90 rounded-xl sm:rounded-full transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin size={17} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[11px] font-medium text-slate-400 leading-none mb-1">
                  Điểm đến
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Bạn muốn đi đâu? (Hà Giang, Đà Lạt...)"
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-hidden truncate"
                />
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0 mx-1" />

            <div className="w-full sm:w-48 flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50/90 rounded-xl sm:rounded-full transition-colors relative">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Compass size={17} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[11px] font-medium text-slate-400 leading-none mb-1">
                  Vùng miền
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  aria-label="Chọn vùng miền"
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer truncate pr-5"
                >
                  <option value="">Tất cả miền</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0 mx-1" />

            <div className="w-full sm:w-48 flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50/90 rounded-xl sm:rounded-full transition-colors relative">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Layers size={17} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[11px] font-medium text-slate-400 leading-none mb-1">
                  Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Chọn danh mục"
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer truncate pr-5"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer shadow-md group min-h-[46px]"
            >
              <span>Khám phá ngay</span>
              <div className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight size={13} strokeWidth={3} />
              </div>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
