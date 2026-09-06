import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { foodService } from '@/services/foodService'
import { FoodCard } from '@/components/food/FoodCard'
import type { FoodItemDto } from '@/types/models/place.model'

const CATEGORIES = ['Tất cả', 'Món nước', 'Cơm & Món khô', 'Bánh & Ăn vặt', 'Đồ uống & Chè']
const REGIONS = [
  { id: 'all', label: 'Tất cả vùng miền' },
  { id: 'north', label: 'Miền Bắc' },
  { id: 'central', label: 'Miền Trung' },
  { id: 'south', label: 'Miền Nam' }
]

export const FoodPage = () => {
  const [foods, setFoods] = useState<FoodItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRegion, setActiveRegion] = useState<string>('all')
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedFoods, setSavedFoods] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true)
      try {
        const res = await foodService.getFoods({
          region: activeRegion !== 'all' ? activeRegion : undefined,
          category: activeCategory !== 'Tất cả' ? activeCategory : undefined,
          keyword: searchQuery.trim() || undefined
        })
        if (res.success && res.data) {
          setFoods(res.data)
        }
      } catch {
        setFoods([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchFoods, 300)
    return () => clearTimeout(timeoutId)
  }, [activeRegion, activeCategory, searchQuery])

  const toggleSave = (id: number) => {
    setSavedFoods((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="relative bg-emerald-900 text-white overflow-hidden py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-800/80 border border-emerald-700 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <span>Tinh Hoa Ẩm Thực 3 Miền</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Khám Phá Thiên Đường Ẩm Thực Việt Nam
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Hành trình vị giác đưa bạn khám phá những món ngon trứ danh từ Phở Hà Nội, Bún Bò Cố Đô đến Cơm Tấm Sài Gòn kèm danh sách quán ăn bản địa uy tín.
          </p>

          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ăn, địa phương (ví dụ: Phở, Bún bò, Hà Nội, Huế)..."
                className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-sm rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {REGIONS.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setActiveRegion(reg.id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeRegion === reg.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Danh Sách Đặc Sản Gợi Ý</span>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
                <div className="h-5 bg-gray-200 rounded-md w-2/3" />
                <div className="h-4 bg-gray-200 rounded-md w-full" />
                <div className="h-16 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">Không tìm thấy món đặc sản nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {foods.map((food, index) => (
              <FoodCard
                key={`${food.id}-${index}`}
                food={food}
                isSaved={!!savedFoods[food.id]}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
