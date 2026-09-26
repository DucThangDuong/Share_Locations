import React from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import type { ProposalItem } from '@/types/models/userProfile.model'

interface UserProfileProposalCardProps {
  proposal: ProposalItem
}

export const UserProfileProposalCard: React.FC<UserProfileProposalCardProps> = ({ proposal }) => {
  const coverImage =
    proposal.coverImg ||
    (proposal.mediaUrls && proposal.mediaUrls.length > 0 ? proposal.mediaUrls[0] : null) ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=300&fit=crop'

  const targetId = proposal.targetPlaceId || proposal.id

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-48 md:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-slate-100">
        <img
          src={coverImage}
          alt={proposal.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
        <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
          <CheckCircle2 size={12} />
          <span>Đã duyệt & Đưa vào bản đồ</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5 flex-wrap">
            {(proposal.categoryName || proposal.category) && (
              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/50">
                {proposal.categoryName || proposal.category}
              </span>
            )}
            {(proposal.provinceName || proposal.province) && (
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin size={12} className="text-amber-500" />
                {proposal.provinceName || proposal.province}
              </span>
            )}
            {proposal.createdAt && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar size={12} />
                {new Date(proposal.createdAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1.5">
            {proposal.name}
          </h3>

          {proposal.address && (
            <div className="text-xs text-slate-500 font-medium line-clamp-1 mb-2">
              {proposal.address}
            </div>
          )}

          {proposal.description && (
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
              {proposal.description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
            <Sparkles size={13} />
            Đóng góp bởi thành viên
          </span>

          <Link
            to={`/places/${targetId}`}
            className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:text-emerald-800 group-hover:translate-x-0.5 transition-all"
          >
            <span>Khám phá địa điểm</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
