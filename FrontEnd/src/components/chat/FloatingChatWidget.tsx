import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Phone,
  Video,
  Minus,
  X,
  ChevronDown,
  Plus,
  Image as ImageIcon,
  Smile,
  Send,
  Reply,
  PhoneOff,
  Loader2,
  MapPin,
} from 'lucide-react'
import Draggable from 'react-draggable'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { MessageAttachmentType, type InboxItemDto } from '@/services/chatService'

interface FloatingChatWidgetProps {
  onOpenFullChat: (roomId?: number) => void
  onSelectPlace?: (placeId: number) => void
  showToast?: (msg: string) => void
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  onOpenFullChat,
  onSelectPlace,
  showToast = () => {},
}) => {
  const { user } = useAuth()
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
    sendTyping,
  } = useChat()

  const [inputText, setInputText] = useState('')
  const [showConvPicker, setShowConvPicker] = useState(false)
  const [showQuickShareMenu, setShowQuickShareMenu] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: number; senderName: string; text: string } | null>(null)
  const [isSending, setIsSending] = useState(false)

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

  if (!isFloatingChatOpen) {
    return null
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

  const avatar = activeRoom?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
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
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 font-sans flex flex-col items-end select-none"
        >
          {/* ═══════════════════════════════════════════════════════════════
              TRƯỜNG HỢP 1: THU NHỎ THÀNH BONG BÓNG CHAT TRÒN (NHIỀU LIGHTICONS)
          ═══════════════════════════════════════════════════════════════ */}
          {isFloatingChatMinimized ? (
            <div className="chat-draggable-handle flex flex-col items-end gap-3 cursor-move animate-in zoom-in-75 duration-200">
              {/* Danh sách các Lighticon (Chat heads) xếp dọc */}
              <div className="flex flex-col items-end gap-2.5">
                {chatHeadRooms.map((room) => {
                  const isToastTarget = incomingToast && incomingToast.roomId === room.roomId
                  const isCurrentActive = room.roomId === activeRoomId
                  const headAvatar = room.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
                  const headTitle = room.name || 'Đoạn chat'

                  return (
                    <div
                      key={room.roomId}
                      className="relative flex items-center justify-end gap-3 group/chathead"
                    >
                      {/* ── BONG BÓNG TIN NHẮN (HƯỚNG CHÍNH GIỮA KẾ BÊN LIGHTICON) ── */}
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

                      {/* ── VÒNG TRÒN LIGHTICON ── */}
                      <div className="relative group/icon">
                        <button
                          type="button"
                          onClick={() => {
                            dismissIncomingToast()
                            restoreFloatingChat(room.roomId)
                          }}
                          className={`relative w-14 h-14 rounded-full overflow-hidden shadow-2xl transition-all duration-200 cursor-pointer bg-slate-900 border-2 ${
                            isCurrentActive
                              ? 'border-white ring-4 ring-amber-400 scale-105'
                              : 'border-white ring-2 ring-slate-300 hover:ring-amber-300 hover:scale-110 active:scale-95'
                          }`}
                          title={`Đoạn chat: ${headTitle} (Bấm để mở cuộc trò chuyện)`}
                        >
                          <img
                            src={headAvatar}
                            alt={headTitle}
                            className="w-full h-full object-cover"
                          />
                        </button>

                        {/* Unread badge count */}
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce pointer-events-none">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        )}

                        {/* Nút 'X' đóng riêng lighticon này khi hover */}
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

              {/* Vòng tròn Soạn tin nhắn mới màu trắng bên dưới */}
              <button
                type="button"
                onClick={() => {
                  dismissIncomingToast()
                  restoreFloatingChat()
                  onOpenFullChat(activeRoomId || undefined)
                }}
                className="w-11 h-11 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer mr-1.5"
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
            /* ═══════════════════════════════════════════════════════════════
               TRƯỜNG HỢP 2: CỬA SỔ CHAT MINI NỔI ĐẦY ĐỦ
            ═══════════════════════════════════════════════════════════════ */
            <div className="w-[340px] sm:w-[360px] h-[520px] rounded-2xl shadow-2xl border border-amber-300/60 flex flex-col overflow-hidden bg-[#FFFDF0] animate-in fade-in slide-from-bottom-3 duration-200 relative">
              {/* ── TOP HEADER CỦA CHAT MINI ── */}
              <div className="chat-draggable-handle px-3 py-2.5 bg-[#FFF8DE] border-b border-amber-200/80 flex items-center justify-between cursor-move text-slate-900 z-10 shadow-2xs">
                {/* Left: Avatar + Tên + Chevron dropdown */}
                <div className="relative flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-300" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConvPicker(!showConvPicker)}
                    className="flex items-center gap-1 min-w-0 text-left hover:bg-amber-100/70 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{title}</span>
                    <ChevronDown size={14} className="text-pink-600 shrink-0" />
                  </button>

                  {/* Dropdown chuyển đổi cuộc trò chuyện */}
                  {showConvPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowConvPicker(false)} />
                      <div className="absolute top-10 left-0 w-60 bg-white rounded-xl shadow-2xl border border-amber-200 py-1.5 z-50 divide-y divide-slate-100">
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
                              className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-amber-50 cursor-pointer ${
                                item.roomId === activeRoomId ? 'bg-amber-100/60 font-bold text-amber-900' : 'text-slate-700'
                              }`}
                            >
                              <img
                                src={item.avatarUrl || avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="truncate flex-1">{item.name}</span>
                              {item.unreadCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Nút Gọi thoại, Gọi video, Nút '-' (thu nhỏ) và Nút 'X' (đóng) */}
                <div className="flex items-center gap-1 text-[#E11D48]">
                  <button
                    type="button"
                    onClick={() => setActiveCall({ type: 'voice', partnerName: title })}
                    className="p-1 hover:bg-amber-100/80 rounded-full transition-colors cursor-pointer text-[#E11D48]"
                    title="Bắt đầu gọi thoại"
                  >
                    <Phone size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCall({ type: 'video', partnerName: title })}
                    className="p-1 hover:bg-amber-100/80 rounded-full transition-colors cursor-pointer text-[#E11D48]"
                    title="Bắt đầu gọi video"
                  >
                    <Video size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={minimizeFloatingChat}
                    className="p-1 hover:bg-amber-100/80 rounded-full transition-colors cursor-pointer text-[#E11D48] font-bold"
                    title="Thu nhỏ thành bong bóng chat"
                  >
                    <Minus size={18} strokeWidth={2.6} />
                  </button>
                  <button
                    type="button"
                    onClick={closeFloatingChat}
                    className="p-1 hover:bg-amber-100/80 rounded-full transition-colors cursor-pointer text-[#E11D48]"
                    title="Đóng đoạn chat"
                  >
                    <X size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              {/* ── MESSAGES BODY ── */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 space-y-2.5 relative scroll-smooth"
                style={{
                  background: 'radial-gradient(circle at 60% 50%, #FFF4D0 0%, #FFE99E 45%, #FFDF7E 100%)',
                }}
              >
                {/* Subtle watermark background */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* ── NÚT TẢI TIN NHẮN CŨ HƠN ── */}
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
                      className="px-3 py-1 bg-white/95 hover:bg-white text-amber-950 text-[11px] font-bold rounded-full border border-amber-300 shadow-md flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                      {isLoadingMoreMessages ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-amber-700" />
                          <span>Đang tải tin nhắn cũ...</span>
                        </>
                      ) : (
                        <span>↑ Xem tin nhắn cũ hơn</span>
                      )}
                    </button>
                  </div>
                )}

                {isLoadingMessages ? (
                  <div className="py-12 flex flex-col items-center justify-center text-amber-900/60 gap-2 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
                    <span>Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-amber-900/60 text-xs">
                    Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi tin nhắn đầu tiên!
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = currentUserId ? m.senderId === currentUserId : false
                    const isPrevSameSender = idx > 0 && messages[idx - 1]?.senderId === m.senderId

                    return (
                      <div
                        key={m.id}
                        className={`relative flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={m.senderAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-0.5 border border-amber-300"
                          />
                        )}

                        <div className={`flex flex-col max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Tên người gửi trong nhóm chat */}
                          {activeRoom?.isGroup && !isMe && !isPrevSameSender && (
                            <span className="text-[11px] font-semibold text-amber-900/80 mb-0.5 ml-1 select-none">
                              {m.senderName}
                            </span>
                          )}

                          {/* QUOTE REPLY */}
                          {m.replyToMessageSnippet && (
                            <div className="mb-1 flex flex-col items-start text-xs max-w-full">
                              <div className="flex items-center gap-1 text-amber-900/80 text-[11px] font-medium pl-1 mb-0.5">
                                <Reply size={11} className="rotate-180 text-amber-800" />
                                <span className="truncate">{m.replyToSenderName || 'Đã trả lời'}</span>
                              </div>
                              <div className="px-2.5 py-1 rounded-xl bg-[#FFF6D8]/90 text-amber-950/80 text-xs border border-amber-200/80 max-w-full truncate">
                                {m.replyToMessageSnippet}
                              </div>
                            </div>
                          )}

                          {/* MESSAGE BUBBLE */}
                          {m.content && (
                            <div
                              onClick={() => {
                                setReplyingTo({
                                  id: m.id,
                                  senderName: `${m.senderName} đã trả lời bạn`,
                                  text: m.content || '',
                                daylight: true,
                                } as unknown as { id: number; senderName: string; text: string })
                              }}
                              className="relative text-[13.5px] leading-snug break-words px-3 py-1.5 rounded-[18px] cursor-pointer transition-transform active:scale-95 shadow-2xs bg-[#FFF3C4] text-slate-900 border border-amber-200/80"
                              title="Bấm để trả lời tin nhắn này"
                            >
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                          )}

                          {/* ATTACHMENTS */}
                          {m.attachments?.map((att) => {
                            if (att.attachmentType === MessageAttachmentType.Image && att.mediaUrl) {
                              return (
                                <img
                                  key={att.id}
                                  src={att.mediaUrl}
                                  alt=""
                                  className="mt-1 rounded-xl w-full max-h-40 object-cover cursor-pointer shadow-sm hover:opacity-95"
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
                                  className="mt-1 bg-white/95 p-2 rounded-xl border border-amber-200 text-slate-800 cursor-pointer hover:bg-white shadow-sm"
                                >
                                  {att.placeCoverUrl && (
                                    <img src={att.placeCoverUrl} alt="" className="w-full h-24 rounded-lg object-cover" />
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
                                  className="mt-1 flex items-center gap-2 p-2 bg-white/90 rounded-xl border border-amber-200 text-xs text-blue-700 hover:underline"
                                >
                                  <span className="truncate">{att.fileName || 'Tải tệp'}</span>
                                </a>
                              )
                            }
                            return null
                          })}

                          {/* REACTIONS */}
                          {m.reactions && m.reactions.length > 0 && (
                            <div className="flex items-center gap-0.5 -mt-1 bg-white/90 px-1.5 py-0.5 rounded-full border border-amber-200 shadow-2xs text-[11px]">
                              {m.reactions.slice(0, 3).map((r, ri) => (
                                <span key={ri}>{r.emoji}</span>
                              ))}
                              {m.reactions.length > 3 && (
                                <span className="text-[10px] text-slate-500 font-bold">+{m.reactions.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Real-time typing indicator */}
                {partnerTyping && (
                  <div className="flex items-center gap-1.5 p-2 bg-amber-100/90 rounded-[18px] w-28 text-amber-900 text-xs font-medium animate-pulse">
                    <span>Đang nhập</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── BANNER QUOTE ĐANG TRẢ LỜI ── */}
              {replyingTo && (
                <div className="px-3 py-1.5 bg-[#FFF2CD] border-t border-amber-200 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <Reply size={12} className="rotate-180" />
                    <span className="font-medium truncate">Đang trả lời: "{replyingTo.text}"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-amber-200/60 rounded-full cursor-pointer text-amber-800"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* ── FOOTER INPUT BAR ── */}
              <div className="p-2 bg-[#FFF8DE] border-t border-amber-200/80 flex items-center gap-1 relative z-10">
                {/* Icon '+' */}
                <button
                  type="button"
                  onClick={() => setShowQuickShareMenu(!showQuickShareMenu)}
                  className="w-7 h-7 rounded-full hover:bg-amber-200/60 text-[#F97316] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Thêm tiện ích & chia sẻ"
                >
                  <Plus size={18} strokeWidth={2.8} />
                </button>

                {/* Quick Share Menu */}
                {showQuickShareMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowQuickShareMenu(false)} />
                    <div className="absolute bottom-12 left-2 w-56 bg-white rounded-xl shadow-2xl border border-amber-200 p-1.5 z-50 divide-y divide-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickShareMenu(false)
                          fileInputRef.current?.click()
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 rounded-lg flex items-center gap-2"
                      >
                        <ImageIcon size={15} className="text-amber-600" />
                        <span>Gửi ảnh / tệp từ máy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickShareMenu(false)
                          onOpenFullChat(activeRoomId || undefined)
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 rounded-lg flex items-center gap-2"
                      >
                        <MapPin size={15} className="text-emerald-600" />
                        <span>Mở bản đồ chọn điểm đến</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Icon Đính kèm ảnh */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-full hover:bg-amber-200/60 text-[#F97316] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Gửi ảnh từ máy"
                >
                  <ImageIcon size={18} />
                </button>

                {/* Icon Nhãn dán / Smile */}
                <button
                  type="button"
                  onClick={() => handleSend('🥰')}
                  className="w-7 h-7 rounded-full hover:bg-amber-200/60 text-[#F97316] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Gửi sticker cảm xúc"
                >
                  <Smile size={18} />
                </button>

                {/* Icon GIF badge */}
                <button
                  type="button"
                  onClick={() => handleSend('🎉')}
                  className="px-1.5 py-0.5 rounded-md hover:bg-amber-200/60 text-[#F97316] text-[10px] font-black tracking-wider transition-colors cursor-pointer border border-[#F97316]/40 shrink-0"
                  title="Gửi GIF"
                >
                  GIF
                </button>

                {/* Ô nhập tin nhắn */}
                <div className="flex-1 relative flex items-center min-w-0">
                  <input
                    type="text"
                    placeholder="Aa"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend()
                    }}
                    className="w-full pl-3 pr-7 py-1.5 bg-[#FFF0C2] focus:bg-white text-xs text-slate-900 placeholder:text-amber-900/60 rounded-full outline-none transition-all border border-transparent focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend('😊')}
                    className="absolute right-2 text-[#F97316] hover:scale-110 transition-transform cursor-pointer"
                    title="Chèn biểu tượng"
                  >
                    <Smile size={15} />
                  </button>
                </div>

                {/* Nút Gửi hoặc Nút Like/Star */}
                {inputText.trim() ? (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => handleSend()}
                    className="w-8 h-8 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 disabled:opacity-50"
                    title="Gửi tin nhắn"
                  >
                    {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSend('⭐')}
                    className="w-8 h-8 rounded-full hover:bg-amber-200/60 text-[#F97316] flex items-center justify-center transition-all cursor-pointer shrink-0 hover:scale-110 active:scale-90"
                    title="Gửi sao may mắn"
                  >
                    <span className="text-base">⭐</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Draggable>

      {/* ── SIMULATED CALL MODAL ── */}
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
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
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
