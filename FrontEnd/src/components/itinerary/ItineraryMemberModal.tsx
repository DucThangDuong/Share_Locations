import React, { useState } from 'react'
import { X, Users, UserPlus, Trash2, Copy, Check, Link2, ShieldCheck } from 'lucide-react'
import type { TripMember, TripRole } from '@/types/models/itinerary.model'

interface ItineraryMemberModalProps {
  isOpen: boolean
  members: TripMember[]
  currentUserRole: TripRole
  onClose: () => void
  onInviteMember: (email: string, role: TripRole) => void
  onRemoveMember: (memberId: number) => void
}

export const ItineraryMemberModal: React.FC<ItineraryMemberModalProps> = ({
  isOpen,
  members,
  currentUserRole,
  onClose,
  onInviteMember,
  onRemoveMember
}) => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TripRole>('Editor')
  const [isCopiedLink, setIsCopiedLink] = useState(false)

  if (!isOpen) return null

  const isOwner = currentUserRole === 'Owner'

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    onInviteMember(inviteEmail.trim(), inviteRole)
    setInviteEmail('')
  }

  const handleCopyTripLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopiedLink(true)
    setTimeout(() => setIsCopiedLink(false), 2000)
  }

  const getRoleBadge = (role: TripRole) => {
    if (role === 'Owner') {
      return {
        label: 'Trưởng đoàn',
        classes: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      }
    }
    if (role === 'Editor') {
      return {
        label: 'Cùng lên lịch',
        classes: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    }
    return {
      label: 'Người xem',
      classes: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Thành viên trong chuyến đi
              </h3>
              <p className="text-xs text-slate-500">
                Hiện có {members.length} người đang tham gia chuyến đi này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {isOwner && (
            <div className="space-y-3">
              <form
                onSubmit={handleInviteSubmit}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserPlus size={14} className="text-emerald-800" />
                    <span>Mời bạn bè vào chuyến đi</span>
                  </h4>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Nhập email của bạn bè..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />

                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as TripRole)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="Editor">Quyền chỉnh sửa</option>
                    <option value="Viewer">Chỉ xem lịch trình</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Gửi lời mời
                  </button>
                </div>
              </form>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 size={15} className="text-emerald-800 shrink-0" />
                  <span className="text-slate-600 truncate font-medium">
                    Chia sẻ liên kết để bạn bè cùng tham gia
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyTripLink}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  {isCopiedLink ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-700">Đã chép link</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-700" />
              <span>Danh sách người tham gia ({members.length})</span>
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {members.map((m) => {
                const roleBadge = getRoleBadge(m.role)

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {(m.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleBadge.classes}`}
                      >
                        {roleBadge.label}
                      </span>

                      {isOwner && m.role !== 'Owner' && (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(m.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa thành viên khỏi chuyến đi"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItineraryMemberModal
