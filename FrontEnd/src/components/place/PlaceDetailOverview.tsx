import {
  CheckCircle2,
  Wifi,
  Car,
  CreditCard,
  Wind,
  Users,
  Compass,
  Star,
  Share2,
  Bookmark,
  Flag
} from 'lucide-react'
import type { PlaceDetailDto } from '@/types/models/place.model'

interface PlaceDetailOverviewProps {
  place: PlaceDetailDto
  totalReviews: number
  isSaved: boolean
  onToggleSave: () => void
  onShare: () => void
  onOpenReport: () => void
}

export const PlaceDetailOverview = ({
  place,
  totalReviews,
  isSaved,
  onToggleSave,
  onShare,
  onOpenReport
}: PlaceDetailOverviewProps) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-lg">
              {place.categoryName || 'Địa điểm nổi bật'}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
              {place.regionName || 'Việt Nam'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {place.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{Number(place.avgRating || 5).toFixed(1)}</span>
              <span className="text-gray-500 font-normal underline cursor-pointer ml-0.5">
                ({totalReviews} đánh giá)
              </span>
            </div>
            <span>•</span>
            <span className="text-gray-600">{place.address}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
          <button
            onClick={onToggleSave}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-2xs ${isSaved
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
            <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
          </button>
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors shadow-2xs"
            title="Báo cáo sai phạm"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-7 rounded-lg border border-gray-200/80 shadow-2xs">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <span>Giới thiệu tổng quan</span>
        </h2>
        <div className="prose max-w-none text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {place.detailedDescription || place.description}
        </div>

        {place.highlights && place.highlights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-3">Điểm nổi bật thu hút</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {place.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {place.amenities && place.amenities.length > 0 && (
        <div className="bg-white p-6 sm:p-7 rounded-lg border border-gray-200/80 shadow-2xs">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tiện ích & Dịch vụ có sẵn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {place.amenities.map((amenity) => {
              let IconComp = CheckCircle2
              if (amenity.icon === 'wifi') IconComp = Wifi
              else if (amenity.icon === 'car') IconComp = Car
              else if (amenity.icon === 'credit-card') IconComp = CreditCard
              else if (amenity.icon === 'wind') IconComp = Wind
              else if (amenity.icon === 'users') IconComp = Users
              else if (amenity.icon === 'compass') IconComp = Compass

              return (
                <div
                  key={amenity.id}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 bg-gray-50/60 text-gray-700 text-sm font-medium"
                >
                  <IconComp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
