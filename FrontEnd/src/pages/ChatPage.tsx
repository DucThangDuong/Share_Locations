import React, { useState, useRef, useEffect, useMemo } from 'react'
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
  onBack?: () => void
  onSelectPlace?: (placeId: number) => void
  onViewTripDetail?: (tripId: number) => void
  showToast?: (msg: string) => void
}

export default function ChatPage({
  initialConversationId,
  onBack,
  onSelectPlace,
  showToast = () => { },
}: ChatPageProps) {
  const { user } = useAuth()
  const { defaultUserAvatar, defaultGroupAvatar } = useSystemSettings()
  const {
    inbox,
    isLoadingInbox,
    activeRoomId,
    activeRoom,
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

  const [showRightDrawer, setShowRightDrawer] = useState(true)
  const [showPlacePicker, setShowPlacePicker] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRoomIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (initialConversationId) {
      const parsedId = Number(initialConversationId)
      if (!isNaN(parsedId) && activeRoomId !== parsedId && initializedRoomIdRef.current !== parsedId) {
        initializedRoomIdRef.current = parsedId
        selectRoom(parsedId)
      }
    } else if (!activeRoomId && inbox.length > 0 && initializedRoomIdRef.current === null) {
      const firstRoomId = inbox[0].roomId
      initializedRoomIdRef.current = firstRoomId
      selectRoom(firstRoomId)
    }
  }, [initialConversationId, activeRoomId, inbox.length, selectRoom])

  const handleSelectRoom = (roomId: number) => {
    if (roomId === activeRoomId) return
    initializedRoomIdRef.current = roomId
    selectRoom(roomId)
    window.history.replaceState(null, '', `/chat?conversation=${roomId}`)
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

  const roomTitle = activeRoom?.name || 'Cuộc trò chuyện'
  const roomAvatar =
    activeRoom?.avatarUrl ||
    (activeRoom?.isGroup
      ? defaultGroupAvatar
      : defaultUserAvatar)

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
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            onBack={onBack}
          />

          <main className="flex-1 min-w-0 h-full flex flex-col bg-white relative overflow-hidden">
            <ChatMessageFeed
              roomTitle={roomTitle}
              roomAvatar={roomAvatar}
              isGroup={activeRoom?.isGroup}
              partnerTyping={partnerTyping}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              hasMoreMessages={hasMoreMessages}
              isLoadingMoreMessages={isLoadingMoreMessages}
              onLoadMoreMessages={() => loadMoreMessages(activeRoomId || undefined)}
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
          </main>

          <ChatDrawer
            isOpen={showRightDrawer}
            roomTitle={roomTitle}
            roomAvatar={roomAvatar}
            isGroup={activeRoom?.isGroup}
            roomId={activeRoomId}
            images={allMediaAttachments}
            onPreviewImage={(url) => setLightboxImage(url)}
          />
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
