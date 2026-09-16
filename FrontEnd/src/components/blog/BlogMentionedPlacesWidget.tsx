import React from 'react'
import { MapPin, ChevronRight } from 'lucide-react'
import type { MentionedPlace } from '@/types/models/blogArticle.model'

interface BlogMentionedPlacesWidgetProps {
  places: MentionedPlace[]
  onSelectPlaceByName?: (name: string, province: string) => void
}

export const BlogMentionedPlacesWidget: React.FC<BlogMentionedPlacesWidgetProps> = ({
  places,
  onSelectPlaceByName
}) => {
  if (!places || places.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <MapPin size={15} className="text-emerald-800" />
          <span>Tọa độ trong bài</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
          {places.length} điểm
        </span>
      </div>

      <div className="space-y-2.5">
        {places.map((pl, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors flex flex-col justify-between gap-2"
          >
            <div>
              <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                {pl.category}
              </span>
              <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                {pl.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="text-slate-400" /> {pl.province}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="font-bold text-amber-600">★ {pl.rating}</span>
              <button
                type="button"
                onClick={() => onSelectPlaceByName?.(pl.name, pl.province)}
                className="font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Xem chi tiết</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlogMentionedPlacesWidget
