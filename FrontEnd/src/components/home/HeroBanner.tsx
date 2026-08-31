import React, { useState } from 'react'
import { Search, MapPin, Compass } from 'lucide-react'

export const HeroBanner: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const quickPills = [
    { label: 'Hà Giang', tag: 'Vùng cao' },
    { label: 'Đà Lạt', tag: 'Thành phố sương' },
    { label: 'Ninh Bình', tag: 'Di sản' },
    { label: 'Phú Quốc', tag: 'Biển đảo' },
    { label: 'Huế', tag: 'Cố đô' }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const target = document.getElementById('diadiem')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <header className="relative w-full overflow-hidden mx-auto max-w-[1440px] md:mt-4 md:rounded-3xl shadow-xl border border-slate-200/50">
      <div className="relative min-h-[65vh] md:min-h-[75vh] flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <img
          alt="Việt Nam ngút ngàn"
          className="absolute inset-0 w-full h-full object-cover scale-105 transform transition-transform duration-[25s] hover:scale-100"
          src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25"></div>
        <div className="relative z-10 max-w-4xl space-y-6 my-auto text-left">
          <h1
            className="text-4xl sm:text-6xl md:text-7xl text-white font-extrabold tracking-tight leading-[1.12]"
            style={{ textShadow: '0 4px 28px rgba(0,0,0,0.65)' }}
          >
            Mỗi chuyến đi là <br />
            <span className="text-secondary-container">một câu chuyện diệu kỳ</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-200/90 font-normal max-w-2xl leading-relaxed">
            Khám phá những vùng đất hoang sơ, lưu lại quán ăn đặc sản bản địa và kiến tạo hành trình du lịch độc bản của riêng bạn.
          </p>

          <div className="pt-2 max-w-2xl">
            <form onSubmit={handleSearch} className="glass-card p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row gap-2 border border-white/60">
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bạn muốn đi đâu? (Hà Giang, Đà Lạt, Hội An...)"
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary-container to-emerald-700 hover:from-primary-hover hover:to-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl sm:rounded-full shadow-md active-press transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Khám phá ngay</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-secondary-container" /> Điểm đến hot:
              </span>
              {quickPills.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => setSearchQuery(pill.label)}
                  className="px-3 py-1 rounded-full glass-dark text-slate-200 hover:text-white hover:bg-emerald-800/60 transition-all text-[11px] font-medium cursor-pointer"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 max-w-2xl">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">63+</div>
            <div className="text-xs text-slate-300 font-medium">Tỉnh thành toàn quốc</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">1,200+</div>
            <div className="text-xs text-slate-300 font-medium">Địa điểm & món ngon</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">100%</div>
            <div className="text-xs text-slate-300 font-medium">Kinh nghiệm thực tế</div>
          </div>
        </div>
      </div>
    </header>
  )
}
