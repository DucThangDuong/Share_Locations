import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Luggage,
  Search,
  X,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Lock,
  Globe,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { tripService } from '@/services/tripService'
import type { UserTripSummaryDto } from '@/types/models/trip.model'
import type { PagedResultDto } from '@/types/models/userProfile.model'

interface TripsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
  onToast?: (msg: string) => void
}

export const TripsUtility: React.FC<TripsUtilityProps> = ({
  isDrawer = false,
  onClose,
  onToast
}) => {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<UserTripSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTrips = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await tripService.getUserTrips({ pageSize: 50 })
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setTrips(res.data)
        } else if (Array.isArray((res.data as PagedResultDto<UserTripSummaryDto>).items)) {
          setTrips((res.data as PagedResultDto<UserTripSummaryDto>).items)
        } else {
          setTrips([])
        }
      } else {
        setTrips([])
      }
    } catch {
      setTrips([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const handleDeleteTrip = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyến đi này?')) return
    try {
      const res = await tripService.deleteTrip(Number(id))
      if (res.success) {
        setTrips((prev) => prev.filter((t) => Number(t.id) !== Number(id)))
        onToast?.('Đã xóa chuyến đi thành công.')
      } else {
        onToast?.('Không thể xóa chuyến đi lúc này.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi xóa chuyến đi.')
    }
  }

  // Navigate directly to the trip planner / editor
  const handleSelectTrip = (id: string | number) => {
    onClose?.()
    navigate(`/itinerary/${id}`)
  }

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips
    const q = searchQuery.toLowerCase().trim()
    return trips.filter((t) =>
      t.title?.toLowerCase().includes(q) ||
      t.province?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    )
  }, [trips, searchQuery])

  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNewTrip = async () => {
    setIsCreating(true)
    try {
      const res = await tripService.createTrip({
        title: 'Chuyến đi mới của tôi',
        description: 'Lên kế hoạch chuyến đi mới',
        privacy: 1,
        days: [
          {
            dayNumber: 1,
            dayTitle: 'Ngày 1: Bắt đầu hành trình'
          }
        ]
      })
      if (res.success && res.data?.id) {
        onClose?.()
        navigate(`/itinerary/${res.data.id}`)
        return
      }
    } catch {
    } finally {
      setIsCreating(false)
    }
    onClose?.()
    navigate('/itinerary?mode=create')
  }

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top Search and Create Action */}
      <div className={`flex items-center justify-between gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm chuyến đi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={isCreating}
          onClick={handleCreateNewTrip}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          <span>{isCreating ? 'Đang tạo...' : 'Tạo chuyến'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-emerald-800" />
            <span className="text-xs">Đang tải danh sách chuyến đi...</span>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <Luggage size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có chuyến đi nào phù hợp</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Lên kế hoạch cho chuyến hành trình khám phá các điểm đến tuyệt đẹp của Việt Nam ngay!
            </p>
            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreateNewTrip}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-800 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>{isCreating ? 'Đang tạo...' : 'Lên lịch trình ngay'}</span>
            </button>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Clean Layout (No Fake Cover Photos) */
          <div className="space-y-2.5">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleSelectTrip(trip.id)}
                className="group relative flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs bg-white"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-100/80 transition-colors">
                  <Luggage size={20} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-800 transition-colors">
                    {trip.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    <span>
                      {trip.startDate ? new Date(trip.startDate).toLocaleDateString('vi-VN') : 'Chưa định ngày'}
                    </span>
                    {trip.province && (
                      <>
                        <span className="mx-0.5">·</span>
                        <MapPin size={11} />
                        <span>{trip.province}</span>
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteTrip(e, trip.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa chuyến đi"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Full Page Clean Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleSelectTrip(trip.id)}
                className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-100">
                      <Luggage size={24} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${trip.status === 1
                          ? 'bg-emerald-50 text-emerald-800'
                          : trip.status === 2
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-blue-50 text-blue-800'
                          }`}
                      >
                        {trip.status === 0 ? 'Đang lên kế hoạch' : trip.status === 1 ? 'Đang đi' : 'Hoàn thành'}
                      </span>
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs">
                        {trip.privacy === 1 ? <Lock size={12} /> : <Globe size={12} />}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrip(e, trip.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa chuyến đi"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-1">
                      {trip.title}
                    </h4>
                    {trip.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {trip.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{trip.durationDays || 1} ngày {trip.nightsCount ? `· ${trip.nightsCount} đêm` : ''}</span>
                    </span>
                    {trip.province && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{trip.province}</span>
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-blue-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Chỉnh sửa lịch trình</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TripsUtility
