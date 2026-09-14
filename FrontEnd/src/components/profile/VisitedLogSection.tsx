import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapPin,
  Globe,
  Lock,
  Plus,
  Compass,
  X,
  Trash2,
  Edit3,
  Map as MapIcon,
  LayoutGrid,
  Search,
  Check
} from 'lucide-react'
import type { VisitLogItem, CreateVisitLogRequest, UpdateVisitLogRequest } from '@/types/models/userProfile.model'
import { placeService } from '@/services/placeService'
import type { PlaceSummaryDto } from '@/types/models/place.model'
import { VisitedLogMap } from './VisitedLogMap'

interface VisitedLogSectionProps {
  logs: VisitLogItem[]
  onAddLog: (data: CreateVisitLogRequest) => Promise<void> | void
  onUpdateLog?: (id: number, data: UpdateVisitLogRequest) => Promise<void> | void
  onDeleteLog?: (id: number) => Promise<void> | void
  onTogglePrivacy?: (id: number, newPrivacy: number) => Promise<void> | void
  onSelectPlace?: (placeName: string) => void
}

interface VisitedLogCardProps {
  log: VisitLogItem
  onSelect: (log: VisitLogItem) => void
  onEdit: (log: VisitLogItem) => void
  onDelete?: (id: number) => void
  onTogglePrivacy?: (id: number, newPrivacy: number) => void
}

const VisitedLogCard: React.FC<VisitedLogCardProps> = ({
  log,
  onSelect,
  onEdit,
  onDelete,
  onTogglePrivacy
}) => {
  return (
    <div
      onClick={() => onSelect(log)}
      className="group flex flex-col cursor-pointer select-none transition-all duration-300"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
        {log.coverImg ? (
          <img
            src={log.coverImg}
            alt={log.placeName}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <Compass className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

        <div className="absolute top-3 right-3 z-10">
          {onTogglePrivacy ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePrivacy(log.id, log.privacy === 1 ? 0 : 1)
              }}
              className={`p-1.5 rounded-full backdrop-blur-xs shadow-xs transition-transform active:scale-95 cursor-pointer ${log.privacy === 1
                ? 'bg-slate-900/80 hover:bg-slate-900 text-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              title={log.privacy === 1 ? 'Chỉ mình tôi (Bấm để đổi sang Công khai)' : 'Công khai (Bấm để đổi sang Riêng tư)'}
            >
              {log.privacy === 1 ? <Lock size={13} /> : <Globe size={13} />}
            </button>
          ) : (
            <span className="p-1.5 rounded-full bg-slate-950/70 backdrop-blur-xs text-white shadow-xs">
              {log.privacy === 1 ? <Lock size={13} /> : <Globe size={13} />}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 flex flex-col space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight flex-1">
            {log.placeName}
          </h4>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(log)
              }}
              title="Chỉnh sửa nhật ký"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit3 size={13} />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(log.id)
                }}
                title="Xóa nhật ký"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span>Ghé thăm ngày:</span>
          <span className="text-emerald-800 font-bold">{log.visitedDate}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate font-normal">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{log.province || 'Chưa rõ tỉnh thành'}</span>
          {log.category && (
            <>
              <span>·</span>
              <span className="truncate">{log.category}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export const VisitedLogSection: React.FC<VisitedLogSectionProps> = ({
  logs,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  onTogglePrivacy,
  onSelectPlace
}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const viewParam = searchParams.get('view')
  const viewMode: 'list' | 'map' = viewParam === 'map' ? 'map' : 'list'

  const privacyParam = searchParams.get('privacy')
  const privacyFilter: 'all' | 0 | 1 =
    privacyParam === 'public' || privacyParam === '0'
      ? 0
      : privacyParam === 'private' || privacyParam === '1'
        ? 1
        : 'all'

  const setViewMode = (mode: 'list' | 'map') => {
    const newParams = new URLSearchParams(searchParams)
    if (mode === 'list') {
      newParams.delete('view')
    } else {
      newParams.set('view', 'map')
    }
    setSearchParams(newParams, { replace: true })
  }

  const setPrivacyFilter = (p: 'all' | 0 | 1) => {
    const newParams = new URLSearchParams(searchParams)
    if (p === 'all') {
      newParams.delete('privacy')
    } else if (p === 0) {
      newParams.set('privacy', 'public')
    } else {
      newParams.set('privacy', 'private')
    }
    setSearchParams(newParams, { replace: true })
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchPlaceQuery, setSearchPlaceQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceSummaryDto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceSummaryDto | null>(null)
  const [visitedDate, setVisitedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [privacy, setPrivacy] = useState<0 | 1>(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingLog, setEditingLog] = useState<VisitLogItem | null>(null)
  const [editVisitedDate, setEditVisitedDate] = useState('')
  const [editPrivacy, setEditPrivacy] = useState<0 | 1>(0)
  const [editErrorMsg, setEditErrorMsg] = useState('')

  const filteredLogs = logs.filter((log) => {
    return privacyFilter === 'all' || log.privacy === privacyFilter
  })

  useEffect(() => {
    if (!searchPlaceQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await placeService.searchPlaces({ keyword: searchPlaceQuery.trim(), pageSize: 6 })
        if (res.success && res.data) {
          setSearchResults(res.data)
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchPlaceQuery])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlace) {
      setErrorMsg('Vui lòng tìm kiếm và chọn một địa điểm cụ thể.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      await onAddLog({
        placeId: selectedPlace.id,
        visitedDate: visitedDate || new Date().toISOString().split('T')[0],
        privacy
      })
      setIsAddModalOpen(false)
      setSelectedPlace(null)
      setSearchPlaceQuery('')
    } catch {
      setErrorMsg('Có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (item: VisitLogItem) => {
    setEditingLog(item)
    setEditVisitedDate(item.visitedDate || '')
    setEditPrivacy(item.privacy ?? 0)
    setEditErrorMsg('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return

    setIsSubmitting(true)
    setEditErrorMsg('')
    try {
      if (onUpdateLog) {
        await onUpdateLog(editingLog.id, {
          visitedDate: editVisitedDate || editingLog.visitedDate,
          privacy: editPrivacy
        })
      }
      setEditingLog(null)
    } catch {
      setEditErrorMsg('Có lỗi xảy ra khi cập nhật nhật ký.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePlaceClick = (log: VisitLogItem) => {
    if (log.placeId) {
      navigate(`/places/${log.placeId}`)
    } else if (onSelectPlace) {
      onSelectPlace(log.placeName)
    } else {
      navigate(`/explore?q=${encodeURIComponent(log.placeName)}`)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'list'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <LayoutGrid size={13} />
              <span>Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'map'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <MapIcon size={13} />
              <span>Bản đồ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg('')
              setSelectedPlace(null)
              setSearchPlaceQuery('')
              setIsAddModalOpen(true)
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Ghi nhận điểm đến</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          <button
            type="button"
            onClick={() => setPrivacyFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${privacyFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            Tất cả ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setPrivacyFilter(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${privacyFilter === 0
              ? 'bg-emerald-800 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            <Globe size={12} />
            <span>Công khai ({logs.filter((l) => l.privacy === 0).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setPrivacyFilter(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${privacyFilter === 1
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            <Lock size={12} />
            <span>Chỉ mình tôi ({logs.filter((l) => l.privacy === 1).length})</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <VisitedLogMap logs={filteredLogs} onSelectPlace={(log) => onSelectPlace?.(log.placeName)} />
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Compass size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Chưa có nhật ký chuyến đi nào
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Hãy bắt đầu lưu lại các địa điểm du lịch, danh lam thắng cảnh bạn đã từng đặt chân tới.
          </p>
          <button
            type="button"
            onClick={() => {
              setErrorMsg('')
              setSelectedPlace(null)
              setSearchPlaceQuery('')
              setIsAddModalOpen(true)
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Ghi nhận điểm đến đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredLogs.map((log) => (
            <VisitedLogCard
              key={log.id}
              log={log}
              onSelect={handlePlaceClick}
              onEdit={openEditModal}
              onDelete={onDeleteLog}
              onTogglePrivacy={onTogglePrivacy}
            />
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Compass size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ghi nhận điểm đến đã ghé</h3>
                  <p className="text-[11px] text-slate-500">Lưu lại dấu chân trên hành trình khám phá</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tìm và chọn địa điểm *
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nhập tên địa điểm để tìm..."
                    value={searchPlaceQuery}
                    onChange={(e) => setSearchPlaceQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                  />
                </div>

                {isSearching && (
                  <div className="text-[11px] text-slate-400 mt-1">Đang tìm địa điểm...</div>
                )}

                {searchResults.length > 0 && !selectedPlace && (
                  <div className="mt-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-sm">
                    {searchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPlace(p)
                          setSearchPlaceQuery(p.name)
                        }}
                        className="p-2.5 hover:bg-emerald-50/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {(p.thumbnailUrl || p.mediaUrls?.[0]) ? (
                            <img src={p.thumbnailUrl || p.mediaUrls?.[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <MapPin size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{p.provinceName || p.address}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50">Chọn</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPlace && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">{selectedPlace.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(null)
                        setSearchPlaceQuery('')
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Đổi địa điểm
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày ghé thăm *
                </label>
                <input
                  type="date"
                  value={visitedDate}
                  onChange={(e) => setVisitedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={privacy === 1}
                    onChange={(e) => setPrivacy(e.target.checked ? 1 : 0)}
                    className="rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>Chỉ mình tôi thấy (Riêng tư)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPlace}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu điểm đến'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Chỉnh sửa điểm đến đã ghé</h3>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa điểm
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-800 font-bold">
                  {editingLog.placeName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày ghé thăm
                </label>
                <input
                  type="date"
                  value={editVisitedDate}
                  onChange={(e) => setEditVisitedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editPrivacy === 1}
                    onChange={(e) => setEditPrivacy(e.target.checked ? 1 : 0)}
                    className="rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>Chỉ mình tôi thấy (Riêng tư)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
