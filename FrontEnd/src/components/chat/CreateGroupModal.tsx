import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Users,
  Search,
  Check,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { friendService } from '@/services/friendService'
import type { FriendItemDto } from '@/types/models/friend.model'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (name: string, memberIds: number[]) => Promise<void>
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState<FriendItemDto[]>([])
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load friends on open
  useEffect(() => {
    if (!isOpen) return

    setGroupName('')
    setSearchQuery('')
    setSelectedFriendIds([])
    setErrorMsg(null)

    const fetchFriends = async () => {
      setIsLoadingFriends(true)
      try {
        const res = await friendService.getFriends()
        if (res?.data?.friends) {
          setFriends(res.data.friends)
        } else if (Array.isArray(res?.data)) {
          setFriends(res.data as unknown as FriendItemDto[])
        } else {
          setFriends([])
        }
      } catch (err) {
        console.error('Failed to load friends for group creation:', err)
        setFriends([])
      } finally {
        setIsLoadingFriends(false)
      }
    }

    fetchFriends()
  }, [isOpen])

  // ESC key support
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  const filteredFriends = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return friends
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.email && f.email.toLowerCase().includes(q))
    )
  }, [friends, searchQuery])

  const toggleSelectFriend = (id: number) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = groupName.trim()
    if (!trimmedName) {
      setErrorMsg('Vui lòng nhập tên nhóm')
      return
    }
    if (selectedFriendIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 bạn bè để tạo nhóm')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onCreateGroup(trimmedName, selectedFriendIds)
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tạo nhóm. Vui lòng thử lại sau.'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const selectedFriends = friends.filter((f) => selectedFriendIds.includes(f.id))

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150">
        {/* ── HEADER ── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Users className="w-5 h-5 text-[#0084FF]" />
            <h2>Tạo nhóm trò chuyện mới</h2>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
          {/* ── BODY ── */}
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Tên nhóm */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Tên nhóm <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Đặt tên nhóm (ví dụ: Team Phượt Đà Lạt...)"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0084FF] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Tìm kiếm bạn bè */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Thêm thành viên
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bạn bè theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0084FF] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Chips đã chọn */}
            {selectedFriends.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {selectedFriends.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-blue-50 text-[#0084FF] border border-blue-200/80 text-xs font-semibold animate-in zoom-in-75 duration-100"
                  >
                    <img
                      src={f.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectFriend(f.id)}
                      className="hover:text-rose-600 cursor-pointer ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Danh sách bạn bè */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="px-3 py-2 bg-slate-100/80 text-[11px] font-bold text-slate-500 uppercase flex justify-between">
                <span>Danh sách bạn bè ({filteredFriends.length})</span>
                {selectedFriendIds.length > 0 && (
                  <span className="text-[#0084FF]">Đã chọn: {selectedFriendIds.length}</span>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1 bg-white">
                {isLoadingFriends ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0084FF]" />
                    <span>Đang tải danh sách bạn bè...</span>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {friends.length === 0
                      ? 'Bạn chưa có bạn bè nào để thêm vào nhóm'
                      : 'Không tìm thấy bạn bè phù hợp'}
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const isSelected = selectedFriendIds.includes(friend.id)
                    const avatar =
                      friend.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'

                    return (
                      <div
                        key={friend.id}
                        onClick={() => toggleSelectFriend(friend.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={avatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {friend.name}
                            </p>
                            {friend.email && (
                              <p className="text-[11px] text-slate-400 truncate">
                                {friend.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Checkbox circle */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0084FF] border-[#0084FF] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Thông báo lỗi nếu có */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium rounded-xl">
                {errorMsg}
              </div>
            )}
          </div>

          {/* ── FOOTER ACTIONS ── */}
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedFriendIds.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0084FF] hover:bg-[#0073E6] rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang tạo nhóm...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Tạo nhóm ({selectedFriendIds.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupModal
