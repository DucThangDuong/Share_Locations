import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileTravelMap } from '../UserProfileTravelMap'
import type {
  UserMapPlaceDto,
  UserReviewItem,
  VisitLogItem,
  ProposalItem
} from '@/types/models/userProfile.model'

interface UserProfileActivityTabProps {
  userId: number | string
  userName: string
}

export const UserProfileActivityTab: React.FC<UserProfileActivityTabProps> = ({
  userId,
  userName
}) => {
  const [mapPlaces, setMapPlaces] = useState<UserMapPlaceDto[]>([])
  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLogItem[]>([])
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchMapPoints = async () => {
      setLoading(true)
      try {
        const [mapRes, reviewsRes, logsRes, propsRes] = await Promise.allSettled([
          userService.getUserMapPlaces(userId),
          userService.getUserPublicReviews(userId, { pageSize: 50 }),
          userService.getUserPublicVisitLogs(userId, { pageSize: 50 }),
          userService.getUserPublicProposals(userId, { pageSize: 50 })
        ])

        if (!isMounted) return

        if (mapRes.status === 'fulfilled' && mapRes.value?.data) {
          const list = Array.isArray(mapRes.value.data)
            ? mapRes.value.data
            : (mapRes.value.data as any).items || []
          setMapPlaces(list)
        }

        if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.data) {
          const list = Array.isArray(reviewsRes.value.data)
            ? reviewsRes.value.data
            : (reviewsRes.value.data as any).items || []
          setReviews(list)
        }

        if (logsRes.status === 'fulfilled' && logsRes.value?.data) {
          const list = Array.isArray(logsRes.value.data)
            ? logsRes.value.data
            : (logsRes.value.data as any).items || []
          setVisitLogs(list)
        }

        if (propsRes.status === 'fulfilled' && propsRes.value?.data) {
          const list = Array.isArray(propsRes.value.data)
            ? propsRes.value.data
            : (propsRes.value.data as any).items || []
          setProposals(list)
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
      mapPlaces={mapPlaces}
      reviews={reviews}
      visitLogs={visitLogs}
      proposals={proposals}
    />
  )
}
