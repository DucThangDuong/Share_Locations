import {
  Search,
  MapPin,
  Star,
  Utensils,
  Landmark,
  TreePine,
  Layers,
  Loader2
} from 'lucide-react'
import type { PlaceMapItemDto } from '@/types/models/place.model'

const CATEGORIES = [
  { id: 0, name: 'Tất cả', icon: Layers },
  { id: 1, name: 'Thắng cảnh', icon: TreePine },
  { id: 2, name: 'Di tích', icon: Landmark },
  { id: 3, name: 'Ẩm thực', icon: Utensils }
]

const REGIONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'north', label: 'Bắc' },
  { id: 'central', label: 'Trung' },
  { id: 'south', label: 'Nam' }
]

interface MapSidebarProps {
  places: PlaceMapItemDto[]
  loading: boolean
  searchKeyword: string
  selectedCategory: number
  selectedRegion: string
  activePlace: PlaceMapItemDto | null
  mobileView: 'map' | 'list'
  onSearchChange: (keyword: string) => void
  onCategoryChange: (categoryId: number) => void
  onRegionChange: (region: string) => void
  onSelectPlace: (place: PlaceMapItemDto) => void
}

export const MapSidebar = ({
  places,
  loading,
  searchKeyword,
  selectedCategory,
  selectedRegion,
  activePlace,
  mobileView,
  onSearchChange,
  onCategoryChange,
  onRegionChange,
  onSelectPlace
}: MapSidebarProps) => {
  return (
    <div
      className={`w-full md:w-[400px] lg:w-[440px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 ${
        mobileView === 'map' ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm địa điểm, tỉnh thành..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium shrink-0">Vùng miền:</span>
          <div className="flex items-center gap-1">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => onRegionChange(r.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                  selectedRegion === r.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Đang tải dữ liệu bản đồ...</span>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Không tìm thấy địa điểm nào phù hợp với bộ lọc.
          </div>
        ) : (
          places.map((place) => {
            const isSelected = activePlace?.id === place.id
            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-2xs'
                }`}
              >
                {place.imageUrl ? (
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-2xs font-bold text-emerald-700 uppercase">{place.category}</span>
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{place.avgRating}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm truncate">{place.name}</h4>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                      <span>{place.address}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-2xs text-gray-500 pt-1">
                    <span className="font-semibold text-emerald-700">{place.price}</span>
                    <span className="text-gray-400">{place.reviewCount} đánh giá</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
