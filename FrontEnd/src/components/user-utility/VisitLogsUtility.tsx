import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  Search,
  X,
  Plus,
  MapPin,
  Calendar,
  Lock,
  Globe,
  Trash2,
  Edit3,
  Loader2,
  Check,
  Compass
} from 'lucide-react'
import { userService } from '@/services/userService'
import { placeService } from '@/services/placeService'
import type {
  VisitLogItem,
  PagedResultDto
} from '@/types/models/userProfile.model'
import type { PlaceSummaryDto } from '@/types/models/place.model'

interface VisitLogsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
  onToast?: (msg: string) => void
}

type PrivacyFilter = 'all' | 0 | 1

export const VisitLogsUtility: React.FC<VisitLogsUtilityProps> = ({
  isDrawer = false,
  onClose,
  onToast
}) => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<VisitLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Add Log Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchPlaceQuery, setSearchPlaceQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceSummaryDto[]>([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceSummaryDto | null>(null)
  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split('T')[0])
  const [privacy, setPrivacy] = useState<0 | 1>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // Edit Log Modal State
  const [editingLog, setEditingLog] = useState<VisitLogItem | null>(null)
  const [editVisitedDate, setEditVisitedDate] = useState('')
  const [editPrivacy, setEditPrivacy] = useState<0 | 1>(0)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getMyVisitLogs({ pageSize: 50 })
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setLogs(res.data)
        } else if (Array.isArray((res.data as PagedResultDto<VisitLogItem>).items)) {
          setLogs((res.data as PagedResultDto<VisitLogItem>).items)
        } else {
          setLogs([])
        }
      } else {
        setLogs([])
      }
    } catch {
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Debounced search places for Add Modal
  useEffect(() => {
    if (!searchPlaceQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true)
      try {
        const res = await placeService.searchPlaces({ keyword: searchPlaceQuery.trim(), pageSize: 6 })
        if (res.success && res.data) {
          setSearchResults(res.data)
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearchingPlaces(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchPlaceQuery])

  // Add Visit Log Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlace) {
      setModalError('Vui lòng tìm kiếm và chọn một địa điểm cụ thể.')
      return
    }
    setIsSubmitting(true)
    setModalError('')
    try {
      const res = await userService.createVisitLog({
        placeId: selectedPlace.id,
        visitedDate: visitedDate || new Date().toISOString().split('T')[0],
        privacy
      })
      if (res.success && res.data) {
        setLogs((prev) => [res.data, ...prev])
        setIsAddModalOpen(false)
        setSelectedPlace(null)
        setSearchPlaceQuery('')
        onToast?.('Đã thêm nhật ký hành trình mới.')
      } else {
        setModalError(res.message || 'Không thể lưu nhật ký.')
      }
    } catch {
      setModalError('Có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit Visit Log Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return
    setIsSubmitting(true)
    try {
      const res = await userService.updateVisitLog(editingLog.id, {
        visitedDate: editVisitedDate || editingLog.visitedDate,
        privacy: editPrivacy
      })
      if (res.success) {
        setLogs((prev) =>
          prev.map((item) =>
            item.id === editingLog.id
              ? { ...item, visitedDate: editVisitedDate || item.visitedDate, privacy: editPrivacy }
              : item
          )
        )
        setEditingLog(null)
        onToast?.('Đã cập nhật nhật ký chuyến đi.')
      } else {
        onToast?.('Không thể cập nhật nhật ký.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi cập nhật.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Toggle Privacy
  const handleTogglePrivacy = async (e: React.MouseEvent, id: number, currentPrivacy: number) => {
    e.stopPropagation()
    e.preventDefault()
    const newPrivacy = currentPrivacy === 1 ? 0 : 1
    try {
      const res = await userService.changeVisitLogPrivacy(id, newPrivacy)
      if (res.success) {
        setLogs((prev) =>
          prev.map((item) => (item.id === id ? { ...item, privacy: newPrivacy as 0 | 1 } : item))
        )
        onToast?.(newPrivacy === 1 ? 'Đã chuyển sang Riêng tư' : 'Đã chuyển sang Công khai')
      } else {
        onToast?.('Không thể đổi quyền riêng tư.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi đổi quyền riêng tư.')
    }
  }

  // Delete Visit Log
  const handleDeleteLog = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhật ký này?')) return
    try {
      const res = await userService.deleteVisitLog(id)
      if (res.success) {
        setLogs((prev) => prev.filter((item) => item.id !== id))
        onToast?.('Đã xóa nhật ký hành trình.')
      } else {
        onToast?.('Không thể xóa nhật ký.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi xóa.')
    }
  }

  const handleSelectPlace = (log: VisitLogItem) => {
    onClose?.()
    if (log.placeId) {
      navigate(`/places/${log.placeId}`)
    } else {
      navigate(`/explore?q=${encodeURIComponent(log.placeName)}`)
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (privacyFilter !== 'all' && log.privacy !== privacyFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          log.placeName?.toLowerCase().includes(q) ||
          log.province?.toLowerCase().includes(q) ||
          log.category?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [logs, privacyFilter, searchQuery])

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top filter chips and actions */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPrivacyFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              privacyFilter === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Tất cả</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${privacyFilter === 'all' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
              {logs.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPrivacyFilter(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              privacyFilter === 0
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Globe size={12} />
            <span>Công khai</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${privacyFilter === 0 ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
              {logs.filter((l) => l.privacy === 0).length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPrivacyFilter(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              privacyFilter === 1
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lock size={12} />
            <span>Riêng tư</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${privacyFilter === 1 ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
              {logs.filter((l) => l.privacy === 1).length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isDrawer && (
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhật ký đã ghé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setModalError('')
              setSelectedPlace(null)
              setSearchPlaceQuery('')
              setIsAddModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>Ghi nhận điểm đến</span>
          </button>
        </div>
      </div>

      {/* Main Content List */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-emerald-800" />
            <span className="text-xs">Đang tải nhật ký hành trình...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <CalendarCheck size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có nhật ký điểm đến nào</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Ghi lại những địa danh, danh lam thắng cảnh bạn đã từng ghé thăm để lưu giữ kỷ niệm du lịch.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-800 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Ghi nhận điểm đến ngay</span>
            </button>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Layout */
          <div className="space-y-2.5">
            {filteredLogs.map((log) => {
              const coverImg =
                log.coverImg ||
                'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=300&h=200&fit=crop'
              return (
                <div
                  key={log.id}
                  onClick={() => handleSelectPlace(log)}
                  className="group relative flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:shadow-xs bg-white"
                >
                  <img
                    src={coverImg}
                    alt={log.placeName}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/80 group-hover:opacity-80 transition-opacity duration-200"
                  />
                  <div className="flex-1 min-w-0 pr-12">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 mb-1">
                      {log.category || 'Điểm đến'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                      {log.placeName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin size={11} />
                      <span>{log.province || 'Việt Nam'}</span>
                      <span className="mx-1">·</span>
                      <span>{new Date(log.visitedDate).toLocaleDateString('vi-VN')}</span>
                    </p>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePrivacy(e, log.id, log.privacy)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        log.privacy === 1
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      title={log.privacy === 1 ? 'Chuyển sang công khai' : 'Chuyển sang riêng tư'}
                    >
                      {log.privacy === 1 ? <Lock size={12} /> : <Globe size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLog(e, log.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa nhật ký"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLogs.map((log) => {
              const coverImg =
                log.coverImg ||
                'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500&h=400&fit=crop'
              return (
                <div
                  key={log.id}
                  onClick={() => handleSelectPlace(log)}
                  className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={log.placeName}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/70 text-white backdrop-blur-xs">
                        {log.category || 'Điểm đến'}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePrivacy(e, log.id, log.privacy)}
                        className={`p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer shadow-xs ${
                          log.privacy === 1
                            ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-900'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                        title={log.privacy === 1 ? 'Chỉ mình tôi (Bấm đổi sang Công khai)' : 'Công khai (Bấm đổi sang Riêng tư)'}
                      >
                        {log.privacy === 1 ? <Lock size={12} /> : <Globe size={12} />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingLog(log)
                          setEditVisitedDate(log.visitedDate ? log.visitedDate.split('T')[0] : '')
                          setEditPrivacy(log.privacy === 1 ? 1 : 0)
                        }}
                        className="p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                        title="Sửa nhật ký"
                      >
                        <Edit3 size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteLog(e, log.id)}
                        className="p-1.5 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                        title="Xóa nhật ký"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                        {log.placeName}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="shrink-0 text-slate-400" />
                        <span>{log.province || 'Việt Nam'}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar size={11} />
                        <span>{new Date(log.visitedDate).toLocaleDateString('vi-VN')}</span>
                      </span>
                      <span className="text-emerald-800 font-bold group-hover:underline text-[11px]">
                        Xem địa điểm →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: THÊM NHẬT KÝ HÀNH TRÌNH
      ══════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-800" />
                <span>Ghi nhận điểm đến</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Search & Select Place */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn địa điểm đã ghé <span className="text-rose-500">*</span>
                </label>
                {selectedPlace ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedPlace.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{selectedPlace.provinceName || selectedPlace.address}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlace(null)}
                      className="text-xs text-rose-600 font-bold hover:underline shrink-0 ml-2"
                    >
                      Đổi
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Gõ tên địa điểm để tìm kiếm..."
                      value={searchPlaceQuery}
                      onChange={(e) => setSearchPlaceQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                    {isSearchingPlaces && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-800" />
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto z-20 p-1.5 space-y-1">
                        {searchResults.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPlace(p)
                              setSearchResults([])
                              setSearchPlaceQuery('')
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{p.provinceName || p.address}</p>
                            </div>
                            <Check size={14} className="text-emerald-800 shrink-0 opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Visited Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày ghé thăm
                </label>
                <input
                  type="date"
                  value={visitedDate}
                  onChange={(e) => setVisitedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quyền riêng tư
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivacy(0)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      privacy === 0
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Công khai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacy(1)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      privacy === 1
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lock size={14} />
                    <span>Chỉ mình tôi</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPlace}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Lưu nhật ký</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: SỬA NHẬT KÝ HÀNH TRÌNH
      ══════════════════════════════════════════════════════════════════ */}
      {editingLog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-800" />
                <span>Cập nhật nhật ký</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
              <Compass className="w-6 h-6 text-emerald-800 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{editingLog.placeName}</h4>
                <p className="text-[11px] text-slate-500">{editingLog.province || 'Việt Nam'}</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày ghé thăm
                </label>
                <input
                  type="date"
                  value={editVisitedDate}
                  onChange={(e) => setEditVisitedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quyền riêng tư
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPrivacy(0)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editPrivacy === 0
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Công khai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPrivacy(1)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editPrivacy === 1
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lock size={14} />
                    <span>Chỉ mình tôi</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Cập nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitLogsUtility
