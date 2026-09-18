import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Maximize2,
  Edit3,
  MoreHorizontal,
  X,
  Loader2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { CreateGroupModal } from '@/components/chat/CreateGroupModal'

interface HeaderChatDropdownProps {
  onClose: () => void
}

function formatTimestamp(isoString: string | null): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút`
    if (diffHours < 24) return `${diffHours} giờ`
    if (diffDays < 7) return `${diffDays} ngày`
    return `${date.getDate()}/${date.getMonth() + 1}`
  } catch {
    return ''
  }
}

export const HeaderChatDropdown: React.FC<HeaderChatDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { inbox, isLoadingInbox, openFloatingChat, totalUnreadCount, createGroupChat } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups'>('all')
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if create group modal is open
      if (isCreateGroupOpen) return
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreateGroupOpen) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, isCreateGroupOpen])

  const filteredInbox = inbox.filter((item) => {
    const matchesQuery =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lastMessage && item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesQuery) return false

    if (activeTab === 'unread') return (item.unreadCount || 0) > 0
    if (activeTab === 'groups') return item.isGroup
    return true
  })

  const handleSelectRoom = async (roomId: number) => {
    await openFloatingChat(roomId)
    onClose()
  }

  const handleViewAllInMessenger = () => {
    onClose()
    navigate('/chat')
  }

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    const newRoomId = await createGroupChat(name, memberIds)
    if (newRoomId) {
      await openFloatingChat(newRoomId)
      onClose()
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[350px] sm:w-[370px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col font-sans"
    >
      {/* ── HEADER: "Đoạn chat" + Actions ── */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đoạn chat</h2>

        <div className="flex items-center gap-1 text-slate-600">
          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-[#0084FF]"
            title="Tạo nhóm trò chuyện mới"
          >
            <UserPlus size={17} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Tùy chọn"
          >
            <MoreHorizontal size={18} />
          </button>
          <button
            type="button"
            onClick={handleViewAllInMessenger}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Mở toàn màn hình trong Messenger"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            onClick={handleViewAllInMessenger}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Soạn tin nhắn mới"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm trên Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER TABS (Tất cả, Chưa đọc, Nhóm) ── */}
      <div className="px-4 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Chưa đọc</span>
          {totalUnreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
              {totalUnreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'groups'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Nhóm
        </button>
        <button
          type="button"
          className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer text-xs"
          title="Thêm bộ lọc"
        >
          •••
        </button>
      </div>

      {/* ── CONVERSATION LIST ── */}
      <div className="flex-1 max-h-[380px] overflow-y-auto px-2 py-1 space-y-0.5 divide-y divide-transparent">
        {!isAuthenticated ? (
          <div className="py-8 text-center text-slate-500 text-xs px-4">
            <p className="mb-2 font-medium">Đăng nhập để xem tin nhắn của bạn</p>
            <button
              onClick={() => {
                onClose()
                navigate('/login')
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : isLoadingInbox ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Đang tải hộp thư...</span>
          </div>
        ) : filteredInbox.length === 0 ? (
          activeTab === 'groups' ? (
            <div className="py-8 flex flex-col items-center justify-center text-center px-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0084FF] flex items-center justify-center mb-2">
                <Users size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-800 mb-1">Chưa có nhóm trò chuyện nào</p>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="mt-2 px-3 py-1.5 bg-[#0084FF] hover:bg-[#0073E6] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={13} />
                <span>Tạo nhóm ngay</span>
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Không tìm thấy đoạn chat nào
            </div>
          )
        ) : (
          filteredInbox.map((item) => {
            const isUnread = (item.unreadCount || 0) > 0
            const avatar = item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'

            return (
              <button
                key={item.roomId}
                type="button"
                onClick={() => handleSelectRoom(item.roomId)}
                className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-slate-200/80"
                  />
                </div>

                {/* Text Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3
                      className={`text-[14px] truncate leading-snug ${
                        isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                      }`}
                    >
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <p
                      className={`truncate flex-1 ${
                        isUnread ? 'font-bold text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {item.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                    {item.lastMessageAt && (
                      <span className="text-[11px] text-slate-400 shrink-0">
                        · {formatTimestamp(item.lastMessageAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator (Blue dot if unread) */}
                <div className="flex items-center gap-1 shrink-0 pl-1">
                  {isUnread && (
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* ── FOOTER: "Xem tất cả trong Messenger" ── */}
      <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
        <button
          type="button"
          onClick={handleViewAllInMessenger}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
        >
          Xem tất cả trong Messenger
        </button>
      </div>

      {/* Modal Tạo Nhóm */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  )
}
export default HeaderChatDropdown
