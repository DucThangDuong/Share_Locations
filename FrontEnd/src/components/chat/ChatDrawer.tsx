import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  UserPlus,
  Users,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MessageCircle,
  User,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'
import { AddMembersModal } from './AddMembersModal'
import { ViewGroupMembersModal } from './ViewGroupMembersModal'
import {
  chatService,
  type ChatRoomMemberDto,
  type MessageAttachmentDto,
} from '@/services/chatService'

interface ChatDrawerProps {
  isOpen: boolean
  roomTitle: string
  roomAvatar: string
  isGroup?: boolean
  roomId?: number | null
  images: MessageAttachmentDto[]
  files: MessageAttachmentDto[]
  onPreviewImage: (url: string) => void
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  roomTitle,
  roomAvatar,
  isGroup = false,
  roomId = null,
  images,
  files,
  onPreviewImage,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addMembersToGroup, openDirectChatWithUser, messages } = useChat()

  const currentUserId = user?.id ? Number(user.id) : null

  // Accordion open/close states
  const [isMembersOpen, setIsMembersOpen] = useState(true)
  const [isPhotosOpen, setIsPhotosOpen] = useState(true)
  const [isFilesOpen, setIsFilesOpen] = useState(true)

  // Modals state
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false)
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false)
  const [previewMembers, setPreviewMembers] = useState<ChatRoomMemberDto[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Member Action Menu dropdown: userId -> boolean
  const [activeMenuUserId, setActiveMenuUserId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuUserId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load group members from backend
  useEffect(() => {
    if (!isOpen || !isGroup || !roomId) {
      setPreviewMembers([])
      return
    }

    const loadMembers = async () => {
      setIsLoadingMembers(true)
      try {
        const data = await chatService.getRoomMembers(roomId)
        setPreviewMembers(data)
      } catch (err) {
        console.warn('Failed to load group members preview:', err)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    loadMembers()
  }, [isOpen, isGroup, roomId])

  // Fallback: Combine API members with current user + distinct message senders
  const displayMembers = useMemo(() => {
    if (previewMembers.length > 0) return previewMembers

    const map = new Map<number, ChatRoomMemberDto>()

    // 1. Current user
    if (user?.id) {
      const myId = Number(user.id)
      map.set(myId, {
        userId: myId,
        name: user.fullName || 'Tôi',
        avatarUrl: user.avatarUrl || null,
        email: user.email || null,
        joinedAt: new Date().toISOString(),
      })
    }

    // 2. Distinct senders from room messages
    if (roomId) {
      messages.forEach((msg) => {
        const msgRoomId = Number(msg.roomId)
        if (msgRoomId === Number(roomId) && msg.senderId && !map.has(msg.senderId)) {
          map.set(msg.senderId, {
            userId: msg.senderId,
            name: msg.senderName || 'Thành viên',
            avatarUrl: msg.senderAvatarUrl || null,
            email: null,
            joinedAt: msg.createdAt,
          })
        }
      })
    }

    return Array.from(map.values())
  }, [previewMembers, user, messages, roomId])

  if (!isOpen) return null

  return (
    <aside className="hidden lg:flex w-80 bg-white border-l border-[#E4E6EB] flex-col p-3 overflow-y-auto font-sans select-none">
      {/* Header Info */}
      <div className="flex flex-col items-center text-center py-4 border-b border-slate-100">
        <div className="relative mb-2">
          <img src={roomAvatar} alt="" className="w-18 h-18 rounded-full object-cover shadow-xs" />
          {isGroup && (
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#0084FF] text-white rounded-full border-2 border-white shadow-xs">
              <Users size={12} />
            </div>
          )}
        </div>
        <h3 className="font-bold text-base text-slate-900 px-2 line-clamp-1">{roomTitle}</h3>
        {isGroup ? (
          <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0084FF]">
            Nhóm trò chuyện
          </span>
        ) : (
          <span className="mt-1 text-[12px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Đang hoạt động
          </span>
        )}
      </div>

      <div className="py-2 space-y-1">
        {/* ═══════════════════════════════════════════════════════════════
            ACCORDION 1: THÀNH VIÊN TRONG ĐOẠN CHAT (CHỈ HIỆN KHI LÀ GROUP)
        ═══════════════════════════════════════════════════════════════ */}
        {isGroup && roomId && (
          <div className="border-b border-slate-100 pb-2">
            {/* Header Nút Dropdown */}
            <button
              type="button"
              onClick={() => setIsMembersOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left group"
            >
              <span className="font-bold text-[14px] text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Thành viên trong đoạn chat {displayMembers.length > 0 && `(${displayMembers.length})`}
              </span>
              <div className="text-slate-500 group-hover:text-slate-800 transition-colors">
                {isMembersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Nội dung danh sách thành viên (Hiện khi Dropdown mở) */}
            {isMembersOpen && (
              <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-150">
                {/* Nút Thêm người */}
                <button
                  type="button"
                  onClick={() => setIsAddMembersOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[#EBF5FF] text-[#0084FF] flex items-center justify-center shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0084FF]">Thêm người</p>
                    <p className="text-[11px] text-slate-400">Mời thêm bạn bè vào nhóm</p>
                  </div>
                </button>

                {/* Loading State */}
                {isLoadingMembers && displayMembers.length === 0 && (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 size={15} className="animate-spin text-[#0084FF]" />
                    <span>Đang tải thành viên...</span>
                  </div>
                )}

                {/* Danh sách các thành viên */}
                {displayMembers.map((member, index) => {
                  const avatar =
                    member.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
                  const isCreator = index === 0
                  const isMe = currentUserId === member.userId
                  const isMenuOpen = activeMenuUserId === member.userId

                  return (
                    <div
                      key={member.userId}
                      className="relative flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-[#F0F2F5] transition-colors group/member"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={avatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">
                            {member.name} {isMe && <span className="text-slate-400 font-normal">(Bạn)</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            {isCreator ? (
                              <span className="text-[#0084FF] font-medium flex items-center gap-0.5">
                                <ShieldCheck size={11} /> Quản trị viên
                              </span>
                            ) : (
                              'Thành viên'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Nút 3 chấm action menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuUserId(isMenuOpen ? null : member.userId)
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                            isMenuOpen
                              ? 'bg-slate-200 text-slate-900'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                          }`}
                          title="Tùy chọn thành viên"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu Popup */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-9 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                          >
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuUserId(null)
                                  openDirectChatWithUser(member.userId)
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                              >
                                <MessageCircle size={15} className="text-[#0084FF]" />
                                <span>Nhắn tin riêng</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuUserId(null)
                                navigate(`/profile/${member.userId}`)
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                            >
                              <User size={15} className="text-slate-500" />
                              <span>Xem trang cá nhân</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACCORDION 2: ẢNH ĐÃ CHIA SẺ
        ═══════════════════════════════════════════════════════════════ */}
        <div className="border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setIsPhotosOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left group"
          >
            <span className="font-bold text-[14px] text-slate-900 group-hover:text-[#0084FF] transition-colors">
              Ảnh đã chia sẻ ({images.length})
            </span>
            <div className="text-slate-500 group-hover:text-slate-800 transition-colors">
              {isPhotosOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {isPhotosOpen && (
            <div className="px-3 pt-1 pb-2">
              {images.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Chưa có ảnh nào được gửi</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 animate-in slide-in-from-top-1 fade-in duration-150">
                  {images.slice(0, 9).map((att) => (
                    <img
                      key={att.id}
                      src={att.mediaUrl || ''}
                      alt=""
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-slate-100"
                      onClick={() => att.mediaUrl && onPreviewImage(att.mediaUrl)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ACCORDION 3: TỆP ĐÍNH KÈM
        ═══════════════════════════════════════════════════════════════ */}
        <div className="border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setIsFilesOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left group"
          >
            <span className="font-bold text-[14px] text-slate-900 group-hover:text-[#0084FF] transition-colors">
              Tệp đính kèm ({files.length})
            </span>
            <div className="text-slate-500 group-hover:text-slate-800 transition-colors">
              {isFilesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {isFilesOpen && (
            <div className="px-3 pt-1 pb-2 space-y-1">
              {files.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Chưa có tệp nào được gửi</p>
              ) : (
                files.slice(0, 5).map((att) => (
                  <a
                    key={att.id}
                    href={att.mediaUrl || ''}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-[#F0F2F5] text-xs text-slate-700 truncate transition-colors animate-in slide-in-from-top-1 fade-in duration-150"
                  >
                    <FileText size={15} className="text-[#0084FF] shrink-0" />
                    <span className="truncate font-medium">{att.fileName || 'Tệp đính kèm'}</span>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem Thành Viên Full */}
      {isGroup && roomId && (
        <ViewGroupMembersModal
          isOpen={isViewMembersOpen}
          roomId={roomId}
          roomTitle={roomTitle}
          onClose={() => setIsViewMembersOpen(false)}
          onOpenAddMembers={() => setIsAddMembersOpen(true)}
        />
      )}

      {/* Modal Thêm Thành Viên */}
      {isGroup && roomId && (
        <AddMembersModal
          isOpen={isAddMembersOpen}
          roomId={roomId}
          roomTitle={roomTitle}
          onClose={() => {
            setIsAddMembersOpen(false)
            // Reload members list
            chatService.getRoomMembers(roomId).then(setPreviewMembers).catch(() => {})
          }}
          onAddMembers={async (rId, userIds) => {
            await addMembersToGroup(rId, userIds)
            const updated = await chatService.getRoomMembers(rId)
            setPreviewMembers(updated)
          }}
        />
      )}
    </aside>
  )
}

export default ChatDrawer
