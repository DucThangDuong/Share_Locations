import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import type { RegionDto } from '@/types/models/geography.model'

interface RegionShowcaseCardProps {
  region: RegionDto
}

const getRegionSlug = (name: string, id?: number): string => {
  const lower = (name || '').toLowerCase()
  if (lower.includes('bắc') || lower.includes('bac') || id === 1) return 'mien-bac'
  if (lower.includes('trung') || id === 2) return 'mien-trung'
  if (lower.includes('nam') || id === 3) return 'mien-nam'
  return 'mien-bac'
}

export const RegionShowcaseCard: React.FC<RegionShowcaseCardProps> = ({ region }) => {
  const navigate = useNavigate()

  const heroImage = region.imageUrl && (region.imageUrl.startsWith('http') || region.imageUrl.startsWith('/')) ? region.imageUrl : null
  const provinces = region.provinces || []
  const displayProvinces = provinces.slice(0, 8)
  const regionSlug = getRegionSlug(region.name, region.id)

  return (
    <section className="my-8 rounded-lg bg-slate-50/80 border border-slate-200/80 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-stretch">
        <div
          onClick={() => navigate(`/mien/${regionSlug}`)}
          className="lg:w-5/12 relative min-h-[280px] lg:min-h-[420px] bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer group/img"
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt={region.name}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent"></div>
          <div className="absolute inset-0 bg-white/0 group-hover/img:bg-white/10 transition-colors duration-300 pointer-events-none"></div>

          <div className="absolute bottom-4 left-4 right-4 z-10 text-white lg:hidden">
            <h3 className="text-xl font-extrabold">{region.name}</h3>
            {region.tagline && (
              <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">{region.tagline}</p>
            )}
          </div>
        </div>

        <div className="lg:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3
              onClick={() => navigate(`/mien/${regionSlug}`)}
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug cursor-pointer hover:text-emerald-800 transition-colors"
            >
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
              onClick={() => navigate(`/mien/${regionSlug}`)}
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
