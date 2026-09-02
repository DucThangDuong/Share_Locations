import React from 'react'
import { ITINERARY_ITEMS } from '@/services/travelDataService'
import { Compass, Clock, MapPin, ArrowRight } from 'lucide-react'

export const ItinerarySection: React.FC = () => {
  return (
    <section id="hanhtrinh" className="scroll-mt-20">
      <div className="text-center mb-10">
        <span className="text-xs font-bold text-secondary-container uppercase tracking-widest bg-secondary-container/10 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5">
          <Compass className="w-3 h-3" /> Gợi ý lịch trình
        </span>
        <h2 className="text-3xl md:text-4xl text-primary-container font-extrabold tracking-tight mb-3">
          Hành trình được đề xuất
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-xs sm:text-sm">
          Các kế hoạch du lịch chi tiết từng ngày, tối ưu thời gian di chuyển và trải nghiệm trọn vẹn từng điểm đến.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ITINERARY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden border border-surface-variant transition-colors duration-300 flex flex-col group cursor-pointer"
          >
            <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none"></div>
              <div className="absolute top-4 left-4 bg-primary-container/90 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                <Clock className="w-3 h-3" /> {item.duration}
              </div>
              <div className="absolute top-4 right-4 bg-white/90 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {item.placesCount} điểm dừng
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-secondary-container text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3" /> {item.destination}
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-container transition-colors leading-snug tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2 font-normal">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-surface-variant flex items-center justify-between text-xs text-slate-500">
                <span>Bởi {item.author} • {item.updatedAt}</span>
                <span className="font-semibold text-primary-container group-hover:text-secondary-container flex items-center gap-0.5 transition-colors">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
