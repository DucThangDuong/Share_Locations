import React from 'react'
import {
  Info,
  Loader2,
  Reply,
  MapPin,
  FileText,
  Download,
} from 'lucide-react'
import { MessageAttachmentType, type ChatMessageDto } from '@/services/chatService'

interface ChatMessageFeedProps {
  roomTitle: string
  roomAvatar: string
  isGroup?: boolean
  partnerTyping: boolean
  messages: ChatMessageDto[]
  isLoadingMessages: boolean
  hasMoreMessages?: boolean
  isLoadingMoreMessages?: boolean
  onLoadMoreMessages?: () => void
  currentUserId: number | null
  showRightDrawer: boolean
  onToggleRightDrawer: () => void
  onReplyToMessage: (msg: { id: number; senderName: string; text: string }) => void
  onSelectPlace?: (placeId: number) => void
  onPreviewImage: (url: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export const ChatMessageFeed: React.FC<ChatMessageFeedProps> = ({
  roomTitle,
  roomAvatar,
  isGroup = false,
  partnerTyping,
  messages,
  isLoadingMessages,
  hasMoreMessages = false,
  isLoadingMoreMessages = false,
  onLoadMoreMessages = () => { },
  currentUserId,
  showRightDrawer,
  onToggleRightDrawer,
  onReplyToMessage,
  onSelectPlace,
  onPreviewImage,
  messagesEndRef,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const previousScrollHeightRef = React.useRef<number>(0)

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container || !hasMoreMessages || isLoadingMoreMessages) return

    if (container.scrollTop <= 20) {
      previousScrollHeightRef.current = container.scrollHeight
      onLoadMoreMessages()
    }
  }

  React.useEffect(() => {
    const container = scrollRef.current
    if (container && previousScrollHeightRef.current > 0) {
      const diff = container.scrollHeight - previousScrollHeightRef.current
      if (diff > 0) {
        container.scrollTop += diff
      }
      previousScrollHeightRef.current = 0
    }
  }, [messages])
  return (
    <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <header className="h-16 px-4 border-b border-[#E4E6EB] flex items-center justify-between gap-4 z-10 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img src={roomAvatar} alt={`${roomTitle} avatar`} className="w-10 h-10 rounded-full object-cover" />
          </div>

          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-[#050505] truncate">{roomTitle}</h2>
            <p className="text-[12px] text-[#65676B]">
              {partnerTyping ? (
                <span className="font-semibold text-[#0084FF]">Đang nhập...</span>
              ) : isGroup ? (
                'Nhóm trò chuyện'
              ) : (
                ''
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#0084FF]">
          <button
            type="button"
            onClick={onToggleRightDrawer}
            className={`min-h-11 min-w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0084FF] ${showRightDrawer ? 'bg-[#F0F2F5]' : 'hover:bg-[#F0F2F5]'
              }`}
            aria-label="Mở thông tin đoạn chat"
            title="Thông tin đoạn chat"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5 scroll-smooth"
      >
        {/* Nút Xem tin nhắn cũ hơn */}
        {hasMoreMessages && (
          <div className="py-2 flex justify-center sticky top-0 z-10">
            <button
              type="button"
              onClick={() => {
                if (scrollRef.current) {
                  previousScrollHeightRef.current = scrollRef.current.scrollHeight
                }
                onLoadMoreMessages()
              }}
              disabled={isLoadingMoreMessages}
              className="px-4 py-1.5 bg-white/95 hover:bg-white text-[#0084FF] text-xs font-bold rounded-full border border-slate-200 shadow-sm flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {isLoadingMoreMessages ? (
                <>
                  <Loader2 size={13} className="animate-spin text-[#0084FF]" />
                  <span>Đang tải tin nhắn cũ...</span>
                </>
              ) : (
                <span>↑ Xem tin nhắn cũ hơn</span>
              )}
            </button>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-[#0084FF]" />
            <span>Đang tải tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Chưa có tin nhắn nào trong phòng này. Hãy bắt đầu cuộc trò chuyện ngay!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = currentUserId ? msg.senderId === currentUserId : false
            const isNextSameSender = messages[idx + 1]?.senderId === msg.senderId
            const isPrevSameSender = idx > 0 && messages[idx - 1]?.senderId === msg.senderId
            const messageContent = msg.content

            return (
              <div
                key={msg.id}
                className={`group flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isNextSameSender ? 'mb-0.5' : 'mb-2'
                  }`}
              >
                {!isMe && (
                  <div className="w-7 h-7 shrink-0">
                    {!isNextSameSender && (
                      <img
                        src={
                          msg.senderAvatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
                        }
                        alt={`Ảnh đại diện của ${msg.senderName}`}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    )}
                  </div>
                )}

                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'
                    }`}
                >
                  {/* Tên người gửi trong nhóm chat */}
                  {isGroup && !isMe && !isPrevSameSender && (
                    <span className="text-[11.5px] font-semibold text-[#65676B] mb-0.5 ml-1 select-none">
                      {msg.senderName}
                    </span>
                  )}
                  {/* Reply quote */}
                  {msg.replyToMessageSnippet && (
                    <div className="mb-1 flex flex-col items-start text-xs max-w-full">
                      <div className="flex items-center gap-1 text-[#65676B] text-[12px] mb-0.5 pl-1">
                        <Reply size={12} className="rotate-180" />
                        <span>{msg.replyToSenderName || 'Đã trả lời'}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-2xl bg-[#F0F2F5] text-[#65676B] text-[13px] border border-[#E4E6EB] max-w-full truncate">
                        {msg.replyToMessageSnippet}
                      </div>
                    </div>
                  )}

                  {/* Bubble Content */}
                  {messageContent && (
                    <div
                      onClick={() => {
                        onReplyToMessage({
                          id: msg.id,
                          senderName: `${msg.senderName} đã trả lời bạn`,
                          text: messageContent,
                        })
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onReplyToMessage({
                            id: msg.id,
                            senderName: `${msg.senderName} đã trả lời bạn`,
                            text: messageContent,
                          })
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Trả lời tin nhắn"
                      className={`relative text-[15px] leading-snug wrap-break-word rounded-[18px] px-3.5 py-2 shadow-2xs cursor-pointer ${isMe ? 'bg-[#0084FF] text-white' : 'bg-[#F0F2F5] text-[#050505]'
                        }`}
                      title="Bấm để trả lời tin nhắn này"
                    >
                      <p className="whitespace-pre-wrap">{messageContent}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments?.map((att) => {
                    if (att.attachmentType === MessageAttachmentType.Image && att.mediaUrl) {
                      return (
                        <img
                          key={att.id}
                          src={att.mediaUrl}
                          alt={`Ảnh đính kèm từ ${msg.senderName}`}
                          className="mt-1 rounded-2xl max-w-sm max-h-72 object-cover cursor-pointer hover:opacity-95 shadow-sm"
                          onClick={() => onPreviewImage(att.mediaUrl!)}
                        />
                      )
                    }
                    if (att.attachmentType === MessageAttachmentType.Place && att.placeId) {
                      const placeId = att.placeId
                      return (
                        <div
                          key={att.id}
                          onClick={() => onSelectPlace?.(placeId)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onSelectPlace?.(placeId)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Xem địa điểm ${att.placeName || ''}`.trim()}
                          className="mt-1 bg-white rounded-2xl overflow-hidden border border-[#E4E6EB] shadow-sm max-w-[320px] cursor-pointer hover:bg-slate-50"
                        >
                          {att.placeCoverUrl && (
                            <img src={att.placeCoverUrl} alt="" className="w-full h-36 object-cover" />
                          )}
                          <div className="p-3">
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {att.placeName}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin size={12} className="text-red-500" />
                              <span>Xem chi tiết điểm đến</span>
                            </p>
                          </div>
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
                          className="mt-1 flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#E4E6EB] text-sm text-blue-600 hover:underline shadow-2xs"
                        >
                          <FileText size={18} />
                          <span className="truncate">{att.fileName || 'Tệp đính kèm'}</span>
                          <Download size={14} className="ml-auto text-slate-400" />
                        </a>
                      )
                    }
                    return null
                  })}

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex items-center gap-1 -mt-2 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-xs text-xs">
                      {msg.reactions.map((r, ri) => (
                        <span key={ri} title={r.userName}>
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {partnerTyping && (
          <div className="flex items-center gap-1 p-2 bg-[#F0F2F5] rounded-[18px] w-16 text-[#65676B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#65676B] animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#65676B] animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#65676B] animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatMessageFeed
