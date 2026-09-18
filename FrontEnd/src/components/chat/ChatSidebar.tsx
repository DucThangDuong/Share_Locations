import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, X, Loader2, UserPlus, Users } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { CreateGroupModal } from './CreateGroupModal'
import type { InboxItemDto } from '@/services/chatService'

interface ChatSidebarProps {
  inbox: InboxItemDto[]
  isLoading: boolean
  activeRoomId: number | null
  onSelectRoom: (roomId: number) => void
  onBack?: () => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  inbox,
  isLoading,
  activeRoomId,
  onSelectRoom,
  onBack,
}) => {
  const { createGroupChat } = useChat()
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

  const filteredInbox = useMemo(() => {
    return inbox.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.lastMessage && item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      if (filterTab === 'unread') return (item.unreadCount || 0) > 0
      if (filterTab === 'groups') return item.isGroup
      return true
    })
  }, [inbox, searchQuery, filterTab])

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    const newRoomId = await createGroupChat(name, memberIds)
    if (newRoomId) {
      onSelectRoom(newRoomId)
    }
  }

  return (
    <aside className="w-80 md:w-[360px] h-full bg-white border-r border-[#E4E6EB] flex flex-col flex-shrink-0 z-20 overflow-hidden select-none">
      {/* Header: "Đoạn chat" + Create Group Button */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center text-[#65676B] transition-colors cursor-pointer"
              title="Quay lại"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-[#050505]">Đoạn chat</h1>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateGroupOpen(true)}
          className="w-9 h-9 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] flex items-center justify-center transition-colors cursor-pointer"
          title="Tạo nhóm trò chuyện mới"
        >
          <UserPlus size={19} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-1.5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65676B]" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện, bạn bè..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#F0F2F5] focus:bg-white border border-transparent focus:border-[#0084FF] rounded-full text-[14px] text-[#050505] placeholder-[#65676B] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B] hover:text-[#050505] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            filterTab === 'all' ? 'bg-[#EBF5FF] text-[#0084FF]' : 'text-[#050505] hover:bg-[#F0F2F5]'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('unread')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            filterTab === 'unread' ? 'bg-[#EBF5FF] text-[#0084FF]' : 'text-[#050505] hover:bg-[#F0F2F5]'
          }`}
        >
          Chưa đọc
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('groups')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            filterTab === 'groups' ? 'bg-[#EBF5FF] text-[#0084FF]' : 'text-[#050505] hover:bg-[#F0F2F5]'
          }`}
        >
          Nhóm
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-0.5 overscroll-contain">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#0084FF]" />
            <span>Đang tải danh sách hộp thư...</span>
          </div>
        ) : filteredInbox.length === 0 ? (
          filterTab === 'groups' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0084FF] flex items-center justify-center mb-3">
                <Users size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">Chưa có nhóm trò chuyện nào</p>
              <p className="text-xs text-slate-500 mb-4 max-w-[220px]">
                Hãy tạo nhóm để cùng bạn bè thảo luận và chia sẻ địa điểm thú vị
              </p>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-4 py-2 bg-[#0084FF] hover:bg-[#0073E6] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Tạo nhóm ngay</span>
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">Không tìm thấy cuộc trò chuyện nào</div>
          )
        ) : (
          filteredInbox.map((item) => {
            const isActive = item.roomId === activeRoomId
            const isUnread = item.unreadCount > 0
            const avatarUrl =
              item.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'

            return (
              <div
                key={item.roomId}
                onClick={() => onSelectRoom(item.roomId)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isActive ? 'bg-[#EBF5FF]' : 'hover:bg-[#F2F2F2]'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-[15px] truncate ${
                        isUnread ? 'font-bold text-[#050505]' : 'font-semibold text-[#050505]'
                      }`}
                    >
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-[13px] text-[#65676B]">
                    <p className={`truncate flex-1 ${isUnread ? 'font-bold text-[#050505]' : ''}`}>
                      {item.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </div>

                {isUnread && <span className="w-2.5 h-2.5 bg-[#0084FF] rounded-full flex-shrink-0" />}
              </div>
            )
          })
        )}
      </div>

      {/* Modal Tạo Nhóm */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </aside>
  )
}

export default ChatSidebar
