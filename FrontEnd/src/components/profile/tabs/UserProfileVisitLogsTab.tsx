import React, { useEffect, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileVisitLogCard } from '../UserProfileVisitLogCard'
import type { VisitLogItem } from '@/types/models/userProfile.model'

interface UserProfileVisitLogsTabProps {
  userId: number | string
}

export const UserProfileVisitLogsTab: React.FC<UserProfileVisitLogsTabProps> = ({ userId }) => {
  const [logs, setLogs] = useState<VisitLogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const res = await userService.getUserPublicVisitLogs(userId, { pageSize: 15 })
        if (isMounted && res?.data) {
          const list = Array.isArray(res.data) ? (res.data as any) : (res.data as any).items || []
          setLogs(list)
        }
      } catch (err) {
        console.error('Failed to load visit logs:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchLogs()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-slate-200/90 shadow-2xs">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang tải nhật ký điểm đến...</span>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-800">Chưa có nhật ký điểm đến</div>
        <p className="text-xs text-slate-500 mt-1">Chưa có địa điểm nào được ghi nhận.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <UserProfileVisitLogCard key={`log-${log.id}`} log={log} />
      ))}
    </div>
  )
}
