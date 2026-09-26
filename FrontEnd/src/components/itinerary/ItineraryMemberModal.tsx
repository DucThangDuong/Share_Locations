import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Crown,
  Edit3,
  Eye,
  LogOut,
  Loader2,
  Plus
} from 'lucide-react'
import { friendService } from '@/services/friendService'
import type { FriendItemDto } from '@/types/models/friend.model'
import type { TripMemberDetailDto } from '@/types/models/trip.model'
import type { TripMember } from '@/types/models/itinerary.model'

interface ItineraryMemberModalProps {
  isOpen: boolean
  tripId?: number | string
  tripTitle?: string
  members: Array<TripMemberDetailDto | TripMember>
  currentUserRole?: string
  currentUserId?: number
  isPublished?: boolean
  onClose: () => void
  onInviteMember: (email: string, role: string) => Promise<boolean | void> | void
  onRemoveMember: (userId: number, isSelf?: boolean) => Promise<boolean | void> | void
}

export const ItineraryMemberModal: React.FC<ItineraryMemberModalProps> = ({
  isOpen,
  tripTitle,
  members,
  currentUserRole = 'Owner',
  currentUserId,
  isPublished = false,
  onClose,
  onInviteMember,
  onRemoveMember
}) => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Member' | 'Editor'>('Member')
  const [isInviting, setIsInviting] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)

  // Friends selection & suggestions
  const [friends, setFriends] = useState<FriendItemDto[]>([])
  const [selectedFriends, setSelectedFriends] = useState<FriendItemDto[]>([])
  const [, setIsLoadingFriends] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriends([])
      setInviteEmail('')
      return
    }

    const loadFriends = async () => {
      setIsLoadingFriends(true)
      try {
        const res = await friendService.getFriends()
        if (res?.success && res?.data?.friends) {
          setFriends(res.data.friends)
        } else if (Array.isArray(res?.data)) {
          setFriends(res.data as unknown as FriendItemDto[])
        } else {
          setFriends([])
        }
      } catch {
        setFriends([])
      } finally {
        setIsLoadingFriends(false)
      }
    }

    loadFriends()
  }, [isOpen])

  const existingMemberIds = useMemo(() => {
    return new Set(
      members.map((m: any) => Number(m.userId || m.id)).filter(Boolean)
    )
  }, [members])

  const existingMemberEmails = useMemo(() => {
    return new Set(
      members.map((m: any) => m.email?.toLowerCase()).filter(Boolean)
    )
  }, [members])

  const selectedFriendIds = useMemo(() => {
    return new Set(selectedFriends.map((f) => Number(f.id)))
  }, [selectedFriends])

  const suggestedFriends = useMemo(() => {
    const q = inviteEmail.toLowerCase().trim()
    const seenIds = new Set<number>()
    return friends.filter((f) => {
      if (!f || !f.id) return false
      if (seenIds.has(Number(f.id))) return false
      seenIds.add(Number(f.id))

      if (f.id && existingMemberIds.has(Number(f.id))) return false
      if (f.email && existingMemberEmails.has(f.email.toLowerCase())) return false
      if (selectedFriendIds.has(Number(f.id))) return false
      if (q) {
        const matchName = f.name?.toLowerCase().includes(q)
        const matchEmail = f.email?.toLowerCase().includes(q)
        return matchName || matchEmail
      }
      return true
    })
  }, [friends, existingMemberIds, existingMemberEmails, selectedFriendIds, inviteEmail])

  const handleSelectFriend = (friend: FriendItemDto) => {
    if (!selectedFriends.some((f) => f.id === friend.id)) {
      setSelectedFriends((prev) => [...prev, friend])
    }
    setInviteEmail('')
  }

  const handleRemoveFriend = (friendId: number) => {
    setSelectedFriends((prev) => prev.filter((f) => f.id !== friendId))
  }

  if (!isOpen) return null

  const isOwner = !isPublished && currentUserRole?.toLowerCase() === 'owner'

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isInviting || selectedFriends.length === 0) return

    const emailsToInvite: string[] = selectedFriends
      .map((f) => f.email || f.name)
      .filter((item): item is string => Boolean(item))

    const uniqueEmails = Array.from(new Set(emailsToInvite))
    if (uniqueEmails.length === 0) return

    setIsInviting(true)
    try {
      for (const email of uniqueEmails) {
        await onInviteMember(email, inviteRole)
      }
      setInviteEmail('')
      setSelectedFriends([])
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (userId: number, isSelf: boolean = false) => {
    if (removingUserId !== null) return
    const confirmMsg = isSelf
      ? 'Bạn có chắc chắn muốn rời khỏi chuyến đi này?'
      : 'Bạn có chắc chắn muốn xóa thành viên này khỏi chuyến đi?'
    if (!window.confirm(confirmMsg)) return

    setRemovingUserId(userId)
    try {
      await onRemoveMember(userId, isSelf)
    } finally {
      setRemovingUserId(null)
    }
  }


  const getRoleBadge = (role?: string) => {
    const r = (role || 'Member').toLowerCase()
    if (r === 'owner') {
      return {
        label: 'Trưởng đoàn',
        icon: Crown,
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }
    }
    if (r === 'editor') {
      return {
        label: 'Cùng lên lịch',
        icon: Edit3,
        classes: 'bg-blue-50 text-blue-800 border-blue-200'
      }
    }
    return {
      label: 'Thành viên',
      icon: Eye,
      classes: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {tripTitle ? `Thành viên - ${tripTitle}` : 'Thành viên trong chuyến đi'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Invite Form (Owner Only) */}
          {isOwner ? (
            <form
              onSubmit={handleInviteSubmit}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
            >
              {/* Field 1: Friend Selection & Suggestions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn bạn bè tham gia <span className="text-rose-500">*</span>
                </label>

                <div className="w-full min-h-[46px] p-2 bg-white border border-slate-200 rounded-xl flex items-center flex-wrap gap-2 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/10 transition-all shadow-2xs">
                  {selectedFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold shrink-0"
                    >
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate max-w-[160px]">{friend.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="text-emerald-700 hover:text-rose-600 hover:bg-emerald-100/60 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Bỏ chọn"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}

                  <input
                    type="text"
                    placeholder={
                      selectedFriends.length === 0
                        ? 'Tìm kiếm bạn bè theo tên...'
                        : 'Tìm và thêm bạn bè khác...'
                    }
                    value={inviteEmail}
                    disabled={isInviting}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !inviteEmail && selectedFriends.length > 0) {
                        handleRemoveFriend(selectedFriends[selectedFriends.length - 1].id)
                      } else if (e.key === 'Enter' && inviteEmail.trim() && suggestedFriends.length > 0) {
                        e.preventDefault()
                        handleSelectFriend(suggestedFriends[0])
                      }
                    }}
                    className="flex-1 min-w-[140px] bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none disabled:opacity-50 py-1 px-1"
                  />
                </div>

                <p className="text-[11px] text-slate-500">
                  Chỉ có thể mời những người có trong danh sách bạn bè của bạn
                </p>

                {/* Quick select chips with + icon */}
                {suggestedFriends.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-h-24 overflow-y-auto">
                    {suggestedFriends.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFriend(f)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
                      >
                        <Plus
                          size={12}
                          className="text-slate-400 group-hover:text-emerald-600 font-bold"
                        />
                        {f.avatar ? (
                          <img
                            src={f.avatar}
                            alt={f.name}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate max-w-[150px]">{f.name}</span>
                      </button>
                    ))}
                  </div>
                ) : inviteEmail.trim() ? (
                  <p className="text-xs text-slate-400 italic pt-0.5">
                    Không tìm thấy bạn bè nào khớp với "{inviteEmail}"
                  </p>
                ) : friends.length === 0 ? (
                  <p className="text-xs text-slate-400 italic pt-0.5">
                    Bạn chưa có bạn bè nào để mời vào chuyến đi.
                  </p>
                ) : null}
              </div>

              {/* Field 2: Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Vai trò trong chuyến đi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inviteRole}
                  disabled={isInviting}
                  onChange={(e) => setInviteRole(e.target.value as 'Member' | 'Editor')}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <option value="Member">Thành viên (Chỉ xem và theo dõi lịch trình)</option>
                  <option value="Editor">Cùng lên lịch (Có quyền thêm, sửa, xóa điểm dừng)</option>
                </select>
              </div>

              {/* Action row */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200/80">
                <button
                  type="submit"
                  disabled={isInviting || selectedFriends.length === 0}
                  className="px-4.5 py-2 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isInviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang gửi lời mời...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>
                        {selectedFriends.length > 1
                          ? `Thêm ${selectedFriends.length} bạn bè`
                          : 'Thêm bạn bè'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Bạn đang tham gia chuyến đi này với vai trò{' '}
                <strong className="text-slate-900">{currentUserRole}</strong>.
              </span>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-700" />
              <span>Danh sách người tham gia ({members.length})</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {members.map((m, idx) => {
                const memberObj = m as any
                const memberUserId: number = memberObj.userId || memberObj.id || idx
                const memberName: string = memberObj.fullName || memberObj.name || 'Người dùng'
                const memberAvatar: string | null = memberObj.avatarUrl || memberObj.avatar || null
                const roleBadge = getRoleBadge(memberObj.role)
                const isMemberOwner = (memberObj.role || '').toLowerCase() === 'owner'
                const isSelf = Boolean(currentUserId && currentUserId === memberUserId)
                const isRemovingThis = removingUserId === memberUserId

                return (
                  <div
                    key={memberUserId || `mem-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {memberAvatar ? (
                        <img
                          src={memberAvatar}
                          alt={memberName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {(memberName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {memberName}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        {m.email && (
                          <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleBadge.classes}`}
                      >
                        <roleBadge.icon size={11} />
                        <span>{roleBadge.label}</span>
                      </span>

                      {/* Owner can remove non-owners */}
                      {isOwner && !isMemberOwner && (
                        <button
                          type="button"
                          disabled={isRemovingThis}
                          onClick={() => handleRemove(memberUserId, false)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Xóa thành viên khỏi chuyến đi"
                        >
                          {isRemovingThis ? (
                            <Loader2 size={14} className="animate-spin text-rose-600" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}

                      {/* Non-owner can leave the trip themselves */}
                      {!isOwner && isSelf && (
                        <button
                          type="button"
                          disabled={isRemovingThis}
                          onClick={() => handleRemove(memberUserId, true)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Rời khỏi chuyến đi"
                        >
                          {isRemovingThis ? (
                            <Loader2 size={14} className="animate-spin text-rose-600" />
                          ) : (
                            <LogOut size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItineraryMemberModal

