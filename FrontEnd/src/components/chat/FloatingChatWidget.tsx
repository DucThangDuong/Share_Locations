import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Minus,
  X,
  ChevronDown,
  Image as ImageIcon,
  Send,
  Reply,
  PhoneOff,
  Loader2,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Check,
} from 'lucide-react'
import Draggable from 'react-draggable'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { useSystemSettings } from '@/context/SystemSettingsContext'
import { MessageAttachmentType, type InboxItemDto } from '@/services/chatService'

interface FloatingChatWidgetProps {
  onOpenFullChat: (roomId?: number) => void
  onSelectPlace?: (placeId: number) => void
  showToast?: (msg: string) => void
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  onOpenFullChat,
  onSelectPlace,
  showToast = () => { },
}) => {
  const { user } = useAuth()
  const { defaultUserAvatar, defaultGroupAvatar } = useSystemSettings()
  const {
    inbox,
    activeRoomId,
    activeRoom,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isLoadingMoreMessages,
    loadMoreMessages,
    partnerTyping,
    isFloatingChatOpen,
    isFloatingChatMinimized,
    floatingRoomIds,
    incomingToast,
    dismissIncomingToast,
    minimizeFloatingChat,
    restoreFloatingChat,
    closeFloatingChat,
    closeChatHead,
    selectRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
  } = useChat()

  const [inputText, setInputText] = useState('')
  const [showConvPicker, setShowConvPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: number; senderName: string; text: string } | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Edit / Delete States
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)

  // Simulated Voice/Video Call Modal
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; partnerName: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const previousScrollHeightRef = useRef<number>(0)
  const dragRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentUserId = user?.id ? Number(user.id) : null

  // Compute all rooms to show as chat head lighticons
  const chatHeadRooms = useMemo(() => {
    const list: InboxItemDto[] = []
    const ids = floatingRoomIds.length > 0 ? floatingRoomIds : activeRoomId ? [activeRoomId] : []

    ids.forEach((rId) => {
      const found = inbox.find((item) => item.roomId === rId)
      if (found) {
        list.push(found)
      } else if (activeRoom && activeRoom.roomId === rId) {
        list.push(activeRoom)
      } else {
        list.push({
          roomId: rId,
          name: incomingToast?.roomId === rId ? incomingToast.senderName : 'Bạn bè',
          avatarUrl: incomingToast?.roomId === rId ? incomingToast.senderAvatar : null,
          isGroup: false,
          unreadCount: 1,
          lastMessage: incomingToast?.roomId === rId ? incomingToast.snippet : '',
          lastMessageAt: new Date().toISOString(),
          otherUserId: null,
        })
      }
    })

    if (list.length === 0 && activeRoom) {
      list.push(activeRoom)
    }
    return list
  }, [floatingRoomIds, activeRoomId, inbox, activeRoom, incomingToast])

  // Handle scroll to top to load older messages
  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container || !hasMoreMessages || isLoadingMoreMessages || !activeRoomId) return

    if (container.scrollTop <= 25) {
      previousScrollHeightRef.current = container.scrollHeight
      loadMoreMessages(activeRoomId)
    }
  }

  // Restore scroll position after loading older messages so it doesn't jump
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container && previousScrollHeightRef.current > 0) {
      const diff = container.scrollHeight - previousScrollHeightRef.current
      if (diff > 0) {
        container.scrollTop += diff
      }
      previousScrollHeightRef.current = 0
    }
  }, [messages])

  // Scroll to bottom on open or when a new message is sent/received
  useEffect(() => {
    if (isFloatingChatOpen && !isFloatingChatMinimized && previousScrollHeightRef.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isFloatingChatOpen, isFloatingChatMinimized, messages, partnerTyping])

  // Auto-dismiss incoming speech bubble after 7 seconds
  useEffect(() => {
    if (!incomingToast) return
    const timer = setTimeout(() => {
      dismissIncomingToast()
    }, 7000)
    return () => clearTimeout(timer)
  }, [incomingToast, dismissIncomingToast])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuMessageId(null)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  if (!isFloatingChatOpen) {
    return null
  }

  // Handle Copy Message
  const handleCopy = (messageId: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  // Handle Delete Message
  const handleDelete = async (messageId: number) => {
    setActiveMenuMessageId(null)
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return
    try {
      await deleteMessage(messageId, activeRoomId || undefined)
      showToast('Đã xóa tin nhắn')
    } catch {
      showToast('Xóa tin nhắn thất bại')
    }
  }

  // Handle Save Edit
  const handleSaveEdit = async (messageId: number) => {
    if (!editingText.trim()) return
    setIsSavingEdit(true)
    try {
      await editMessage(messageId, editingText.trim(), activeRoomId || undefined)
      setEditingMessageId(null)
      setEditingText('')
      showToast('Đã cập nhật tin nhắn')
    } catch {
      showToast('Chỉnh sửa tin nhắn thất bại')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)

    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 2500)
  }

  const handleSend = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText.trim()
    if (!text && !replyingTo) return

    setIsSending(true)
    try {
      sendTyping(false)
      await sendMessage({
        content: text,
        replyToMessageId: replyingTo ? replyingTo.id : undefined,
      })
      setInputText('')
      setReplyingTo(null)
    } catch {
      showToast('Gửi tin nhắn thất bại')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSending(true)
    try {
      await sendMessage({
        files: [file],
      })
      showToast('Đã gửi tệp đính kèm')
    } catch {
      showToast('Gửi tệp thất bại')
    } finally {
      setIsSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const avatar =
    activeRoom?.avatarUrl ||
    (activeRoom?.isGroup
      ? defaultGroupAvatar
      : defaultUserAvatar)
  const title = activeRoom?.name || 'Đoạn chat'

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        onChange={handleFileUpload}
      />

      <Draggable handle=".chat-draggable-handle" bounds="body" nodeRef={dragRef}>
        <div
          ref={dragRef}
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[999] font-sans flex flex-col items-end select-none"
        >
          {isFloatingChatMinimized ? (
            <div className="chat-draggable-handle flex flex-col items-end gap-3 cursor-move animate-in zoom-in-75 duration-200">
              <div className="flex flex-col items-end gap-2.5">
                {chatHeadRooms.map((room) => {
                  const isToastTarget = incomingToast && incomingToast.roomId === room.roomId
                  const isCurrentActive = room.roomId === activeRoomId
                  const headAvatar =
                    room.avatarUrl ||
                    (room.isGroup
                      ? defaultGroupAvatar
                      : defaultUserAvatar)
                  const headTitle = room.name || 'Đoạn chat'

                  return (
                    <div
                      key={room.roomId}
                      className="relative flex items-center justify-end gap-3 group/chathead"
                    >
                      {isToastTarget && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissIncomingToast()
                            restoreFloatingChat(room.roomId)
                          }}
                          className="relative max-w-[220px] sm:max-w-[260px] bg-white text-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-2xl shadow-2xl border-2 border-blue-200/90 cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-2 animate-in slide-in-from-right-3 fade-in duration-200 ring-4 ring-blue-500/10 shrink-0 select-none group/bubble"
                        >
                          <span className="truncate line-clamp-2">{incomingToast.snippet}</span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              dismissIncomingToast()
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 opacity-70 group-hover/bubble:opacity-100 transition-opacity shrink-0 cursor-pointer"
                            title="Đóng thông báo"
                          >
                            <X size={12} />
                          </button>

                          {/* Mũi tên nhọn trỏ thẳng vào chính giữa tâm của Lighticon bên phải */}
                          <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t-2 border-r-2 border-blue-200/90 rotate-45 pointer-events-none" />
                        </div>
                      )}

                      <div className="relative group/icon">
                        <button
                          type="button"
                          onClick={() => {
                            dismissIncomingToast()
                            restoreFloatingChat(room.roomId)
                          }}
                          className={`relative w-14 h-14 rounded-full overflow-hidden shadow-2xl transition-all duration-200 cursor-pointer bg-slate-900 border-2 ${isCurrentActive
                            ? 'border-white ring-4 ring-[#0084FF]'
                            : 'border-white ring-2 ring-slate-200 hover:ring-[#0084FF]/50'
                            }`}
                          title={`Đoạn chat: ${headTitle} (Bấm để mở cuộc trò chuyện)`}
                        >
                          <img
                            src={headAvatar}
                            alt={headTitle}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity duration-200"
                          />
                        </button>

                        {/* Unread badge count */}
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce pointer-events-none">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (incomingToast?.roomId === room.roomId) dismissIncomingToast()
                            closeChatHead(room.roomId)
                          }}
                          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity shadow-md cursor-pointer z-10"
                          title="Đóng bong bóng chat này"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  dismissIncomingToast()
                  restoreFloatingChat()
                  onOpenFullChat(activeRoomId || undefined)
                }}
                className="w-11 h-11 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-all duration-150 cursor-pointer mr-1.5"
                title="Mở toàn màn hình tin nhắn"
              >
                <svg
                  className="w-5 h-5 text-slate-800"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-[340px] sm:w-[360px] h-[520px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden bg-white animate-in fade-in slide-from-bottom-3 duration-200 relative">
              <div className="chat-draggable-handle px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between cursor-move text-slate-900 z-10 shadow-xs">
                <div className="relative flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConvPicker(!showConvPicker)}
                    className="flex items-center gap-1 min-w-0 text-left hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{title}</span>
                    <ChevronDown size={14} className="text-[#0084FF] shrink-0" />
                  </button>

                  {showConvPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowConvPicker(false)} />
                      <div className="absolute top-10 left-0 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 divide-y divide-slate-100">
                        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">
                          Hộp thư của bạn
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                          {inbox.map((item) => (
                            <button
                              key={item.roomId}
                              type="button"
                              onClick={() => {
                                selectRoom(item.roomId)
                                setShowConvPicker(false)
                              }}
                              className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer ${item.roomId === activeRoomId ? 'bg-blue-50 font-bold text-[#0084FF]' : 'text-slate-700'
                                }`}
                            >
                              <img
                                src={
                                  item.avatarUrl ||
                                  (item.isGroup
                                    ? defaultGroupAvatar
                                    : defaultUserAvatar)
                                }
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="truncate flex-1">{item.name}</span>
                              {item.unreadCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-[#0084FF] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    type="button"
                    onClick={minimizeFloatingChat}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                    title="Thu nhỏ thành bong bóng chat"
                  >
                    <Minus size={18} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={closeFloatingChat}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500 hover:text-rose-600"
                    title="Đóng đoạn chat"
                  >
                    <X size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 space-y-2.5 relative scroll-smooth bg-white"
              >
                {hasMoreMessages && (
                  <div className="py-1 flex justify-center sticky top-0 z-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight
                        }
                        loadMoreMessages(activeRoomId || undefined)
                      }}
                      disabled={isLoadingMoreMessages}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-[#0084FF] text-[11px] font-bold rounded-full border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingMoreMessages ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-[#0084FF]" />
                          <span>Đang tải tin nhắn cũ...</span>
                        </>
                      ) : (
                        <span>↑ Xem tin nhắn cũ hơn</span>
                      )}
                    </button>
                  </div>
                )}

                {isLoadingMessages ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0084FF]" />
                    <span>Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi tin nhắn đầu tiên!
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = currentUserId ? m.senderId === currentUserId : false
                    const isPrevSameSender = idx > 0 && messages[idx - 1]?.senderId === m.senderId
                    const isEditingThis = editingMessageId === m.id
                    const isMenuOpen = activeMenuMessageId === m.id
                    const actionToolbar = (
                      <div
                        className={`relative flex items-center gap-1 mb-1 shrink-0 transition-all ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuMessageId(isMenuOpen ? null : m.id)
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isMenuOpen
                              ? 'bg-slate-200 text-slate-900 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs'
                              }`}
                            title="Tùy chọn khác"
                          >
                            <MoreHorizontal size={13} />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              className={`absolute bottom-full mb-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in zoom-in-95 duration-150 ${isMe ? 'right-0' : 'left-0'
                                }`}
                            >
                              {/* Trả lời */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuMessageId(null)
                                  setReplyingTo({
                                    id: m.id,
                                    senderName: isMe ? 'Chính bạn' : m.senderName,
                                    text: m.content || 'Đính kèm',
                                  })
                                }}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                              >
                                <Reply size={13} className="rotate-180 text-blue-600" />
                                <span>Phản hồi</span>
                              </button>

                              {m.content && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(m.id, m.content || '')}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                                >
                                  {copiedMessageId === m.id ? (
                                    <>
                                      <Check size={13} className="text-emerald-600" />
                                      <span className="text-emerald-700 font-bold">Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={13} className="text-slate-500" />
                                      <span>Sao chép</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {isMe && (
                                <>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuMessageId(null)
                                      setEditingMessageId(m.id)
                                      setEditingText(m.content || '')
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                                  >
                                    <Edit3 size={13} className="text-slate-600" />
                                    <span>Sửa tin nhắn</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDelete(m.id)}
                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                                  >
                                    <Trash2 size={13} className="text-rose-500" />
                                    <span>Xóa tin nhắn</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReplyingTo({
                              id: m.id,
                              senderName: isMe ? 'Chính bạn' : m.senderName,
                              text: m.content || 'Đính kèm',
                            })
                          }}
                          className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Phản hồi tin nhắn"
                        >
                          <Reply size={13} className="rotate-180" />
                        </button>
                      </div>
                    )

                    return (
                      <div
                        key={m.id}
                        className={`group relative flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={m.senderAvatarUrl || defaultUserAvatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-0.5 border border-slate-200"
                          />
                        )}

                        {isMe && !isEditingThis && actionToolbar}

                        <div className={`flex flex-col max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {activeRoom?.isGroup && !isMe && !isPrevSameSender && (
                            <span className="text-[11px] font-semibold text-slate-500 mb-0.5 ml-1 select-none">
                              {m.senderName}
                            </span>
                          )}

                          {m.replyToMessageSnippet && (
                            <div className="mb-1 flex flex-col items-start text-xs max-w-full">
                              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium pl-1 mb-0.5">
                                <Reply size={11} className="rotate-180 text-slate-500" />
                                <span className="truncate">{m.replyToSenderName || 'Đã trả lời'}</span>
                              </div>
                              <div className="px-2.5 py-1 rounded-xl bg-[#F0F2F5] text-slate-600 text-xs border border-slate-200/80 max-w-full truncate">
                                {m.replyToMessageSnippet}
                              </div>
                            </div>
                          )}

                          {isEditingThis ? (
                            <div className="w-full min-w-[200px] max-w-xs bg-white p-2.5 rounded-2xl border-2 border-[#0084FF] shadow-md">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0084FF] resize-none font-sans"
                                rows={2}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSaveEdit(m.id)
                                  } else if (e.key === 'Escape') {
                                    setEditingMessageId(null)
                                  }
                                }}
                              />
                              <div className="flex justify-end gap-1.5 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  disabled={isSavingEdit}
                                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(m.id)}
                                  disabled={isSavingEdit || !editingText.trim()}
                                  className="px-3 py-1 text-[11px] font-bold bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSavingEdit ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : (
                                    'Lưu'
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* MESSAGE BUBBLE */
                            m.content && (
                              <div
                                onClick={() => {
                                  if (!isMe) {
                                    setReplyingTo({
                                      id: m.id,
                                      senderName: m.senderName,
                                      text: m.content || '',
                                    })
                                  }
                                }}
                                className={`relative text-[13.5px] leading-snug break-words px-3.5 py-2 rounded-[18px] transition-colors shadow-2xs ${isMe
                                  ? 'bg-[#0084FF] text-white font-normal'
                                  : 'bg-[#F0F2F5] text-slate-900 border border-transparent hover:bg-[#E4E6EB] cursor-pointer'
                                  }`}
                                title={!isMe ? 'Bấm để trả lời tin nhắn này' : undefined}
                              >
                                <p className="whitespace-pre-wrap">{m.content}</p>
                              </div>
                            )
                          )}

                          {m.attachments?.map((att) => {
                            if (att.attachmentType === MessageAttachmentType.Image && att.mediaUrl) {
                              return (
                                <img
                                  key={att.id}
                                  src={att.mediaUrl}
                                  alt=""
                                  className="mt-1 rounded-xl w-full max-h-40 object-cover cursor-pointer shadow-sm hover:opacity-80 transition-opacity duration-200"
                                  onClick={() => onOpenFullChat(activeRoomId || undefined)}
                                />
                              )
                            }
                            if (att.attachmentType === MessageAttachmentType.Place && att.placeId) {
                              return (
                                <div
                                  key={att.id}
                                  onClick={() => {
                                    if (onSelectPlace && att.placeId) onSelectPlace(att.placeId)
                                  }}
                                  className="group mt-1 bg-white p-2 rounded-xl border border-slate-200 text-slate-800 cursor-pointer hover:bg-slate-50 shadow-xs"
                                >
                                  {att.placeCoverUrl && (
                                    <img src={att.placeCoverUrl} alt="" className="w-full h-24 rounded-lg object-cover group-hover:opacity-80 transition-opacity duration-200" />
                                  )}
                                  <p className="font-bold text-xs mt-1 truncate text-slate-900">{att.placeName || 'Địa điểm'}</p>
                                </div>
                              )
                            }
                            if (att.attachmentType === MessageAttachmentType.File && att.mediaUrl) {
                              return (
                                <a
                                  key={att.id}
                                  href={att.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-blue-700 hover:underline"
                                >
                                  <span className="truncate">{att.fileName || 'Tải tệp'}</span>
                                </a>
                              )
                            }
                            return null
                          })}

                          {m.reactions && m.reactions.length > 0 && (
                            <div className="flex items-center gap-0.5 -mt-1 bg-white px-1.5 py-0.5 rounded-full border border-slate-200 shadow-2xs text-[11px]">
                              {m.reactions.slice(0, 3).map((r, ri) => (
                                <span key={ri}>{r.emoji}</span>
                              ))}
                              {m.reactions.length > 3 && (
                                <span className="text-[10px] text-slate-500 font-bold">+{m.reactions.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {!isMe && !isEditingThis && actionToolbar}
                      </div>
                    )
                  })
                )}

                {partnerTyping && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F0F2F5] rounded-[18px] w-28 text-slate-500 text-xs font-medium animate-pulse">
                    <span>Đang nhập</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {replyingTo && (
                <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 truncate">
                    <Reply size={12} className="rotate-180 text-blue-600" />
                    <span className="font-medium truncate">Đang trả lời: "{replyingTo.text}"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 relative z-10">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-[#0084FF] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Gửi ảnh từ máy"
                >
                  <ImageIcon size={19} />
                </button>

                <div className="flex-1 relative flex items-center min-w-0">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend()
                    }}
                    className="w-full px-3.5 py-1.5 bg-[#F0F2F5] focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-full outline-none transition-all border border-transparent focus:border-[#0084FF]"
                  />
                </div>

                <button
                  type="button"
                  disabled={!inputText.trim() || isSending}
                  onClick={() => handleSend()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 shadow-xs ${inputText.trim() && !isSending
                    ? 'bg-[#0084FF] hover:bg-[#0073E6] text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  title="Gửi tin nhắn"
                >
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </Draggable>

      {activeCall && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 w-[340px] flex flex-col items-center text-center shadow-2xl space-y-4">
            <div className="relative">
              <img
                src={avatar}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 ring-4 ring-emerald-500/30 animate-pulse"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>

            <div>
              <h3 className="text-lg font-bold">{activeCall.partnerName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeCall.type === 'video' ? 'Cuộc gọi video đang kết nối...' : 'Cuộc gọi thoại đang đổ chuông...'}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  showToast('Đã ngắt cuộc gọi')
                  setActiveCall(null)
                }}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white cursor-pointer shadow-lg transition-all"
                title="Ngắt kết nối"
              >
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingChatWidget
