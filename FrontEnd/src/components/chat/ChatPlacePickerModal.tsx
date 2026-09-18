import React, { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { placeService } from '@/services/placeService'
import type { PlaceSummaryDto } from '@/types/models/place.model'

interface ChatPlacePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlace: (place: PlaceSummaryDto) => void
}

export const ChatPlacePickerModal: React.FC<ChatPlacePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectPlace,
}) => {
  const [placeSearchQuery, setPlaceSearchQuery] = useState('')
  const [foundPlaces, setFoundPlaces] = useState<PlaceSummaryDto[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const fetchPlaces = async () => {
      setIsLoadingPlaces(true)
      try {
        const res = await placeService.searchPlaces({
          keyword: placeSearchQuery.trim() || undefined,
          pageSize: 8,
        })
        setFoundPlaces(res.data || [])
      } catch {
        setFoundPlaces([])
      } finally {
        setIsLoadingPlaces(false)
      }
    }
    const timeout = setTimeout(fetchPlaces, 300)
    return () => clearTimeout(timeout)
  }, [isOpen, placeSearchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">Chọn địa điểm để chia sẻ</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm địa điểm du lịch, ẩm thực..."
              value={placeSearchQuery}
              onChange={(e) => setPlaceSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-1">
          {isLoadingPlaces ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Đang tìm địa điểm...</span>
            </div>
          ) : foundPlaces.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">Không tìm thấy địa điểm nào</div>
          ) : (
            foundPlaces.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPlace(p)}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-colors cursor-pointer"
              >
                <img
                  src={
                    p.thumbnailUrl ||
                    p.mediaUrls?.[0] ||
                    'https://images.unsplash.com/photo-1527997921830-de1cf1f9b430?w=200&h=200&fit=crop'
                  }
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{p.address || p.provinceName}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-amber-600 font-semibold">
                    <span>⭐ {p.avgRating?.toFixed(1) || '5.0'}</span>
                    <span className="text-slate-400">· {p.categoryName || 'Địa điểm'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPlacePickerModal
