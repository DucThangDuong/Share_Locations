import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Compass, Navigation, Layers } from 'lucide-react'
import { placeService } from '@/services/placeService'
import type { LookupItemDto, RegionLookupDto } from '@/types/models/place.model'

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate()
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

  const quickTags = [
    { label: 'Hà Giang', region: 'Miền Bắc' },
    { label: 'Phong Nha', region: 'Miền Trung' },
    { label: 'Đà Lạt', region: 'Miền Trung' },
    { label: 'Hội An', region: 'Miền Trung' },
    { label: 'Phú Quốc', region: 'Miền Nam' }
  ]

  return (
    <header className="relative w-full overflow-hidden mx-auto max-w-7xl md:mt-4 md:rounded-lg border border-slate-200/50">
      <div className="relative min-h-[70vh] md:min-h-[80vh] flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <img
          alt="Việt Nam ngút ngàn"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-900/30"></div>

        <div className="relative z-10 max-w-4xl space-y-6 my-auto text-left pt-6 sm:pt-10">
          <h1 className="text-4xl sm:text-6xl md:text-7xl text-white font-extrabold tracking-tight leading-[1.12]">
            Mỗi chuyến đi là <br />
            <span className="text-secondary-container">một điều kỳ diệu</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-200/90 font-normal max-w-2xl leading-relaxed">
            Khám phá trọn vẹn cảnh sắc 63 tỉnh thành, lưu giữ hàng ngàn quán ăn đặc sản bản địa và kết nối cùng cộng đồng du lịch tự túc.
          </p>

          <div className="pt-2 max-w-3xl">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-lg sm:rounded-full flex flex-col sm:flex-row gap-2 border border-white/80"
            >
              <div className="flex-1 flex items-center pl-3">
                <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Bạn muốn đi đâu? (Hà Giang, Tràng An, Cơm tấm...)"
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pl-0 sm:pl-2">
                <div className="flex items-center pl-2 sm:pl-1">
                  <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    aria-label="Chọn vùng miền"
                    className="bg-transparent text-xs sm:text-sm text-slate-700 font-semibold px-2 py-2 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Tất cả miền</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pl-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Chọn danh mục"
                    className="bg-transparent text-xs sm:text-sm text-slate-700 font-semibold px-2 py-2 focus:outline-hidden cursor-pointer"
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

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary to-emerald-700 hover:from-primary-hover hover:to-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-full active-press transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-[44px]"
              >
                <Compass className="w-4 h-4" />
                <span>Khám phá ngay</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-secondary-container" /> Tìm nhanh:
              </span>
              {quickTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => {
                    setKeyword(tag.label)
                    setRegion(tag.region)
                    navigate(`/explore?q=${encodeURIComponent(tag.label)}&region=${encodeURIComponent(tag.region)}`)
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all text-[11px] font-medium border border-white/10 cursor-pointer"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/15 max-w-4xl">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-secondary-container tracking-tight">63+</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Tỉnh thành toàn quốc</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">1,200+</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Địa điểm & Món ngon</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">100%</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Kinh nghiệm thực tế</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight">50k+</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Cộng đồng yêu du lịch</div>
          </div>
        </div>
      </div>
    </header>
  )
}
