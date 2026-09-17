import React, { useState } from 'react'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Send,
  Globe,
  Lock,
  MapPin,
  Pencil,
  DollarSign,
  AlertTriangle,
  Check,
  Save,
  Loader2
} from 'lucide-react'
import type {
  DetailedItineraryItem,
  TripRole
} from '@/types/models/itinerary.model'

interface ItineraryPlannerToolbarProps {
  itinerary: DetailedItineraryItem
  currentUserRole: TripRole
  totalStopsCount: number
  totalTripCost: number
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  onBackToCatalog: () => void
  onUpdateTitle: (title: string) => void
  onUpdateProvince: (province: string) => void
  onOpenMemberModal: () => void
  onPublishTrip: () => void
  onUpdateBudgetTarget: (newBudget: number) => void
  onSaveTrip?: () => void
}

const BUDGET_PRESETS = [3000000, 5000000, 8000000, 10000000, 15000000, 20000000]

export const ItineraryPlannerToolbar: React.FC<ItineraryPlannerToolbarProps> = ({
  itinerary,
  currentUserRole,
  totalStopsCount,
  totalTripCost,
  isSaving = false,
  hasUnsavedChanges = false,
  onBackToCatalog,
  onUpdateTitle,
  onUpdateProvince,
  onOpenMemberModal,
  onPublishTrip,
  onUpdateBudgetTarget,
  onSaveTrip
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [customBudgetString, setCustomBudgetString] = useState(
    String(itinerary.budgetTarget || 5000000)
  )

  const canEdit = currentUserRole !== 'Viewer'
  const budgetTarget = itinerary.budgetTarget || 5000000
  const members = itinerary.members || []
  const isPublished = itinerary.privacy === 0

  const percentUsed = budgetTarget > 0 ? Math.round((totalTripCost / budgetTarget) * 100) : 0
  const isOverBudget = totalTripCost > budgetTarget
  const remainingBudget = Math.max(0, budgetTarget - totalTripCost)

  const handleSaveBudget = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const parsed = parseInt(customBudgetString.replace(/\D/g, ''), 10) || 0
    onUpdateBudgetTarget(Math.max(0, parsed))
    setIsEditingBudget(false)
  }

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBackToCatalog}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách chuyến đi"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 flex items-center gap-1 ${
                    isPublished
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <Globe size={11} />
                      <span>Đã xuất bản</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      <span>Chưa xuất bản</span>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                  <MapPin size={11} className="text-slate-400" />
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={itinerary.province}
                    onChange={(e) => onUpdateProvince(e.target.value)}
                    placeholder="Tỉnh/Thành phố"
                    className="bg-transparent text-slate-700 font-bold outline-none focus:bg-slate-50 rounded px-1 max-w-[120px]"
                  />
                  <span>•</span>
                  <span>{itinerary.durationDays}N{itinerary.nightsCount}Đ</span>
                </div>
              </div>

              <input
                type="text"
                disabled={!canEdit}
                value={itinerary.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                placeholder="Nhập tên chuyến đi..."
                className="font-extrabold text-base sm:text-xl text-slate-900 bg-transparent outline-none focus:bg-slate-50 rounded-lg transition-all w-full tracking-tight truncate"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              onClick={onOpenMemberModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
              title="Xem danh sách thành viên trong chuyến đi & Mời bạn bè"
            >
              <div className="flex items-center -space-x-2 overflow-hidden">
                {members.slice(0, 3).map((m) =>
                  m.avatar ? (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt={m.name}
                      className="w-6 h-6 rounded-full object-cover border-2 border-white ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white ring-1 ring-slate-200 shrink-0"
                    >
                      {(m.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                <Users size={13} className="text-slate-500" />
                <span>{members.length} người</span>
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={onOpenMemberModal}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Mời thêm bạn bè vào cùng lên kế hoạch"
              >
                <UserPlus size={13} />
                <span className="hidden sm:inline">Mời bạn bè</span>
              </button>
            )}

            {canEdit && onSaveTrip && (
              <button
                type="button"
                onClick={onSaveTrip}
                disabled={isSaving}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  isSaving
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
                title="Lưu lại toàn bộ lịch trình và địa điểm đã chọn"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-emerald-600" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} className={hasUnsavedChanges ? 'text-white' : 'text-slate-500'} />
                    <span>{hasUnsavedChanges ? 'Lưu thay đổi *' : 'Đã lưu'}</span>
                  </>
                )}
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={onPublishTrip}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  isPublished
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                }`}
              >
                {isPublished ? (
                  <>
                    <Lock size={13} />
                    <span>Hủy xuất bản</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Xuất bản chuyến đi</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Tổng điểm dừng:</span>
              <span className="font-bold text-slate-900">{totalStopsCount} điểm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Chi phí dự tính:</span>
              <span className="font-extrabold text-emerald-800">
                {totalTripCost.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="relative">
              <div
                onClick={() => canEdit && setIsEditingBudget(!isEditingBudget)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-colors ${
                  canEdit ? 'cursor-pointer hover:bg-slate-50' : ''
                } ${
                  isOverBudget
                    ? 'border-red-200 bg-red-50/40 text-red-800'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
                title={canEdit ? 'Nhấn để cài đặt ngân sách đề ra cho chuyến đi' : undefined}
              >
                <DollarSign size={13} className={isOverBudget ? 'text-red-600' : 'text-emerald-700'} />
                <span className="text-slate-500 font-medium">Ngân sách đề ra:</span>
                <span className="font-bold">
                  {budgetTarget.toLocaleString('vi-VN')} đ
                </span>

                {canEdit && (
                  <Pencil size={11} className="text-slate-400 hover:text-slate-700 ml-0.5" />
                )}

                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden ml-1 hidden sm:block">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : 'bg-emerald-600'
                    }`}
                    style={{
                      width: `${Math.min(100, percentUsed)}%`
                    }}
                  />
                </div>

                <span className={`text-[11px] font-bold ${isOverBudget ? 'text-red-600' : 'text-slate-500'}`}>
                  {percentUsed}%
                </span>

                {isOverBudget ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <AlertTriangle size={10} />
                    <span>Vượt {(totalTripCost - budgetTarget).toLocaleString('vi-VN')} đ</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded hidden lg:inline">
                    Còn {remainingBudget.toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>

              {isEditingBudget && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cài đặt ngân sách đề ra</span>
                    <span className="text-[11px] text-slate-400">VNĐ</span>
                  </div>

                  <form onSubmit={handleSaveBudget} className="space-y-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        step={500000}
                        min={0}
                        autoFocus
                        value={customBudgetString}
                        onChange={(e) => setCustomBudgetString(e.target.value)}
                        placeholder="Nhập mức ngân sách..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none pr-8"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        đ
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {BUDGET_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setCustomBudgetString(String(preset))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                            parseInt(customBudgetString, 10) === preset
                              ? 'bg-emerald-800 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {(preset / 1000000).toLocaleString('vi-VN')} triệu
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check size={13} />
                        <span>Lưu ngân sách</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingBudget(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItineraryPlannerToolbar
