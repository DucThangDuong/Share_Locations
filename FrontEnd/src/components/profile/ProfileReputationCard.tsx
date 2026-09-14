import React from 'react'
import { Award } from 'lucide-react'

interface ProfileReputationCardProps {
  score: number
}

export const ProfileReputationCard: React.FC<ProfileReputationCardProps> = ({ score }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-4 shadow-2xs">
      <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider">
        <Award className="w-4 h-4 text-amber-500" />
        <span>Điểm cống hiến</span>
      </h2>

      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 space-y-1">
        <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
          {score}
        </div>
        <div className="text-xs text-slate-500 font-medium">Điểm uy tín tích lũy trong hệ thống</div>
      </div>
    </div>
  )
}

export default ProfileReputationCard
