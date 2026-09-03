import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Mountain, Waves, Landmark, Utensils, Coffee,
  TreePine, Sparkles, Compass
} from 'lucide-react'
import { catalogService } from '@/services/catalogService'
import type { CategoryDto } from '@/types/models/place.model'

const ICON_MAP: Record<string, React.ElementType> = {
  'Danh lam thắng cảnh': Mountain,
  'Bãi biển': Waves,
  'Di tích': Landmark,
  'Quán ăn': Utensils,
  'Cà phê': Coffee,
  'Vườn quốc gia': TreePine,
  'Phượt & Trải nghiệm': Compass,
  'Văn hóa bản địa': Sparkles
}

const COLOR_MAP: Record<string, string> = {
  'Danh lam thắng cảnh': 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200',
  'Bãi biển': 'from-sky-500/10 to-blue-500/10 text-sky-700 border-sky-200',
  'Di tích': 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200',
  'Quán ăn': 'from-rose-500/10 to-orange-500/10 text-rose-700 border-rose-200',
  'Cà phê': 'from-amber-700/10 to-yellow-600/10 text-amber-800 border-amber-300',
  'Vườn quốc gia': 'from-green-600/10 to-emerald-600/10 text-green-800 border-green-200',
  'Phượt & Trải nghiệm': 'from-indigo-500/10 to-purple-500/10 text-indigo-700 border-indigo-200',
  'Văn hóa bản địa': 'from-teal-500/10 to-cyan-500/10 text-teal-700 border-teal-200'
}

export const CategoryQuickNav: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        const res = await catalogService.getCategories()
        if (res.success && res.data) {
          setCategories(res.data)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [])

  if (!isLoading && categories.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Danh mục trải nghiệm</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bạn đang tìm kiếm điều gì?
            </h2>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <span>Xem tất cả danh mục</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center space-y-2.5 animate-pulse">
                <div className="w-12 h-12 rounded-2xl skeleton-shimmer"></div>
                <div className="w-20 h-4 rounded-md skeleton-shimmer"></div>
                <div className="w-14 h-3 rounded-md skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((item) => {
              const IconComponent = ICON_MAP[item.name] || Compass
              const colorClass = COLOR_MAP[item.name] || 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200'

              return (
                <Link
                  key={item.id}
                  to={`/explore?cat=${encodeURIComponent(item.name)}&catId=${item.id}`}
                  className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br border transition-colors duration-300 flex flex-col items-center text-center space-y-2.5"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/30 transition-colors duration-300 pointer-events-none"></div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorClass}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {item.placeCount > 0 ? `${item.placeCount} địa điểm` : 'Đang cập nhật'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
