import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileTravelMap } from '../UserProfileTravelMap'
import type { UserReviewItem } from '@/types/models/userProfile.model'

interface UserProfileActivityTabProps {
  userId: number | string
  userName: string
}

export const UserProfileActivityTab: React.FC<UserProfileActivityTabProps> = ({
  userId,
  userName
}) => {
  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchMapPoints = async () => {
      setLoading(true)
      try {
        const res = await userService.getUserPublicReviews(userId, { pageSize: 20 })
        if (isMounted && res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).items || []
          setReviews(list)
        }
      } catch (err) {
        console.error('Failed to load map points:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMapPoints()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-slate-200/90 shadow-2xs">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang tải bản đồ hoạt động...</span>
      </div>
    )
  }

  return (
    <UserProfileTravelMap
      userName={userName}
      reviews={reviews}
    />
  )
}
