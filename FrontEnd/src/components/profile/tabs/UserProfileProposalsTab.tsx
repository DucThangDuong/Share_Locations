import React, { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileProposalCard } from '../UserProfileProposalCard'
import type { ProposalItem } from '@/types/models/userProfile.model'

interface UserProfileProposalsTabProps {
  userId: number | string
}

export const UserProfileProposalsTab: React.FC<UserProfileProposalsTabProps> = ({ userId }) => {
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchProposals = async () => {
      setLoading(true)
      try {
        const res = await userService.getUserPublicProposals(userId, { pageSize: 15 })
        if (isMounted && res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).items || []
          setProposals(list)
        }
      } catch (err) {
        console.error('Failed to load proposals:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProposals()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-slate-200/90 shadow-2xs">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang tải địa điểm đề xuất...</span>
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-800">Chưa có địa điểm đề xuất</div>
        <p className="text-xs text-slate-500 mt-1">Chưa có địa điểm nào được đề xuất thành công.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {proposals.map((prop) => (
        <UserProfileProposalCard key={`prop-${prop.id}`} proposal={prop} />
      ))}
    </div>
  )
}
