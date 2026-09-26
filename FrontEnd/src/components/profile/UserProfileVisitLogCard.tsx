import React from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import type { VisitLogItem } from '@/types/models/userProfile.model'

interface UserProfileVisitLogCardProps {
  log: VisitLogItem
}

export const UserProfileVisitLogCard: React.FC<UserProfileVisitLogCardProps> = ({ log }) => {
  const coverImage =
    log.coverImg ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=250&fit=crop'

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
          <img
            src={coverImage}
            alt={log.placeName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
          <div className="absolute top-1 left-1 bg-amber-500 text-white p-1 rounded-full shadow-xs">
            <CheckCircle2 size={10} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {log.category && (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                {log.category}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              Đã ghé thăm: {new Date(log.visitedDate).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
            {log.placeName}
          </h4>

          {log.province && (
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-1">
              <MapPin size={12} className="text-amber-500 shrink-0" />
              <span className="truncate">{log.province}</span>
            </div>
          )}
        </div>
      </div>

      <Link
        to={`/places/${log.placeId}`}
        className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0 cursor-pointer"
        title="Xem chi tiết địa điểm"
      >
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
