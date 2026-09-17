import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Search,
  Plus,
  ArrowRight,
  Trash2,
  Lock,
  Globe,
  Clock,
  X
} from 'lucide-react'
import { tripService } from '@/services/tripService'
import type { UserTripSummaryDto } from '@/types/models/trip.model'

type TripStatusFilter = 'all' | 'published' | 'private'

interface DisplayTripItem {
  id: number
  title: string
  province: string
  region: string
  durationDays: number
  nightsCount: number
  estimatedBudget: number
  privacy: number
  description: string
  totalStops: number
  tags: string[]
}

export const UserTripsSection: React.FC = () => {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<DisplayTripItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TripStatusFilter>('all')

  const fetchTrips = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await tripService.getUserTrips({ pageSize: 50 })
      if (res.success && res.data) {
        const rawItems: UserTripSummaryDto[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.items)
            ? res.data.items
            : []

        const mapped: DisplayTripItem[] = rawItems.map((t) => ({
          id: Number(t.id),
          title: t.title,
          province: t.province || 'Việt Nam',
          region: t.region || 'Điểm đến',
          durationDays: t.durationDays || 1,
          nightsCount: t.nightsCount || 0,
          estimatedBudget: Number(t.estimatedBudget || 0),
          privacy: t.privacy,
          description: t.description || '',
          totalStops: t.totalStopsCount || 0,
          tags: []
        }))
        setTrips(mapped)
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

  const filteredTrips = useMemo(() => {
    return trips.filter((it) => {
      if (statusFilter === 'published' && it.privacy !== 0) return false
      if (statusFilter === 'private' && it.privacy === 0) return false

      const q = searchQuery.toLowerCase().trim()
      if (!q) return true

      return (
        it.title.toLowerCase().includes(q) ||
        it.province.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [trips, statusFilter, searchQuery])

  const handleDeleteTrip = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyến đi này?')) return
    try {
      const res = await tripService.deleteTrip(id)
      if (res.success) {
        setTrips((prev) => prev.filter((t) => t.id !== id))
      } else {
        setTrips((prev) => prev.filter((t) => t.id !== id))
      }
    } catch {
      setTrips((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const handleCreateNewTrip = async () => {
    try {
      const res = await tripService.createTrip({
        title: 'Chuyến đi mới của tôi',
        description: 'Lịch trình du lịch tự túc.',
        privacy: 1,
        days: [
          {
            dayNumber: 1,
            dayTitle: 'Ngày 1: Khởi hành & Check-in',
            stops: []
          }
        ]
      })

      if (res.success && res.data?.id) {
        navigate(`/itinerary/${res.data.id}`)
      }
    } catch {
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'all'
              ? 'bg-emerald-800 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
          >
            Tất cả ({trips.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'published'
              ? 'bg-emerald-800 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
          >
            Đã công khai ({trips.filter((t) => t.privacy === 0).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('private')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'private'
              ? 'bg-emerald-800 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
          >
            Riêng tư ({trips.filter((t) => t.privacy !== 0).length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Tìm chuyến đi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateNewTrip}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Tạo chuyến đi</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải danh sách chuyến đi...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <Compass size={40} className="text-slate-300 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            Chưa có chuyến đi nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Lên kế hoạch cho kỳ nghỉ sắp tới hoặc khám phá các lịch trình mẫu từ cộng đồng.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCreateNewTrip}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Tạo chuyến đi mới
            </button>
            <button
              type="button"
              onClick={() => navigate('/itinerary')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Khám phá lịch trình
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => navigate(`/itinerary/${trip.id}`)}
              className="group bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-600/70 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 border ${trip.privacy === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      {trip.privacy === 0 ? (
                        <>
                          <Globe size={10} /> Công khai
                        </>
                      ) : (
                        <>
                          <Lock size={10} /> Riêng tư
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa chuyến đi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                    {trip.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                    {trip.description}
                  </p>
                </div>

                {trip.tags && trip.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {trip.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-semibold flex-wrap">
                  <Clock size={13} className="text-slate-400" />
                  <span>{trip.durationDays}N{trip.nightsCount}Đ</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">{trip.totalStops} điểm dừng</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-emerald-800">
                    {trip.estimatedBudget.toLocaleString('vi-VN')} đ
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate(`/itinerary/${trip.id}`)}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lập kế hoạch</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserTripsSection
