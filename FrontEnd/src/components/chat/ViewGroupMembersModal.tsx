import React, { useState, useEffect } from 'react'
import { X, Users, UserPlus, Loader2, Search } from 'lucide-react'
import { chatService, type ChatRoomMemberDto } from '@/services/chatService'

interface ViewGroupMembersModalProps {
  isOpen: boolean
  roomId: number | null
  roomTitle: string
  onClose: () => void
  onOpenAddMembers?: () => void
}

export const ViewGroupMembersModal: React.FC<ViewGroupMembersModalProps> = ({
  isOpen,
  roomId,
  roomTitle,
  onClose,
  onOpenAddMembers,
}) => {
  const [members, setMembers] = useState<ChatRoomMemberDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isOpen || !roomId) return

    setSearchQuery('')
    const fetchMembers = async () => {
      setIsLoading(true)
      try {
        const data = await chatService.getRoomMembers(roomId)
        setMembers(data)
      } catch (err) {
        console.error('Failed to fetch room members:', err)
        setMembers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [isOpen, roomId])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      m.name.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    )
  })

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Users className="w-5 h-5 text-[#0084FF]" />
            <h2 className="truncate max-w-[280px]">Thành viên nhóm "{roomTitle}"</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0084FF] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-500">
            <span>Danh sách ({filteredMembers.length})</span>
            {onOpenAddMembers && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenAddMembers()
                }}
                className="text-xs font-bold text-[#0084FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus size={13} />
                <span>Thêm thành viên</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#0084FF]" />
              <span>Đang tải danh sách thành viên...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy thành viên phù hợp
            </div>
          ) : (
            filteredMembers.map((m) => {
              const avatar =
                m.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'

              return (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {m.name}
                      </p>
                      {m.email && (
                        <p className="text-xs text-slate-400 truncate">
                          {m.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewGroupMembersModal
