import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import type { RegionDto } from '@/types/models/geography.model'

interface RegionShowcaseCardProps {
  region: RegionDto
}

const REGION_FALLBACK_IMAGES: Record<string, string> = {
  'Miền Bắc': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=750&fit=crop&auto=format',
  'Miền Trung': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=750&fit=crop&auto=format',
  'Miền Nam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=750&fit=crop&auto=format'
}

export const RegionShowcaseCard: React.FC<RegionShowcaseCardProps> = ({ region }) => {
  const navigate = useNavigate()

  const heroImage = region.imageUrl || REGION_FALLBACK_IMAGES[region.name] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&h=750&fit=crop&auto=format'
  const provinces = region.provinces || []
  const displayProvinces = provinces.slice(0, 8)

  return (
    <section className="my-8 rounded-lg bg-slate-50/80 border border-slate-200/80 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-stretch">
        <div className="lg:w-5/12 relative min-h-[280px] lg:min-h-[420px] bg-slate-100 overflow-hidden">
          <img
            src={heroImage}
            alt={region.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              ; (e.currentTarget as HTMLImageElement).src = REGION_FALLBACK_IMAGES[region.name] || heroImage
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent"></div>
          <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-300 pointer-events-none"></div>

          <div className="absolute top-4 left-4 z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              {region.name}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 text-white lg:hidden">
            <h3 className="text-xl font-extrabold">{region.name}</h3>
            {region.tagline && (
              <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">{region.tagline}</p>
            )}
          </div>
        </div>

        <div className="lg:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {region.name} {region.tagline ? `— ${region.tagline}` : ''}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-2xl">
              {region.description ||
                `Khám phá những điểm đến đặc trưng, ẩm thực đậm đà bản sắc và cảnh sắc thiên nhiên tuyệt tác của ${region.name}.`}
            </p>
          </div>

          {displayProvinces.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Các tỉnh thành nổi bật:</span>
                <span>{displayProvinces.length}/{provinces.length} tỉnh thành</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {displayProvinces.map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => navigate(`/explore?province=${encodeURIComponent(prov.name)}&provinceId=${prov.id}&regionId=${region.id}`)}
                    className="p-2.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 transition-all text-left group flex flex-col justify-between cursor-pointer active-press"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-1 transition-colors">
                      {prov.name}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 mt-1 font-medium">
                      {prov.placeCount > 0 ? `${prov.placeCount} địa điểm` : 'Khám phá'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate(`/explore?region=${encodeURIComponent(region.name)}&regionId=${region.id}`)}
              className="px-6 py-3 bg-[#004f32] hover:bg-[#003d27] text-white rounded-full font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-none active-press"
            >
              <span>Khám phá tất cả tỉnh thành {region.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
