import React from 'react'
import {
  Calendar,
  Sparkles,
} from 'lucide-react'
import type { PublicUserProfileDto } from '@/types/models/userProfile.model'

interface UserProfileSidebarProps {
  profile: PublicUserProfileDto
}

export const UserProfileSidebar: React.FC<UserProfileSidebarProps> = ({ profile }) => {
  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
          Giới thiệu
        </h2>

        <div className="space-y-3.5 text-sm text-slate-600">

          {profile.joinedDate && (
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Tham gia từ</div>
                <div className="text-slate-800 font-medium">{profile.joinedDate}</div>
              </div>
            </div>
          )}

          {profile.reputationScore !== undefined && (
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Điểm uy tín</div>
                <div className="text-slate-800 font-bold text-base text-amber-600">
                  {profile.reputationScore.toLocaleString()} điểm
                </div>
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">Tiểu sử</div>
              <p className="text-slate-700 italic leading-relaxed text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{profile.bio}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
