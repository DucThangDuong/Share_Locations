import { apiClient } from './apiClient'

export const MessageAttachmentType = {
  Place: 1,
  Food: 2,
  Trip: 3,
  Image: 4,
  File: 5,
  Audio: 6,
} as const

export type MessageAttachmentType = (typeof MessageAttachmentType)[keyof typeof MessageAttachmentType]

export interface InboxItemDto {
  roomId: number
  name: string
  avatarUrl: string | null
  isGroup: boolean
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  otherUserId: number | null
}

export interface MessageAttachmentDto {
  id: number
  attachmentType: MessageAttachmentType
  mediaUrl: string | null
  fileName: string | null
  fileSizeBytes: number | null
  durationSeconds: number | null
  displayOrder: number
  placeId?: number | null
  placeName?: string | null
  placeCoverUrl?: string | null
  foodId?: number | null
  foodName?: string | null
  foodCoverUrl?: string | null
  tripId?: number | null
  tripTitle?: string | null
  tripCoverUrl?: string | null
}

export interface MessageReactionDto {
  messageId: number
  userId: number
  userName: string
  emoji: string
  createdAt: string
}

export interface ChatMessageDto {
  id: number
  roomId: number
  senderId: number
  senderName: string
  senderAvatarUrl: string | null
  content: string | null
  replyToMessageId: number | null
  replyToMessageSnippet: string | null
  replyToSenderName: string | null
  createdAt: string
  attachments: MessageAttachmentDto[]
  reactions: MessageReactionDto[]
}

export interface SendMessagePayload {
  roomId: number
  content?: string
  replyToMessageId?: number
  placeId?: number
  foodId?: number
  tripId?: number
  files?: File[]
}

export interface ChatRoomMemberDto {
  userId: number
  name: string
  avatarUrl: string | null
  email: string | null
  joinedAt: string
  isAdmin: boolean
  role: string
}

export const chatService = {
  // 1. Lấy danh sách hộp thư (Inbox)
  getInbox: async (): Promise<InboxItemDto[]> => {
    const response = await apiClient.get<any>('/api/chat/inbox')
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.items)) return payload.data.items
    if (Array.isArray(payload?.items)) return payload.items
    return []
  },

  // 2. Lấy hoặc tạo phòng chat 1-1 với người dùng khác
  getOrCreateDirectRoom: async (targetUserId: number): Promise<number> => {
    const response = await apiClient.post<any>(`/api/chat/direct/${targetUserId}`)
    const payload = response.data
    return payload?.data?.roomId ?? payload?.roomId ?? payload?.data ?? payload
  },

  // 3. Lấy lịch sử tin nhắn của phòng chat
  getRoomMessages: async (roomId: number, page = 1, limit = 50): Promise<ChatMessageDto[]> => {
    const response = await apiClient.get<any>(`/api/chat/rooms/${roomId}/messages`, {
      params: { page, limit },
    })
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.items)) return payload.data.items
    if (Array.isArray(payload?.items)) return payload.items
    return []
  },

  // 4. Gửi tin nhắn vào phòng chat (hỗ trợ text, quote reply, thẻ địa điểm/món ăn/lịch trình, tệp đính kèm)
  sendMessage: async (payload: SendMessagePayload): Promise<ChatMessageDto> => {
    const formData = new FormData()
    formData.append('roomId', payload.roomId.toString())
    if (payload.content) formData.append('content', payload.content)
    if (payload.replyToMessageId) formData.append('replyToMessageId', payload.replyToMessageId.toString())
    if (payload.placeId) formData.append('placeId', payload.placeId.toString())
    if (payload.foodId) formData.append('foodId', payload.foodId.toString())
    if (payload.tripId) formData.append('tripId', payload.tripId.toString())
    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => {
        formData.append('files', file)
      })
    }

    const response = await apiClient.post<{ data: ChatMessageDto }>(
      `/api/chat/rooms/${payload.roomId}/messages`,
      formData
    )
    return response.data?.data
  },

  // 5. Đánh dấu đã đọc phòng chat
  markRoomAsRead: async (roomId: number): Promise<void> => {
    await apiClient.put(`/api/chat/rooms/${roomId}/read`)
  },

  // 6. Thả cảm xúc (reaction) cho tin nhắn
  addMessageReaction: async (roomId: number, messageId: number, emoji: string): Promise<void> => {
    await apiClient.post(`/api/chat/messages/${messageId}/reactions`, {
      roomId,
      messageId,
      emoji,
    })
  },

  // 7. Tạo phòng chat nhóm
  createGroupRoom: async (payload: { name: string; memberIds: number[] }): Promise<number> => {
    const response = await apiClient.post<any>('/api/chat/group', {
      name: payload.name,
      memberIds: payload.memberIds,
    })
    const data = response.data
    const roomId = data?.data?.roomId ?? data?.roomId ?? data?.data?.id ?? data?.data ?? data
    return Number(roomId)
  },

  // 8. Mời thêm thành viên vào nhóm
  addMembersToRoom: async (roomId: number, userIds: number[]): Promise<void> => {
    await apiClient.post(`/api/chat/rooms/${roomId}/members`, {
      userIds,
    })
  },

  // 9. Lấy danh sách thành viên phòng chat
  getRoomMembers: async (roomId: number): Promise<ChatRoomMemberDto[]> => {
    try {
      const response = await apiClient.get<any>(`/api/chat/rooms/${roomId}/members`)
      const payload = response.data
      let list: any[] = []
      if (Array.isArray(payload)) list = payload
      else if (Array.isArray(payload?.data)) list = payload.data
      else if (Array.isArray(payload?.data?.items)) list = payload.data.items
      else if (Array.isArray(payload?.items)) list = payload.items

      return list.map((m: any) => ({
        userId: Number(m.userId ?? m.id ?? 0),
        name: m.name ?? m.fullName ?? m.displayName ?? m.userName ?? 'Thành viên',
        avatarUrl: m.avatarUrl ?? m.avatar ?? null,
        email: m.email ?? null,
        joinedAt: m.joinedAt ?? m.createdAt ?? new Date().toISOString(),
        isAdmin: Boolean(m.isAdmin ?? m.role === 'Admin'),
        role: m.role ?? (m.isAdmin ? 'Admin' : 'Member'),
      }))
    } catch (err) {
      console.warn('Failed to get room members from API:', err)
      return []
    }
  },

  // 10. Đổi tên phòng chat nhóm
  renameGroupRoom: async (roomId: number, name: string): Promise<void> => {
    await apiClient.put(`/api/chat/rooms/${roomId}/name`, { roomId, name })
  },

  // 11. Xóa thành viên khỏi phòng chat nhóm
  removeMemberFromRoom: async (roomId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/api/chat/rooms/${roomId}/members/${userId}`)
  },

  // 12. Rời khỏi phòng chat nhóm
  leaveGroupRoom: async (roomId: number): Promise<void> => {
    await apiClient.post(`/api/chat/rooms/${roomId}/leave`)
  },

  // 13. Sửa tin nhắn
  editMessage: async (messageId: number, content: string, roomId?: number): Promise<ChatMessageDto> => {
    try {
      const response = await apiClient.put<any>(`/api/chat/messages/${messageId}`, {
        content,
        roomId,
      })
      const payload = response.data
      return payload?.data ?? payload
    } catch (err) {
      if (roomId) {
        const response = await apiClient.put<any>(`/api/chat/rooms/${roomId}/messages/${messageId}`, {
          content,
        })
        const payload = response.data
        return payload?.data ?? payload
      }
      throw err
    }
  },

  // 14. Xóa tin nhắn
  deleteMessage: async (messageId: number, roomId?: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/chat/messages/${messageId}`)
    } catch (err) {
      if (roomId) {
        await apiClient.delete(`/api/chat/rooms/${roomId}/messages/${messageId}`)
      } else {
        throw err
      }
    }
  },
}

export default chatService

