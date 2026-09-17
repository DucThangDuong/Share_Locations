import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PlusCircle,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { ProposalItem } from '@/types/models/userProfile.model'

interface UserProposalsSectionProps {
  proposals: ProposalItem[]
  onDeleteProposal?: (id: number) => Promise<void> | void
}

interface ProposalCardProps {
  item: ProposalItem
  onSelect: (item: ProposalItem) => void
  onDelete?: (id: number) => void
  renderStatusBadge: (status: number) => React.ReactNode
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  item,
  onSelect,
  onDelete,
  renderStatusBadge
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mediaList =
    item.mediaUrls && item.mediaUrls.length > 0
      ? item.mediaUrls
      : item.coverImg
        ? [item.coverImg]
        : []
  const hasMultipleImages = mediaList.length > 1

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveImageIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveImageIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1))
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDelete) {
      onDelete(item.id)
    }
  }

  return (
    <div
      onClick={() => onSelect(item)}
      className="group flex flex-col cursor-pointer select-none transition-all duration-300"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
        {mediaList.length > 0 ? (
          <img
            src={mediaList[activeImageIndex]}
            alt={item.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <MapPin className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="pt-3 flex flex-col space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight flex-1">
            {item.name}
          </h4>
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              title="Xóa đề xuất"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {renderStatusBadge(item.status)}
          {item.category && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {item.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate font-normal">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{item.address || item.province || 'Chưa cập nhật địa chỉ'}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        {item.status === 2 && item.rejectReason && (
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800 space-y-0.5 mt-1">
            <span className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" /> Lý do từ chối:
            </span>
            <p className="text-rose-700 line-clamp-1">{item.rejectReason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const UserProposalsSection: React.FC<UserProposalsSectionProps> = ({
  proposals,
  onDeleteProposal
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const statusFilter: 'all' | 0 | 1 | 2 = (() => {
    if (statusParam === 'approved' || statusParam === '1') return 1
    if (statusParam === 'pending' || statusParam === '0') return 0
    if (statusParam === 'rejected' || statusParam === '2') return 2
    return 'all'
  })()

  const setStatusFilter = (val: 'all' | 0 | 1 | 2) => {
    const newParams = new URLSearchParams(searchParams)
    if (val === 'all') {
      newParams.delete('status')
    } else {
      const statusMap: Record<number, string> = {
        1: 'approved',
        0: 'pending',
        2: 'rejected'
      }
      newParams.set('status', statusMap[val] || String(val))
    }
    setSearchParams(newParams, { replace: true })
  }

  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null)

  const filteredProposals = proposals.filter((p) => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  const renderStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Đã duyệt</span>
          </span>
        )
      case 0:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ duyệt</span>
          </span>
        )
      case 2:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 flex items-center gap-1 shrink-0">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Bị từ chối</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          Tất cả ({proposals.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(1)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 1
            ? 'bg-emerald-800 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          <CheckCircle2 size={12} />
          <span>Đã duyệt ({proposals.filter((p) => p.status === 1).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(0)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 0
            ? 'bg-amber-600 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          <Clock size={12} />
          <span>Chờ duyệt ({proposals.filter((p) => p.status === 0).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(2)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 2
            ? 'bg-rose-700 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          <AlertCircle size={12} />
          <span>Bị từ chối ({proposals.filter((p) => p.status === 2).length})</span>
        </button>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <PlusCircle size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Chưa có đề xuất địa điểm nào
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Đóng góp các địa điểm du lịch, quán ăn ngon yêu thích để nhận ngay +100 điểm uy tín khi được duyệt!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredProposals.map((item) => (
            <ProposalCard
              key={item.id}
              item={item}
              onSelect={(p) => setSelectedProposal(p)}
              onDelete={onDeleteProposal}
              renderStatusBadge={renderStatusBadge}
            />
          ))}
        </div>
      )}

      {selectedProposal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {selectedProposal.category && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    {selectedProposal.category}
                  </span>
                )}
                {renderStatusBadge(selectedProposal.status)}
              </div>
              <button type="button"
                onClick={() => setSelectedProposal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square sm:aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {selectedProposal.coverImg || selectedProposal.mediaUrls?.[0] ? (
                <img
                  src={selectedProposal.coverImg || selectedProposal.mediaUrls?.[0]}
                  alt={selectedProposal.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin className="w-12 h-12 text-slate-300" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedProposal.name}
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{selectedProposal.address} {selectedProposal.province ? `(${selectedProposal.province})` : ''}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Giờ mở cửa</span>
                <span className="font-semibold">{selectedProposal.openingHours || 'Chưa cập nhật'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Mức giá</span>
                <span className="font-semibold text-emerald-800">
                  {selectedProposal.minPrice !== undefined && selectedProposal.minPrice !== null
                    ? `${selectedProposal.minPrice.toLocaleString('vi-VN')} đ`
                    : 'Miễn phí'}
                </span>
              </div>
            </div>

            {selectedProposal.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                {selectedProposal.description}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
