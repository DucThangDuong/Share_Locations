import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { tripService } from '@/services/tripService'
import { useAuth } from '@/context/AuthContext'
import { ItineraryQuickPreviewModal } from '@/components/itinerary/ItineraryQuickPreviewModal'
import type { UserTripSummaryDto } from '@/types/models/trip.model'
import type { DetailedItineraryItem } from '@/types/models/itinerary.model'

interface UserProfileTripCardProps {
  trip: UserTripSummaryDto
}

export const UserProfileTripCard: React.FC<UserProfileTripCardProps> = ({ trip }) => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [previewTrip, setPreviewTrip] = useState<DetailedItineraryItem | null>(null)

  const coverImage =
    trip.coverImageUrl ||
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=300&fit=crop'

  const formatDuration = (days?: number, nights?: number) => {
    const d = days && days > 0 ? days : 1
    const n = nights !== undefined && nights !== null ? nights : Math.max(0, d - 1)
    if (n === 0) return `${d} ngày`
    return `${d} ngày ${n} đêm`
  }

  const handleOpenPreview = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    setIsLoading(true)

    try {
      const res = await tripService.getTripDetail(trip.id)
      if (res.success && res.data) {
        const detail = res.data
        const totalCost = detail.estimatedBudget || detail.budgetTarget ||
          (detail.days || []).reduce((sum, d) => sum + (d.stops || []).reduce((sSum, s) => sSum + (s.estimatedCost || 0), 0), 0)

        const detailed: DetailedItineraryItem = {
          id: detail.id,
          title: detail.title,
          slug: `trip-${detail.id}`,
          province: detail.province || trip.province || 'Việt Nam',
          region: detail.region || trip.region || 'Miền Bắc',
          durationDays: detail.durationDays || trip.durationDays || (detail.days?.length || 1),
          nightsCount: detail.nightsCount ?? trip.nightsCount ?? Math.max(0, (detail.durationDays || detail.days?.length || 1) - 1),
          estimatedBudget: totalCost,
          privacy: ((detail.privacy ?? trip.privacy ?? 1) as 0 | 1 | 2),
          coverImg: detail.coverImageUrl || trip.coverImageUrl || '',
          authorName: currentUser?.fullName || 'Bạn',
          authorAvatar: currentUser?.avatarUrl,
          description: detail.description || trip.description || 'Lịch trình chuyến đi chi tiết.',
          days: (detail.days || []).map((d, dIdx) => ({
            dayNumber: d.dayNumber || dIdx + 1,
            title: d.dayTitle || `Ngày ${d.dayNumber || dIdx + 1}`,
            description: '',
            stops: (d.stops || []).map((s, sIdx) => ({
              id: `stop-${s.id || sIdx}`,
              time: s.startTime || '08:00',
              startTime: s.startTime || '08:00',
              endTime: s.endTime || '',
              name: s.name,
              category: s.category || 'Điểm tham quan',
              address: s.address || '',
              note: s.note || '',
              costEstimate: s.estimatedCost || 0,
              duration: '',
              transportMode: ((s.transportMode as any) || 'Xe máy'),
              visitOrder: s.visitOrder || sIdx + 1
            }))
          })),
          createdAt: detail.startDate || trip.createdAt || new Date().toISOString()
        }
        setPreviewTrip(detailed)
      } else {
        // Fallback preview
        setPreviewTrip({
          id: trip.id,
          title: trip.title,
          slug: `trip-${trip.id}`,
          province: trip.province || 'Việt Nam',
          region: trip.region || 'Miền Bắc',
          durationDays: trip.durationDays || 1,
          nightsCount: trip.nightsCount ?? Math.max(0, (trip.durationDays || 1) - 1),
          estimatedBudget: trip.estimatedBudget || 0,
          privacy: ((trip.privacy ?? 1) as 0 | 1 | 2),
          coverImg: trip.coverImageUrl || '',
          authorName: currentUser?.fullName || 'Bạn',
          authorAvatar: currentUser?.avatarUrl,
          description: trip.description || 'Lịch trình chuyến đi chi tiết.',
          days: [
            {
              dayNumber: 1,
              title: 'Ngày 1: Khám phá',
              description: '',
              stops: []
            }
          ],
          createdAt: trip.createdAt || new Date().toISOString()
        })
      }
    } catch {
      navigate(`/itinerary/${trip.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div
        onClick={handleOpenPreview}
        className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col sm:flex-row cursor-pointer"
      >
        <div className="relative w-full sm:w-48 md:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-slate-100">
          <img
            src={coverImage}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
              {trip.province && (
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  <MapPin size={12} />
                  {trip.province}
                </span>
              )}
              {trip.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(trip.createdAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1.5">
              {trip.title}
            </h3>

            {trip.description && (
              <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
                {trip.description}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-amber-500" />
                {trip.totalStopsCount || 0} điểm dừng
              </span>
              <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <Clock size={13} className="text-emerald-700" />
                <span>{formatDuration(trip.durationDays, trip.nightsCount)}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenPreview}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:text-emerald-800 group-hover:translate-x-0.5 transition-all cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin text-emerald-700" />
              ) : (
                <>
                  <span>Xem hành trình</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Itinerary Quick Preview Modal */}
      {previewTrip && (
        <ItineraryQuickPreviewModal
          itinerary={previewTrip}
          actionLabel="Chỉnh sửa lịch trình"
          onClose={() => setPreviewTrip(null)}
          onApply={(item) => {
            setPreviewTrip(null)
            navigate(`/itinerary/${item.id}`)
          }}
        />
      )}
    </>
  )
}

export default UserProfileTripCard
