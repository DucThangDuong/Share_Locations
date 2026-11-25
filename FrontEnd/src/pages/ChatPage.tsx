import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, MessageCircle, Loader2, Lock } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { useSystemSettings } from '@/context/SystemSettingsContext'
import { MessageAttachmentType, type MessageAttachmentDto } from '@/services/chatService'
import type { PlaceSummaryDto } from '@/types/models/place.model'
import {
  ChatSidebar,
  ChatMessageFeed,
  ChatInputBar,
  ChatDrawer,
  ChatPlacePickerModal,
  ChatLightbox,
} from '@/components/chat'

interface ChatPageProps {
  initialConversationId?: string
  onConversationChange?: (roomId: number | null) => void
  onBack?: () => void
  onSelectPlace?: (placeId: number) => void
  onViewTripDetail?: (tripId: number) => void
  showToast?: (msg: string) => void
}

export default function ChatPage({
  initialConversationId,
  onConversationChange,
  onBack,
  onSelectPlace,
  showToast = () => { },
}: ChatPageProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { defaultUserAvatar, defaultGroupAvatar } = useSystemSettings()
  const {
    inbox,
    isLoadingInbox,
    hasLoadedInbox,
    activeRoomId,
    activeRoom,
    roomAccessError,
    clearRoomAccessError,
    clearActiveRoom,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isLoadingMoreMessages,
    loadMoreMessages,
    partnerTyping,
    selectRoom,
    sendMessage,
    sendTyping,
  } = useChat()

  const currentUserId = user?.id ? Number(user.id) : null

  const [inputText, setInputText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: number; senderName: string; text: string } | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [invalidConversationError, setInvalidConversationError] = useState<string | null>(null)
  const [isCheckingUrlRoom, setIsCheckingUrlRoom] = useState(false)

  const [showRightDrawer, setShowRightDrawer] = useState(true)
  const [showPlacePicker, setShowPlacePicker] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRoomIdRef = useRef<number | null>(activeRoomId)
  activeRoomIdRef.current = activeRoomId
  const onConversationChangeRef = useRef(onConversationChange)
  onConversationChangeRef.current = onConversationChange

  useEffect(() => {
    if (!isAuthenticated || !hasLoadedInbox) return

    let active = true

    if (initialConversationId) {
      const trimmed = initialConversationId.trim()
      const parsedId = /^\d+$/.test(trimmed) ? Number(trimmed) : NaN

      if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
        clearActiveRoom()
        clearRoomAccessError()
        setInvalidConversationError('Cuộc trò chuyện không tồn tại hoặc mã phòng không hợp lệ.')
        setIsCheckingUrlRoom(false)
        return
      }

      setInvalidConversationError(null)

      if (activeRoomIdRef.current !== null && Number(activeRoomIdRef.current) === parsedId) {
        setIsCheckingUrlRoom(false)
        return
      }

      setIsCheckingUrlRoom(true)
      selectRoom(parsedId).finally(() => {
        if (active) {
          setIsCheckingUrlRoom(false)
        }
      })
    } else {
      setInvalidConversationError(null)
      setIsCheckingUrlRoom(false)
      clearRoomAccessError()
    }

    return () => {
      active = false
    }
  }, [
    initialConversationId,
    isAuthenticated,
    hasLoadedInbox,
    selectRoom,
    clearActiveRoom,
    clearRoomAccessError,
  ])

  useEffect(() => {
    if (
      !initialConversationId &&
      isAuthenticated &&
      hasLoadedInbox &&
      activeRoomId === null &&
      inbox.length > 0
    ) {
      const firstRoomId = inbox[0].roomId
      onConversationChangeRef.current?.(firstRoomId)
      selectRoom(firstRoomId)
    }
  }, [initialConversationId, isAuthenticated, hasLoadedInbox, activeRoomId, inbox, selectRoom])

  const handleSelectRoom = (roomId: number) => {
    const normalizedId = Number(roomId)
    setInvalidConversationError(null)
    clearRoomAccessError()
    setReplyingTo(null)
    onConversationChange?.(normalizedId)
    if (activeRoomId !== null && Number(activeRoomId) === normalizedId) return
    selectRoom(normalizedId)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, partnerTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)

    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 2500)
  }

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputText.trim()
    if (!textToSend && !replyingTo) return

    setIsSending(true)
    try {
      sendTyping(false)
      await sendMessage({
        content: textToSend,
        replyToMessageId: replyingTo?.id,
      })
      setInputText('')
      setReplyingTo(null)
    } catch {
      showToast('Gửi tin nhắn thất bại')
    } finally {
      setIsSending(false)
    }
  }

  const handleSharePlace = async (place: PlaceSummaryDto) => {
    setIsSending(true)
    try {
      await sendMessage({
        placeId: place.id,
      })
      setShowPlacePicker(false)
      showToast(`Đã chia sẻ địa điểm: ${place.name}`)
    } catch {
      showToast('Chia sẻ địa điểm thất bại')
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
      showToast('Đã gửi tệp')
    } catch {
      showToast('Gửi tệp thất bại')
    } finally {
      setIsSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const { allMediaAttachments } = useMemo(() => {
    const images: MessageAttachmentDto[] = []
    const files: MessageAttachmentDto[] = []

    messages.forEach((m) => {
      m.attachments?.forEach((att) => {
        if (att.attachmentType === MessageAttachmentType.Image && att.mediaUrl) {
          images.push(att)
        } else if (att.attachmentType === MessageAttachmentType.File && att.mediaUrl) {
          files.push(att)
        }
      })
    })

    return { allMediaAttachments: images, allFileAttachments: files }
  }, [messages])

  const roomTitle = activeRoom?.name || ''
  const roomAvatar =
    activeRoom?.avatarUrl ||
    (activeRoom?.isGroup
      ? defaultGroupAvatar
      : defaultUserAvatar)

  const effectiveAccessError = invalidConversationError
    ? { code: 404, message: invalidConversationError }
    : roomAccessError

  const isResolvingRoom =
    isAuthLoading ||
    !hasLoadedInbox ||
    isLoadingInbox ||
    isCheckingUrlRoom ||
    (Boolean(initialConversationId) && !effectiveAccessError && !activeRoom && isLoadingMessages)

  if (!isAuthLoading && !isAuthenticated) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">Yêu cầu đăng nhập</h2>
            <p className="text-xs text-slate-500">
              Bạn cần đăng nhập để truy cập các cuộc trò chuyện của mình.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 bg-[#0084FF] hover:bg-[#0073E6] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-slate-50 overflow-hidden flex flex-col">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-full flex flex-col py-2.5">
        <div className="flex-1 flex bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden relative">
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />

          <ChatSidebar
            inbox={inbox}
            isLoading={isLoadingInbox}
            activeRoomId={activeRoom ? activeRoom.roomId : null}
            onSelectRoom={handleSelectRoom}
            onBack={onBack}
          />

          <main className="flex-1 min-w-0 h-full flex flex-col bg-white relative overflow-hidden">
            {effectiveAccessError ? (
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/40">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs text-center space-y-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${effectiveAccessError.code === 403 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-slate-900">
                      {effectiveAccessError.code === 403
                        ? 'Không có quyền truy cập cuộc trò chuyện'
                        : 'Không tìm thấy cuộc trò chuyện'}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {effectiveAccessError.message}
                    </p>
                  </div>
                  {inbox.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectRoom(inbox[0].roomId)}
                      className="px-5 py-2.5 bg-[#0084FF] hover:bg-[#0073E6] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      Mở cuộc trò chuyện của tôi
                    </button>
                  )}
                </div>
              </div>
            ) : isResolvingRoom ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-[#0084FF]" />
                <span className="text-xs font-medium">Đang tải cuộc trò chuyện...</span>
              </div>
            ) : !activeRoom ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3 bg-slate-50/40">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0084FF] flex items-center justify-center">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    {inbox.length > 0 ? 'Chọn một cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    {inbox.length > 0
                      ? 'Hãy chọn một cuộc trò chuyện ở danh sách bên trái để xem tin nhắn.'
                      : 'Kết nối với bạn bè hoặc tạo nhóm trò chuyện mới để bắt đầu nhắn tin.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ChatMessageFeed
                  roomTitle={roomTitle}
                  roomAvatar={roomAvatar}
                  isGroup={activeRoom.isGroup}
                  partnerTyping={partnerTyping}
                  messages={messages}
                  isLoadingMessages={isLoadingMessages}
                  hasMoreMessages={hasMoreMessages}
                  isLoadingMoreMessages={isLoadingMoreMessages}
                  onLoadMoreMessages={() => loadMoreMessages(activeRoom.roomId)}
                  currentUserId={currentUserId}
                  showRightDrawer={showRightDrawer}
                  onToggleRightDrawer={() => setShowRightDrawer((prev) => !prev)}
                  onReplyToMessage={(reply) => setReplyingTo(reply)}
                  onSelectPlace={onSelectPlace}
                  onPreviewImage={(url) => setLightboxImage(url)}
                  messagesEndRef={messagesEndRef}
                />

                <ChatInputBar
                  inputText={inputText}
                  onInputChange={handleInputChange}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  onTriggerImageUpload={() => imageInputRef.current?.click()}
                />
              </>
            )}
          </main>

          {activeRoom && !effectiveAccessError && (
            <ChatDrawer
              isOpen={showRightDrawer}
              roomTitle={roomTitle}
              roomAvatar={roomAvatar}
              isGroup={activeRoom.isGroup}
              roomId={activeRoom.roomId}
              images={allMediaAttachments}
              onPreviewImage={(url) => setLightboxImage(url)}
            />
          )}
        </div>
      </div>

      <ChatPlacePickerModal
        isOpen={showPlacePicker}
        onClose={() => setShowPlacePicker(false)}
        onSelectPlace={handleSharePlace}
      />

      <ChatLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  )
}
