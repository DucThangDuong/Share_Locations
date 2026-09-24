import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Search,
  X,
  Plus,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { userService } from '@/services/userService'
import type { ProposalItem, PagedResultDto } from '@/types/models/userProfile.model'

interface ProposalsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
  onToast?: (msg: string) => void
}

type ProposalStatusFilter = 'all' | 0 | 1 | 2

export const ProposalsUtility: React.FC<ProposalsUtilityProps> = ({
  isDrawer = false,
  onClose,
  onToast
}) => {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ProposalStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProposals = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getMyProposals({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        pageSize: 50
      })
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setProposals(res.data)
        } else if (Array.isArray((res.data as PagedResultDto<ProposalItem>).items)) {
          setProposals((res.data as PagedResultDto<ProposalItem>).items)
        } else {
          setProposals([])
        }
      } else {
        setProposals([])
      }
    } catch {
      setProposals([])
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleDeleteProposal = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi đề xuất địa điểm này?')) return
    try {
      const res = await userService.deleteProposal(id)
      if (res.success) {
        setProposals((prev) => prev.filter((p) => p.id !== id))
        onToast?.('Đã thu hồi đề xuất địa điểm.')
      } else {
        onToast?.('Không thể thu hồi đề xuất lúc này.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi thu hồi đề xuất.')
    }
  }

  const handleSelectProposal = (p: ProposalItem) => {
    onClose?.()
    navigate(`/propose-place?view=${p.id}`, { state: { proposal: p } })
  }

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.province?.toLowerCase().includes(q) ||
          p.provinceName?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [proposals, statusFilter, searchQuery])

  const filterTabs: Array<{ id: ProposalStatusFilter; label: string; count: number }> = [
    { id: 'all', label: 'Tất cả', count: proposals.length },
    { id: 0, label: 'Chờ duyệt', count: proposals.filter((p) => p.status === 0).length },
    { id: 1, label: 'Đã duyệt', count: proposals.filter((p) => p.status === 1).length },
    { id: 2, label: 'Từ chối', count: proposals.filter((p) => p.status === 2).length }
  ]

  const renderStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <span className="px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1 shrink-0">
          <CheckCircle2 size={11} className="text-emerald-700" />
          <span>Đã duyệt</span>
        </span>
      )
    }
    if (status === 2) {
      return (
        <span className="px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
          <AlertCircle size={11} className="text-rose-600" />
          <span>Từ chối</span>
        </span>
      )
    }
    if (status === 3) {
      return (
        <span className="px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
          <Clock size={11} className="text-amber-600" />
          <span>Cần bổ sung</span>
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 shrink-0">
        <Clock size={11} className="text-amber-700" />
        <span>Chờ duyệt</span>
      </span>
    )
  }

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top Filter Chips and Actions */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.id ? 'bg-rose-900 text-rose-100' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <Link
            to="/propose-place"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus size={14} />
            <span>Đề xuất địa điểm</span>
          </Link>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ, tỉnh thành..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
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
      </div>

      {/* Main Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-rose-700" />
            <span className="text-xs">Đang tải danh sách đề xuất...</span>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <MapPin size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có địa điểm đề xuất nào</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Bạn biết một địa điểm tuyệt vời chưa có trên bản đồ? Đóng góp ngay để chia sẻ cùng cộng đồng.
            </p>
            <Link
              to="/propose-place"
              onClick={onClose}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-800 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Đề xuất địa điểm ngay</span>
            </Link>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Layout */
          <div className="space-y-2.5">
            {filteredProposals.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProposal(p)}
                className="group relative p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs bg-white"
              >
                <div className="flex items-center justify-between mb-1 pr-6">
                  <h4 className="text-xs font-bold text-slate-900 truncate flex-1 group-hover:text-emerald-800 transition-colors">
                    {p.name}
                  </h4>
                  {renderStatusBadge(p.status)}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {p.address || p.provinceName || p.province || 'Địa điểm mới'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="text-emerald-800 font-bold group-hover:underline">Xem chi tiết →</span>
                </p>

                <button
                  type="button"
                  onClick={(e) => handleDeleteProposal(e, p.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Thu hồi đề xuất"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProposals.map((p) => {
              const media =
                p.mediaUrls && p.mediaUrls.length > 0
                  ? p.mediaUrls[0]
                  : p.coverImg ||
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&h=400&fit=crop'
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProposal(p)}
                  className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={media}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/70 text-white backdrop-blur-xs">
                        {p.categoryName || p.category || 'Địa điểm'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProposal(e, p.id)}
                        className="p-2 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                        title="Thu hồi đề xuất"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      {renderStatusBadge(p.status)}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span>{p.address || p.provinceName || p.province || 'Việt Nam'}</span>
                      </p>
                      {p.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                      </span>
                      <span className="text-emerald-800 font-bold group-hover:underline text-[11px]">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProposalsUtility
