import React, { useRef } from 'react'
import { NORTH_DESTINATIONS, CENTRAL_DESTINATIONS, SOUTH_DESTINATIONS } from '@/services/travelDataService'
import type { DestinationItem } from '@/types/travel'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react'

interface RegionTrackProps {
  title: string
  subBadge: string
  items: DestinationItem[]
}

const RegionTrack: React.FC<RegionTrackProps> = ({ title, subBadge, items }) => {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = 330
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="mb-16">
      <div className="flex justify-between items-end mb-5 border-b border-surface-variant pb-3">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-primary-container text-[11px] font-semibold uppercase tracking-wider rounded-sm mb-1">
            {subBadge}
          </span>
          <h3 className="font-serif text-2xl text-slate-900 font-bold">{title}</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-surface-variant bg-white flex items-center justify-center text-slate-600 hover:bg-primary-container hover:text-white transition-all shadow-xs cursor-pointer"
            title="Lướt sang trái"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-surface-variant bg-white flex items-center justify-center text-slate-600 hover:bg-primary-container hover:text-white transition-all shadow-xs cursor-pointer"
            title="Lướt sang phải"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-auto gap-5 pb-4 hide-scrollbar snap-x scroll-smooth"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[280px] sm:w-[310px] h-[380px] relative rounded-2xl overflow-hidden shrink-0 snap-start group shadow-xs hover:shadow-lg transition-all duration-300 hover-lift cursor-pointer"
          >
            <img
              src={item.imageUrl}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              alt={item.name}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
            
            {item.tag && (
              <div className="absolute top-4 left-4 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-800 shadow-xs">
                {item.tag}
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 p-5 text-white">
              <span className="text-secondary-container text-xs font-semibold uppercase tracking-wider block mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 inline" /> {item.province}
              </span>
              <h4 className="font-serif text-2xl font-bold mb-2 group-hover:text-secondary-container transition-colors">
                {item.name}
              </h4>
              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-light">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const RegionsSection: React.FC = () => {
  return (
    <section id="diadiem" className="scroll-mt-20">
      <div className="text-center mb-14">
        <span className="text-xs font-bold text-secondary-container uppercase tracking-widest bg-secondary-container/10 px-3.5 py-1 rounded-full inline-block mb-2.5">
          Điểm đến nổi bật
        </span>
        <h2 className="font-serif text-3xl md:text-4xl text-primary-container font-bold mb-3">
          Khám phá 3 miền Việt Nam
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-xs sm:text-sm">
          Từ những đỉnh núi mờ sương Tây Bắc đến vẻ trù phú của miệt vườn phương Nam, mỗi vùng miền là một trang ký ức rực rỡ.
        </p>
      </div>

      <RegionTrack title="Miền Bắc" subBadge="Vùng núi & Đồng bằng" items={NORTH_DESTINATIONS} />
      <RegionTrack title="Miền Trung" subBadge="Di sản & Duyên hải" items={CENTRAL_DESTINATIONS} />
      <RegionTrack title="Miền Nam" subBadge="Đô thị & Sông nước" items={SOUTH_DESTINATIONS} />
    </section>
  )
}
