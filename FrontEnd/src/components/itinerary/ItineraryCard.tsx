import {
  Clock,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles
} from 'lucide-react'
import type { ItineraryDto } from '@/types/models/place.model'

interface ItineraryCardProps {
  itinerary: ItineraryDto
  isExpanded: boolean
  isSaved: boolean
  onToggleExpand: () => void
  onSave: (id: number) => void
}

export const ItineraryCard = ({
  itinerary,
  isExpanded,
  isSaved,
  onToggleExpand,
  onSave
}: ItineraryCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden transition-all duration-200">
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-lg">
              {itinerary.duration}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg">
              {itinerary.destination}
            </span>
            {itinerary.style && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                {itinerary.style}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900">{itinerary.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
            {itinerary.overview}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 pt-1">
            <div className="flex items-center gap-1 text-emerald-700">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Dự toán: {itinerary.estimatedCost}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{itinerary.daysCount || itinerary.days?.length || 1} ngày khám phá</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={() => onSave(itinerary.id)}
            className={`p-2.5 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title="Lưu lịch trình"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
          </button>

          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && itinerary.days && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-7 space-y-6">
          <div className="space-y-6">
            {itinerary.days.map((day) => (
              <div key={day.dayNumber} className="bg-white rounded-lg border border-gray-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      {day.dayNumber}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                      Ngày {day.dayNumber}: {day.title}
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  {day.stops?.map((stop, stopIdx) => (
                    <div
                      key={stopIdx}
                      className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-emerald-50/30 transition-colors border border-gray-100"
                    >
                      <div className="sm:w-28 shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{stop.time}</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-gray-900 text-sm">{stop.activity}</div>
                          {stop.costEstimate && (
                            <span className="text-2xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                              {stop.costEstimate}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-medium text-gray-800 flex items-center gap-1 inline">
                            <MapPin className="w-3 h-3 inline text-emerald-600" />
                            {stop.location}:
                          </span>{' '}
                          {stop.description}
                        </p>

                        {stop.tips && (
                          <div className="text-2xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200/60 inline-flex items-center gap-1 mt-1">
                            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Mẹo: {stop.tips}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
