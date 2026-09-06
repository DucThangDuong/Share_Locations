import { useState, useEffect } from 'react'
import { Compass, Search, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { itineraryService } from '@/services/itineraryService'
import { ItineraryAuthGate } from '@/components/itinerary/ItineraryAuthGate'
import { ItineraryCard } from '@/components/itinerary/ItineraryCard'
import type { ItineraryDto } from '@/types/models/place.model'

const DURATIONS = [
  { id: 'all', label: 'Tất cả thời lượng' },
  { id: '1_day', label: '⚡ 1 Ngày' },
  { id: '2d1n', label: '🏖️ 2 Ngày 1 Đêm' },
  { id: '3d2n', label: '🏞️ 3 Ngày 2 Đêm' },
  { id: '4d3n', label: '✈️ 4 Ngày 3 Đêm' }
]

export const ItineraryPage = () => {
  const { isAuthenticated } = useAuth()
  const [itineraries, setItineraries] = useState<ItineraryDto[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<string>('all')
  const [searchKey, setSearchKey] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchItineraries = async () => {
      setLoading(true)
      try {
        const res = await itineraryService.getItineraries({
          duration: selectedDuration !== 'all' ? selectedDuration : undefined,
          keyword: searchKey.trim() || undefined
        })
        if (res.success && res.data) {
          setItineraries(res.data)
          if (res.data.length > 0 && expandedId === null) {
            setExpandedId(res.data[0].id)
          }
        }
      } catch {
        setItineraries([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchItineraries, 300)
    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, selectedDuration, searchKey])

  const handleSaveItinerary = async (id: number) => {
    try {
      const res = await itineraryService.saveItinerary(id)
      if (res.success) {
        setSavedStatus((prev) => ({ ...prev, [id]: true }))
        alert('Đã lưu lịch trình vào bộ sưu tập cá nhân!')
      }
    } catch {
      alert('Không thể lưu lịch trình lúc này.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="relative bg-emerald-900 text-white overflow-hidden py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-800/80 border border-emerald-700 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Kế Hoạch Du Lịch Tự Túc</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Lịch Trình Khám Phá Việt Nam Từng Bước
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Các lộ trình du lịch được thiết kế tối ưu hóa thời gian và chi phí, kèm điểm ăn chơi, phương tiện di chuyển và mẹo hữu ích cho từng ngày.
          </p>

          {isAuthenticated && (
            <div className="max-w-xl mx-auto pt-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="Tìm lịch trình theo điểm đến (ví dụ: Đà Nẵng, Sa Pa, Phú Quốc)..."
                  className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-sm rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <ItineraryAuthGate />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 space-y-8">
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5">
              {DURATIONS.map((dur) => (
                <button
                  key={dur.id}
                  onClick={() => setSelectedDuration(dur.id)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    selectedDuration === dur.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>Lịch Trình Đề Xuất ({itineraries.length})</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Lộ trình mẫu chi tiết được biên soạn bởi thổ địa và chuyên gia</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm">Đang tải lịch trình tối ưu...</p>
              </div>
            ) : itineraries.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <Compass className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Không tìm thấy lịch trình phù hợp.</p>
                <p className="text-xs text-gray-400 mt-1">Hãy thử thay đổi thời lượng hoặc từ khóa tìm kiếm.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {itineraries.map((itinerary) => (
                  <ItineraryCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    isExpanded={expandedId === itinerary.id}
                    isSaved={!!savedStatus[itinerary.id]}
                    onToggleExpand={() => setExpandedId(expandedId === itinerary.id ? null : itinerary.id)}
                    onSave={handleSaveItinerary}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
