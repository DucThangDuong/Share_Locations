import React, { useEffect, useState } from 'react'
import { Compass, Loader2 } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileTripCard } from '../UserProfileTripCard'
import type { UserTripSummaryDto } from '@/types/models/trip.model'

interface UserProfileTripsTabProps {
  userId: number | string
}

export const UserProfileTripsTab: React.FC<UserProfileTripsTabProps> = ({ userId }) => {
  const [trips, setTrips] = useState<UserTripSummaryDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchTrips = async () => {
      setLoading(true)
      try {
        const res = await userService.getUserPublicTrips(userId, { pageSize: 15 })
        if (isMounted && res?.data) {
          const list = Array.isArray(res.data) ? (res.data as any) : (res.data as any).items || []
          setTrips(list)
        }
      } catch (err) {
        console.error('Failed to load trips:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTrips()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-slate-200/90 shadow-2xs">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang tải danh sách chuyến đi...</span>
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-800">Chưa có chuyến đi công khai</div>
        <p className="text-xs text-slate-500 mt-1">Người dùng chưa tạo hành trình công khai nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {trips.map((trip) => (
        <UserProfileTripCard key={`trip-${trip.id}`} trip={trip} />
      ))}
    </div>
  )
}
