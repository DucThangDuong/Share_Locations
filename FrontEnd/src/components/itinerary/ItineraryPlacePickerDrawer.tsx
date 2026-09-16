import React, { useState } from 'react'
import {
  X,
  Search,
  Plus,
  Compass,
  MapPin
} from 'lucide-react'
import type { TransportType } from '@/types/models/itinerary.model'

interface PlaceItem {
  id: number
  name: string
  location: string
  category: string
  rating?: number
  price?: string
  priceMax?: number
  image?: string
  desc?: string
}

interface ItineraryPlacePickerDrawerProps {
  isOpen: boolean
  dayNumber: number
  placesList: PlaceItem[]
  onClose: () => void
  onAddPlace: (place: PlaceItem) => void
  onAddCustomStop: (stopData: {
    name: string
    category: string
    address: string
    cost: number
    startTime: string
    endTime: string
    transportMode: TransportType
    note: string
  }) => void
}

const CATEGORIES = ['Tất cả', 'Ăn uống', 'Du lịch', 'Cà phê', 'Lưu trú']
const TRANSPORT_OPTIONS: TransportType[] = ['Xe máy', 'Ô tô', 'Đi bộ', 'Taxi', 'Xe buýt', 'Tàu hỏa', 'Máy bay']

export const ItineraryPlacePickerDrawer: React.FC<ItineraryPlacePickerDrawerProps> = ({
  isOpen,
  dayNumber,
  placesList,
  onClose,
  onAddPlace,
  onAddCustomStop
}) => {
  const [tab, setTab] = useState<'library' | 'custom'>('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')

  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:30')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Tham quan')
  const [address, setAddress] = useState('')
  const [cost, setCost] = useState('50000')
  const [transportMode, setTransportMode] = useState<TransportType>('Xe máy')
  const [note, setNote] = useState('')

  if (!isOpen) return null

  const filteredPlaces = placesList.filter((p) => {
    const q = searchQuery.toLowerCase().trim()
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    const matchC =
      selectedCategory === 'Tất cả' ||
      p.category.toLowerCase().includes(selectedCategory.toLowerCase())
    return matchQ && matchC
  })

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAddCustomStop({
      name: name.trim(),
      category,
      address: address.trim(),
      cost: parseInt(cost, 10) || 0,
      startTime,
      endTime,
      transportMode,
      note: note.trim()
    })
    setName('')
    setAddress('')
    setNote('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Thêm điểm dừng vào Ngày {dayNumber}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn điểm đến nổi tiếng từ thư viện hoặc tự nhập điểm dừng mới
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              tab === 'library'
                ? 'text-emerald-800 border-b-2 border-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Thư viện địa điểm ({placesList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              tab === 'custom'
                ? 'text-emerald-800 border-b-2 border-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tự nhập điểm dừng
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'library' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm địa điểm trong kho dữ liệu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-800 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {filteredPlaces.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Compass size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">Không tìm thấy địa điểm phù hợp.</p>
                  </div>
                ) : (
                  filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={place.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop'}
                          alt={place.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {place.name}
                            </h4>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {place.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{place.location}</span>
                          </p>
                          {place.price && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{place.price}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddPlace(place)}
                        className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Plus size={14} />
                        <span>Thêm</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên điểm đến *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Quán Cà Phê Tổ Chim"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  >
                    <option value="Tham quan">Tham quan & Di tích</option>
                    <option value="Ăn uống">Ăn uống / Ẩm thực</option>
                    <option value="Cà phê">Cà phê & Check-in</option>
                    <option value="Nghỉ ngơi">Nghỉ ngơi / Khách sạn</option>
                    <option value="Trải nghiệm">Trải nghiệm / Hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chi phí (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Di chuyển
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as TransportType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  >
                    {TRANSPORT_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  placeholder="VD: 12 Đường 3/4, Phường 3, TP. Đà Lạt"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú điểm dừng
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú kinh nghiệm, món nên thử hoặc góc chụp ảnh đẹp..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Thêm vào lịch trình
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItineraryPlacePickerDrawer
