import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { MessageAttachmentType, type MessageAttachmentDto } from '@/services/chatService'
import type { PlaceSummaryDto } from '@/types/models/place.model'
import {
  ChatSidebar,
  ChatMessageFeed,
  ChatInputBar,
  ChatDrawer,
  ChatPlacePickerModal,
  ChatCallModal,
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

  // Input states
  const [inputText, setInputText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: number; senderName: string; text: string } | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Modals & Drawers
  const [showRightDrawer, setShowRightDrawer] = useState(true)
  const [showPlacePicker, setShowPlacePicker] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [callModal, setCallModal] = useState<{
    isOpen: boolean
    type: 'voice' | 'video'
    partnerName: string
    partnerAvatar: string
  } | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle initial conversation ID or select first
  useEffect(() => {
    if (initialConversationId) {
      const parsedId = Number(initialConversationId)
      if (!isNaN(parsedId)) {
        selectRoom(parsedId)
      }
    } else if (!activeRoomId && inbox.length > 0) {
      selectRoom(inbox[0].roomId)
    }
  }, [initialConversationId, inbox, activeRoomId, selectRoom])

  // Scroll to bottom on new messages / typing
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

  // Shared media in right drawer
  const { allMediaAttachments, allFileAttachments } = useMemo(() => {
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
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'

  return (
    <div className="flex h-full w-full bg-[#F0F2F5] text-[#050505] antialiased font-sans overflow-hidden">
      {/* Hidden File Inputs */}
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

      {/* CỘT 1: SIDEBAR HỘP THƯ (CỐ ĐỊNH, CUỘN DANH SÁCH RIÊNG) */}
      <ChatSidebar
        inbox={inbox}
        isLoading={isLoadingInbox}
        activeRoomId={activeRoomId}
        onSelectRoom={(roomId) => selectRoom(roomId)}
        onBack={onBack}
      />

      {/* CỘT 2: KHUNG CHAT CHÍNH (CUỘN FEED TIN NHẮN RIÊNG) */}
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
          onOpenPlacePicker={() => setShowPlacePicker(true)}
          onTriggerImageUpload={() => imageInputRef.current?.click()}
          onTriggerFileUpload={() => fileInputRef.current?.click()}
        />
      </main>

      {/* CỘT 3: DRAWER THÔNG TIN ĐOẠN CHAT (PHẢI) */}
      <ChatDrawer
        isOpen={showRightDrawer}
        roomTitle={roomTitle}
        roomAvatar={roomAvatar}
        isGroup={activeRoom?.isGroup}
        roomId={activeRoomId}
        images={allMediaAttachments}
        files={allFileAttachments}
        onPreviewImage={(url) => setLightboxImage(url)}
      />

      {/* MODAL CHỌN ĐỊA ĐIỂM */}
      <ChatPlacePickerModal
        isOpen={showPlacePicker}
        onClose={() => setShowPlacePicker(false)}
        onSelectPlace={handleSharePlace}
      />

      {/* MODAL GỌI THOẠI / VIDEO */}
      <ChatCallModal
        isOpen={!!callModal?.isOpen}
        callType={callModal?.type || 'voice'}
        partnerName={callModal?.partnerName || roomTitle}
        partnerAvatar={callModal?.partnerAvatar || roomAvatar}
        onEndCall={() => setCallModal(null)}
      />

      {/* LIGHTBOX XEM ẢNH */}
      <ChatLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  )
}
