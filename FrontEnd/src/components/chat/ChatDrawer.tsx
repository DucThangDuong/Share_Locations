import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Users,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MessageCircle,
  User,
  ShieldCheck,
  Loader2,
  Pencil,
  UserMinus,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'
import { AddMembersModal } from './AddMembersModal'
import { ViewGroupMembersModal } from './ViewGroupMembersModal'
import { RenameGroupModal } from './RenameGroupModal'
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
  onPreviewImage: (url: string) => void
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  roomTitle,
  roomAvatar,
  isGroup = false,
  roomId = null,
  images,
  onPreviewImage,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    addMembersToGroup,
    renameGroup,
    removeMemberFromGroup,
    leaveGroupChat,
    openDirectChatWithUser,
    messages,
  } = useChat()

  const currentUserId = user?.id ? Number(user.id) : null

  // Accordion open/close states
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(true)
  const [isMembersOpen, setIsMembersOpen] = useState(true)
  const [isPhotosOpen, setIsPhotosOpen] = useState(true)

  // Modals state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false)
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false)
  const [previewMembers, setPreviewMembers] = useState<ChatRoomMemberDto[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Remove member confirmation state
  const [memberToRemove, setMemberToRemove] = useState<ChatRoomMemberDto | null>(null)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  // Leave group confirmation state
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false)
  const [isLeavingGroup, setIsLeavingGroup] = useState(false)

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
        isAdmin: false,
        role: 'Member',
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
            isAdmin: false,
            role: 'Member',
          })
        }
      })
    }

    return Array.from(map.values())
  }, [previewMembers, user, messages, roomId])

  // Check if current user is group administrator based on isAdmin / role property
  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUserId || displayMembers.length === 0) return false
    const me = displayMembers.find((m) => m.userId === currentUserId)
    return Boolean(me?.isAdmin || me?.role === 'Admin')
  }, [currentUserId, displayMembers])

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
      </div>

      <div className="py-2 space-y-1">
        {/* ═══════════════════════════════════════════════════════════════
            ACCORDION 1: TÙY CHỈNH ĐOẠN CHAT (CHỈ HIỆN KHI LÀ GROUP)
        ═══════════════════════════════════════════════════════════════ */}
        {isGroup && roomId && (
          <div className="border-b border-slate-100 pb-2">
            {/* Header Nút Dropdown */}
            <button
              type="button"
              onClick={() => setIsCustomizationOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left group"
            >
              <span className="font-bold text-[14px] text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Tùy chỉnh đoạn chat
              </span>
              <div className="text-slate-500 group-hover:text-slate-800 transition-colors">
                {isCustomizationOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Nội dung bên trong Dropdown Tùy chỉnh */}
            {isCustomizationOpen && (
              <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-150">
                {/* 1. Đổi tên đoạn chat */}
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left group/item"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center shrink-0 group-hover/item:bg-slate-200 transition-colors">
                    <Pencil size={15} />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-900 truncate">
                    Đổi tên đoạn chat
                  </span>
                </button>

                {/* 2. Rời khỏi nhóm */}
                <button
                  type="button"
                  onClick={() => setIsConfirmLeaveOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer text-left group/item"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover/item:bg-rose-100 transition-colors">
                    <LogOut size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold text-rose-600 truncate block">
                      {isCurrentUserAdmin ? 'Giải tán & Rời nhóm' : 'Rời khỏi nhóm'}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">
                      {isCurrentUserAdmin
                        ? 'Xóa tất cả thành viên khỏi nhóm'
                        : 'Rời cuộc trò chuyện này'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACCORDION 2: THÀNH VIÊN TRONG ĐOẠN CHAT (CHỈ HIỆN KHI LÀ GROUP)
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
                {displayMembers.map((member) => {
                  const avatar =
                    member.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
                  const isMemberAdmin = Boolean(member.isAdmin || member.role === 'Admin')
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
                            {isMemberAdmin ? (
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isMenuOpen
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

                            {/* Chỉ Quản trị viên nhóm mới có quyền xóa thành viên khác khỏi nhóm */}
                            {isCurrentUserAdmin && !isMe && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuUserId(null)
                                  setMemberToRemove(member)
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer border-t border-slate-100 mt-1 pt-1.5"
                              >
                                <UserMinus size={15} className="text-rose-600" />
                                <span>Xóa khỏi nhóm</span>
                              </button>
                            )}
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
            ACCORDION 3: ẢNH ĐÃ CHIA SẺ
        ═══════════════════════════════════════════════════════════════ */}
        <div className="border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setIsPhotosOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F0F2F5] transition-colors cursor-pointer text-left group"
          >
            <span className="font-bold text-[14px] text-slate-900 group-hover:text-[#0084FF] transition-colors">
              Ảnh đã chia sẻ
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
      </div>

      {/* Modal Đổi Tên Nhóm */}
      {isGroup && roomId && (
        <RenameGroupModal
          isOpen={isRenameModalOpen}
          currentTitle={roomTitle}
          onClose={() => setIsRenameModalOpen(false)}
          onSave={async (newName) => {
            await renameGroup(roomId, newName)
          }}
        />
      )}

      {/* Modal Xác Nhận Xóa Thành Viên Khỏi Nhóm */}
      {memberToRemove && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div
            className="fixed inset-0"
            onClick={() => !isRemovingMember && setMemberToRemove(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-10 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-2">Xóa thành viên khỏi nhóm?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa{' '}
              <span className="font-semibold text-slate-800">"{memberToRemove.name}"</span> ra khỏi
              nhóm trò chuyện này không?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={async () => {
                  if (!roomId || !memberToRemove) return
                  setIsRemovingMember(true)
                  try {
                    await removeMemberFromGroup(roomId, memberToRemove.userId)
                    setPreviewMembers((prev) =>
                      prev.filter((m) => m.userId !== memberToRemove.userId)
                    )
                    setMemberToRemove(null)
                  } catch (err: any) {
                    const apiMsg =
                      err?.response?.data?.message ||
                      err?.response?.data?.error ||
                      err?.message ||
                      'Không thể xóa thành viên khỏi nhóm. Vui lòng thử lại sau.'
                    alert(apiMsg)
                  } finally {
                    setIsRemovingMember(false)
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isRemovingMember && <Loader2 size={13} className="animate-spin" />}
                <span>Xóa khỏi nhóm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Rời / Giải Tán Nhóm */}
      {isConfirmLeaveOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div
            className="fixed inset-0"
            onClick={() => !isLeavingGroup && setIsConfirmLeaveOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-10 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-2">
              {isCurrentUserAdmin ? 'Giải tán nhóm và rời đi?' : 'Rời khỏi nhóm trò chuyện?'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {isCurrentUserAdmin
                ? 'Bạn là Quản trị viên của nhóm này. Khi bạn rời đi, toàn bộ thành viên sẽ bị xóa và cuộc trò chuyện nhóm này sẽ được giải tán vĩnh viễn.'
                : 'Bạn sẽ rời khỏi cuộc trò chuyện này và không còn nhận được tin nhắn mới từ nhóm nữa.'}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isLeavingGroup}
                onClick={() => setIsConfirmLeaveOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isLeavingGroup}
                onClick={async () => {
                  if (!roomId) return
                  setIsLeavingGroup(true)
                  try {
                    await leaveGroupChat(roomId)
                    setIsConfirmLeaveOpen(false)
                  } catch (err: any) {
                    const apiMsg =
                      err?.response?.data?.message ||
                      err?.response?.data?.error ||
                      err?.message ||
                      'Không thể rời khỏi nhóm. Vui lòng thử lại sau.'
                    alert(apiMsg)
                  } finally {
                    setIsLeavingGroup(false)
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isLeavingGroup && <Loader2 size={13} className="animate-spin" />}
                <span>{isCurrentUserAdmin ? 'Giải tán & Rời nhóm' : 'Rời khỏi nhóm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
            chatService.getRoomMembers(roomId).then(setPreviewMembers).catch(() => { })
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
