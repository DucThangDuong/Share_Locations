import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Compass, Layers, ArrowRight } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { geographyService } from '@/services/geographyService'
import { useSystemSettings } from '@/context/SystemSettingsContext'
import { CustomSelect } from '@/components/common/CustomSelect'
import type { LookupItemDto } from '@/types/models/place.model'

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate()
  const { homeHeroImage } = useSystemSettings()
  const [keyword, setKeyword] = useState('')
  const [province, setProvince] = useState('')
  const [category, setCategory] = useState('')
  const [provinces, setProvinces] = useState<LookupItemDto[]>([])
  const [categories, setCategories] = useState<LookupItemDto[]>([])

  useEffect(() => {
    const loadHeroOptions = async () => {
      try {
        const res = await placeService.getFilterOptions()
        let provList: LookupItemDto[] = []
        if (res.success && res.data) {
          setCategories(res.data.categories || [])
          const extracted = (res.data.regions || []).flatMap((r) => r.provinces || [])
          provList = Array.from(new Map(extracted.map((p) => [p.id, p])).values())
        }
        if (provList.length === 0) {
          const geoRes = await geographyService.getProvinces()
          if (geoRes.success && geoRes.data) {
            provList = geoRes.data.map((p) => ({ id: p.id, name: p.name }))
          }
        }
        provList.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        setProvinces(provList)
      } catch {
      }
    }

    loadHeroOptions()
  }, [])

  const provinceOptions = useMemo(() => [
    { value: '', label: 'Tất cả tỉnh thành' },
    ...provinces.map((p) => ({
      value: p.name,
      label: p.name
    }))
  ], [provinces])

  const categoryOptions = useMemo(() => [
    { value: '', label: 'Tất cả danh mục' },
    ...categories.map((c) => ({
      value: c.name,
      label: c.name
    }))
  ], [categories])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    if (province) {
      params.set('province', province)
      const foundProv = provinces.find((p) => p.name === province)
      if (foundProv) {
        params.set('provinceId', String(foundProv.id))
      }
    }
    if (category) {
      params.set('cat', category)
      const foundCat = categories.find((c) => c.name === category)
      if (foundCat) {
        params.set('catId', String(foundCat.id))
      }
    }

    navigate(`/explore?${params.toString()}`)
  }

  return (
    <header className="relative z-20 w-full mx-auto max-w-7xl md:mt-4 md:rounded-3xl border border-slate-200/60 shadow-md">
      <div className="absolute inset-0 overflow-hidden md:rounded-3xl pointer-events-none">
        <img
          alt="Khám phá Việt Nam"
          className="w-full h-full object-cover"
          src={homeHeroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/90 via-sky-50/25 to-slate-900/40" />
      </div>

      <div className="relative z-10 min-h-[580px] sm:min-h-[640px] md:min-h-[680px] flex flex-col justify-between items-center text-center p-6 sm:p-10 lg:p-12">
        <div className="relative z-10 max-w-3xl sm:max-w-4xl space-y-3.5 pt-3 sm:pt-6 md:pt-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-slate-900 font-black tracking-tight leading-[1.18] sm:leading-[1.15]">
            Cảm Hứng Khám Phá <br className="hidden sm:inline" />
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10">Vô Vàn Trải Nghiệm</span>
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed">
            Khám phá thế giới du lịch nhanh chóng, tiện lợi cùng LangThang — nơi đam mê xê dịch biến thành những hành trình đáng nhớ.
          </p>
        </div>

        <div className="relative z-20 w-full max-w-4xl mx-auto pb-2 sm:pb-4">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.15)] border border-white/90 flex flex-col sm:flex-row items-center gap-2 sm:gap-1.5"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50/90 rounded-xl sm:rounded-full transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin size={17} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[11px] font-medium text-slate-400 leading-none mb-1 select-none">
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

            <div className="w-full sm:w-52 flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50/90 rounded-xl sm:rounded-full transition-colors relative">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Compass size={17} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <label
                  htmlFor="home-province-select"
                  className="block text-[11px] font-medium text-slate-400 leading-none mb-1 select-none cursor-pointer"
                >
                  Tỉnh thành
                </label>
                <CustomSelect
                  id="home-province-select"
                  value={province}
                  onChange={(val) => setProvince(String(val))}
                  options={provinceOptions}
                  placeholder="Tất cả tỉnh thành"
                  size="sm"
                  className="w-full"
                  buttonClassName="!border-0 !p-0 !bg-transparent !shadow-none !ring-0 text-xs sm:text-sm !font-bold text-slate-900 hover:text-slate-700 h-auto leading-tight focus:!ring-0 focus:!border-0"
                  menuClassName="w-64 max-w-[calc(100vw-3rem)] max-h-64 shadow-2xl border-slate-200/80 left-0 sm:-left-10"
                />
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0 mx-1" />

            <div className="w-full sm:w-52 flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50/90 rounded-xl sm:rounded-full transition-colors relative">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Layers size={17} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <label
                  htmlFor="home-category-select"
                  className="block text-[11px] font-medium text-slate-400 leading-none mb-1 select-none cursor-pointer"
                >
                  Danh mục
                </label>
                <CustomSelect
                  id="home-category-select"
                  value={category}
                  onChange={(val) => setCategory(String(val))}
                  options={categoryOptions}
                  placeholder="Tất cả danh mục"
                  size="sm"
                  className="w-full"
                  buttonClassName="!border-0 !p-0 !bg-transparent !shadow-none !ring-0 text-xs sm:text-sm !font-bold text-slate-900 hover:text-slate-700 h-auto leading-tight focus:!ring-0 focus:!border-0"
                  menuClassName="w-64 max-w-[calc(100vw-3rem)] max-h-64 shadow-2xl border-slate-200/80 left-0 sm:left-auto sm:right-0"
                />
              </div>
            </div>

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

