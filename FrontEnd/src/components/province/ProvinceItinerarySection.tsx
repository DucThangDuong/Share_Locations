import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, DollarSign } from 'lucide-react'
import type { ProvinceItinerary } from '@/types/models/province.model'

interface ProvinceItinerarySectionProps {
  itineraries: ProvinceItinerary[]
  provinceName: string
}

export const ProvinceItinerarySection: React.FC<ProvinceItinerarySectionProps> = ({
  itineraries,
  provinceName
}) => {
  const navigate = useNavigate()

  if (!itineraries || itineraries.length === 0) return null

  return (
    <section className="my-12 space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Lịch Trình Khám Phá {provinceName}
          </h2>
        </div>

        <Link
          to="/itinerary"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>Xem tất cả lịch trình</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {itineraries.map((itinerary) => (
          <div
            key={itinerary.id}
            onClick={() => navigate(`/itinerary/${itinerary.id}`)}
            className="group flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
              <img
                src={itinerary.coverUrl}
                alt={itinerary.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h3 className="font-bold text-base sm:text-lg text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug tracking-tight">
                  {itinerary.title}
                </h3>

                {itinerary.overview && (
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {itinerary.overview}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-stone-600 font-semibold">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{itinerary.estimatedCost || 'Chi phí linh hoạt'}</span>
                </div>

                <span className="font-bold text-emerald-800 group-hover:underline flex items-center gap-1">
                  <span>Chi tiết</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
