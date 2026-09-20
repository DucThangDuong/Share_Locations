import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import { useAuth } from './AuthContext'
import {
  chatService,
  type InboxItemDto,
  type ChatMessageDto,
  type SendMessagePayload,
} from '@/services/chatService'
import { chatSignalR } from '@/services/chatSignalR'
import { playChatChime } from '@/utils/audio'

export interface IncomingMessageToast {
  id: number
  roomId: number
  senderName: string
  senderAvatar: string | null
  snippet: string
  createdAt: string
}

interface ChatContextType {
  inbox: InboxItemDto[]
  isLoadingInbox: boolean
  activeRoomId: number | null
  activeRoom: InboxItemDto | null
  messages: ChatMessageDto[]
  isLoadingMessages: boolean
  hasMoreMessages: boolean
  isLoadingMoreMessages: boolean
  loadMoreMessages: (roomId?: number) => Promise<void>
  totalUnreadCount: number
  partnerTyping: boolean

  // Real-time Facebook-style Toast Notification
  incomingToast: IncomingMessageToast | null
  dismissIncomingToast: () => void

  // Header Dropdown State
  isHeaderDropdownOpen: boolean
  setIsHeaderDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleHeaderDropdown: () => void

  // Floating Chat & Chat Head State
  isFloatingChatOpen: boolean
  isFloatingChatMinimized: boolean
  floatingRoomIds: number[]
  openFloatingChat: (roomId?: number, targetUserId?: number) => Promise<void>
  minimizeFloatingChat: () => void
  restoreFloatingChat: (roomId?: number) => void
  closeFloatingChat: () => void
  closeChatHead: (roomId: number) => void

  // Actions
  fetchInbox: () => Promise<void>
  selectRoom: (roomId: number) => Promise<void>
  openDirectChatWithUser: (targetUserId: number) => Promise<number | null>
  createGroupChat: (name: string, memberIds: number[]) => Promise<number | null>
  addMembersToGroup: (roomId: number, userIds: number[]) => Promise<void>
  renameGroup: (roomId: number, name: string) => Promise<void>
  removeMemberFromGroup: (roomId: number, userId: number) => Promise<void>
  leaveGroupChat: (roomId: number) => Promise<void>
  sendMessage: (payload: Omit<SendMessagePayload, 'roomId'>) => Promise<ChatMessageDto | null>
  editMessage: (messageId: number, content: string, roomId?: number) => Promise<void>
  deleteMessage: (messageId: number, roomId?: number) => Promise<void>
  markRoomAsRead: (roomId: number) => Promise<void>
  addReaction: (messageId: number, emoji: string) => Promise<void>
  sendTyping: (isTyping: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth()

  const [inbox, setInbox] = useState<InboxItemDto[]>([])
  const [isLoadingInbox, setIsLoadingInbox] = useState(false)

  const [activeRoomId, setActiveRoomId] = useState<number | null>(null)
  const [messagesMap, setMessagesMap] = useState<Record<number, ChatMessageDto[]>>({})
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [paginationMap, setPaginationMap] = useState<
    Record<number, { page: number; hasMore: boolean; isLoadingMore: boolean }>
  >({})

  // Typing state: roomId -> userId -> boolean
  const [typingUsers, setTypingUsers] = useState<Record<number, number[]>>({})

  // Header popup dropdown
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false)

  // Floating mini chat & Chat Head
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false)
  const [isFloatingChatMinimized, setIsFloatingChatMinimized] = useState(false)
  const [floatingRoomIds, setFloatingRoomIds] = useState<number[]>([])

  // Real-time Facebook-style Toast Notification
  const [incomingToast, setIncomingToast] = useState<IncomingMessageToast | null>(null)
  const dismissIncomingToast = useCallback(() => setIncomingToast(null), [])

  const activeRoomIdRef = useRef<number | null>(activeRoomId)
  activeRoomIdRef.current = activeRoomId
  const isFloatingChatOpenRef = useRef(isFloatingChatOpen)
  isFloatingChatOpenRef.current = isFloatingChatOpen
  const isFloatingChatMinimizedRef = useRef(isFloatingChatMinimized)
  isFloatingChatMinimizedRef.current = isFloatingChatMinimized
  const floatingRoomIdsRef = useRef(floatingRoomIds)
  floatingRoomIdsRef.current = floatingRoomIds

  // 1. Fetch Inbox from Backend and auto-join all rooms via SignalR
  const fetchInbox = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoadingInbox(true)
    try {
      const items = await chatService.getInbox()
      setInbox(items)

      // Auto join all rooms so client receives messages in real time
      if (chatSignalR.isConnected() && items.length > 0) {
        await chatSignalR.joinRooms(items.map((i) => i.roomId))
      }
    } catch (err) {
      console.error('[ChatContext] Error fetching inbox:', err)
    } finally {
      setIsLoadingInbox(false)
    }
  }, [isAuthenticated])

  // 2. Fetch Messages for a Room (Page 1)
  const fetchMessages = useCallback(async (roomId: number) => {
    setIsLoadingMessages(true)
    try {
      const msgs = await chatService.getRoomMessages(roomId, 1, 50)
      setPaginationMap((prev) => ({
        ...prev,
        [roomId]: {
          page: 1,
          hasMore: msgs.length >= 50,
          isLoadingMore: false,
        },
      }))

      setMessagesMap((prev) => {
        const existing = prev[roomId] || []
        const map = new Map<number, ChatMessageDto>()
        msgs.forEach((m) => map.set(m.id, m))
        existing.forEach((m) => map.set(m.id, m))

        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        return {
          ...prev,
          [roomId]: sorted,
        }
      })
    } catch (err) {
      console.error(`[ChatContext] Error fetching messages for room ${roomId}:`, err)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  // 3. Load Older Messages (Pagination)
  const loadMoreMessages = useCallback(
    async (roomId?: number) => {
      const targetRoomId = roomId || activeRoomIdRef.current
      if (!targetRoomId) return

      const current = paginationMap[targetRoomId] || {
        page: 1,
        hasMore: true,
        isLoadingMore: false,
      }

      if (!current.hasMore || current.isLoadingMore) {
        return
      }

      const nextPage = current.page + 1

      setPaginationMap((prev) => ({
        ...prev,
        [targetRoomId]: {
          ...current,
          isLoadingMore: true,
        },
      }))

      try {
        const olderMsgs = await chatService.getRoomMessages(targetRoomId, nextPage, 50)

        setPaginationMap((prev) => ({
          ...prev,
          [targetRoomId]: {
            page: nextPage,
            hasMore: olderMsgs.length >= 50,
            isLoadingMore: false,
          },
        }))

        if (olderMsgs.length > 0) {
          setMessagesMap((prev) => {
            const existing = prev[targetRoomId] || []
            const map = new Map<number, ChatMessageDto>()
            olderMsgs.forEach((m) => map.set(m.id, m))
            existing.forEach((m) => map.set(m.id, m))

            const sorted = Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            return {
              ...prev,
              [targetRoomId]: sorted,
            }
          })
        }
      } catch (err) {
        console.error(`[ChatContext] Error loading more messages for room ${targetRoomId}:`, err)
        setPaginationMap((prev) => ({
          ...prev,
          [targetRoomId]: {
            ...current,
            isLoadingMore: false,
          },
        }))
      }
    },
    [paginationMap]
  )

  // 3. SignalR Connection & Real-time Event Subscription
  useEffect(() => {
    if (!isAuthenticated) {
      chatSignalR.stopConnection()
      setInbox([])
      setMessagesMap({})
      setActiveRoomId(null)
      setIncomingToast(null)
      return
    }

    let isSubscribed = true

    const setupSignalR = async () => {
      await chatSignalR.startConnection()
      if (!isSubscribed) return

      // Load initial inbox and auto-join all rooms
      try {
        const items = await chatService.getInbox()
        if (!isSubscribed) return
        setInbox(items)
        if (items.length > 0) {
          await chatSignalR.joinRooms(items.map((i) => i.roomId))
        }
      } catch (err) {
        console.error('[ChatContext] Initial inbox load failed:', err)
      }
    }

    setupSignalR()

    // ── EVENT: OnReconnected (Re-join all rooms automatically) ──
    const unsubReconnect = chatSignalR.onReconnected(async () => {
      try {
        const items = await chatService.getInbox()
        setInbox(items)
        if (items.length > 0) {
          await chatSignalR.joinRooms(items.map((i) => i.roomId))
        }
      } catch (err) {
        console.warn('[ChatContext] Reconnect sync error:', err)
      }
    })

    // ── EVENT: ReceiveMessage ──
    const unsubReceive = chatSignalR.onReceiveMessage((newMsg: ChatMessageDto) => {
      const msgRoomId = Number(newMsg.roomId)
      const currentRoomId = activeRoomIdRef.current ? Number(activeRoomIdRef.current) : null
      const isCurrentRoom = currentRoomId === msgRoomId
      const isChatActivelyOpen =
        isCurrentRoom &&
        ((isFloatingChatOpenRef.current && !isFloatingChatMinimizedRef.current) ||
          window.location.pathname.startsWith('/chat'))

      // Append to messages map
      setMessagesMap((prev) => {
        const existing = prev[msgRoomId] || []
        if (existing.some((m) => m.id === newMsg.id)) {
          return prev
        }
        return {
          ...prev,
          [msgRoomId]: [...existing, newMsg],
        }
      })

      // Update inbox preview and unread count
      setInbox((prev) => {
        const found = prev.find((item) => item.roomId === msgRoomId)
        if (found) {
          return prev.map((item) =>
            item.roomId === msgRoomId
              ? {
                  ...item,
                  lastMessage: newMsg.content || (newMsg.attachments?.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
                  lastMessageAt: newMsg.createdAt,
                  unreadCount: isChatActivelyOpen ? 0 : (item.unreadCount || 0) + 1,
                }
              : item
          )
        } else {
          // If not in inbox yet, refresh inbox and join new room
          fetchInbox()
          return prev
        }
      })

      // If message is from friend:
      const currentUserId = user?.id ? Number(user.id) : null
      if (newMsg.senderId !== currentUserId) {
        playChatChime('receive')

        // Automatically add to floatingRoomIds so chat head / lighticon appears (capped at 5 heads)
        setFloatingRoomIds((prev) => {
          const filtered = prev.filter((id) => id !== newMsg.roomId)
          return [newMsg.roomId, ...filtered].slice(0, 5)
        })

        // If chat is actively open for this room, notify backend that it is read immediately
        if (isChatActivelyOpen) {
          chatService.markRoomAsRead(newMsg.roomId).catch((err) => {
            console.warn('[ChatContext] Auto mark read error:', err)
          })
        } else {
          // Chat is minimized or closed: keep unread, pop up lighticon & toast bubble
          setIsFloatingChatOpen(true)
          setIsFloatingChatMinimized(true)

          let snippet = newMsg.content || ''
          if (!snippet && newMsg.attachments && newMsg.attachments.length > 0) {
            const first = newMsg.attachments[0]
            if (first.attachmentType === 4) snippet = '📷 Đã gửi một ảnh'
            else if (first.attachmentType === 1) snippet = `📍 Đã chia sẻ địa điểm: ${first.placeName || ''}`
            else snippet = '📄 Đã gửi một tệp đính kèm'
          }

          setIncomingToast({
            id: newMsg.id,
            roomId: newMsg.roomId,
            senderName: newMsg.senderName,
            senderAvatar: newMsg.senderAvatarUrl,
            snippet: snippet || 'Tin nhắn mới',
            createdAt: newMsg.createdAt,
          })
        }
      }
    })

    // ── EVENT: MessageRead ──
    const unsubRead = chatSignalR.onMessageRead((roomId, userId) => {
      const currentUserId = user?.id ? Number(user.id) : null
      if (userId === currentUserId) {
        setInbox((prev) =>
          prev.map((item) => (item.roomId === roomId ? { ...item, unreadCount: 0 } : item))
        )
      }
    })

    // ── EVENT: MessageReacted ──
    const unsubReacted = chatSignalR.onMessageReacted((roomId, messageId, reactedUserId, emoji) => {
      setMessagesMap((prev) => {
        const roomMsgs = prev[roomId]
        if (!roomMsgs) return prev

        return {
          ...prev,
          [roomId]: roomMsgs.map((msg) => {
            if (msg.id !== messageId) return msg

            const existingReactions = [...msg.reactions]
            const foundIdx = existingReactions.findIndex((r) => r.userId === reactedUserId)

            if (foundIdx >= 0) {
              existingReactions[foundIdx] = {
                ...existingReactions[foundIdx],
                emoji,
              }
            } else {
              existingReactions.push({
                messageId,
                userId: reactedUserId,
                userName: '',
                emoji,
                createdAt: new Date().toISOString(),
              })
            }

            return { ...msg, reactions: existingReactions }
          }),
        }
      })
    })

    // ── EVENT: UserTyping ──
    const unsubTyping = chatSignalR.onUserTyping((roomId, typingUserId, isTyping) => {
      const currentUserId = user?.id ? Number(user.id) : null
      if (typingUserId === currentUserId) return

      setTypingUsers((prev) => {
        const currentList = prev[roomId] || []
        if (isTyping) {
          if (!currentList.includes(typingUserId)) {
            return { ...prev, [roomId]: [...currentList, typingUserId] }
          }
        } else {
          return { ...prev, [roomId]: currentList.filter((id) => id !== typingUserId) }
        }
        return prev
      })
    })

    // ── EVENT: MessageEdited ──
    const unsubEdited = chatSignalR.onMessageEdited((updatedMsg) => {
      const roomId = updatedMsg.roomId
      setMessagesMap((prev) => {
        const roomMsgs = prev[roomId]
        if (!roomMsgs) return prev
        return {
          ...prev,
          [roomId]: roomMsgs.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)),
        }
      })
      setInbox((prev) =>
        prev.map((item) =>
          item.roomId === roomId
            ? {
                ...item,
                lastMessage: updatedMsg.content || item.lastMessage,
              }
            : item
        )
      )
    })

    // ── EVENT: MessageDeleted ──
    const unsubDeleted = chatSignalR.onMessageDeleted((roomId, messageId) => {
      setMessagesMap((prev) => {
        const roomMsgs = prev[roomId]
        if (!roomMsgs) return prev
        return {
          ...prev,
          [roomId]: roomMsgs.filter((m) => m.id !== messageId),
        }
      })
    })

    return () => {
      isSubscribed = false
      unsubReconnect()
      unsubReceive()
      unsubRead()
      unsubReacted()
      unsubTyping()
      unsubEdited()
      unsubDeleted()
      chatSignalR.stopConnection()
    }
  }, [isAuthenticated, user?.id, fetchInbox])

  // Select room & join SignalR group
  const selectRoom = useCallback(
    async (roomId: number) => {
      setActiveRoomId(roomId)
      await chatSignalR.joinRoom(roomId)

      // Always fetch latest room message history from backend API
      await fetchMessages(roomId)

      // Mark room as read
      try {
        await chatService.markRoomAsRead(roomId)
        setInbox((prev) =>
          prev.map((item) => (item.roomId === roomId ? { ...item, unreadCount: 0 } : item))
        )
      } catch (err) {
        console.warn(`[ChatContext] Mark read failed for room ${roomId}:`, err)
      }
    },
    [fetchMessages]
  )

  // Start 1-1 direct chat with a user
  const openDirectChatWithUser = useCallback(
    async (targetUserId: number): Promise<number | null> => {
      try {
        const roomId = await chatService.getOrCreateDirectRoom(targetUserId)
        if (roomId) {
          await selectRoom(roomId)
          await fetchInbox()
          return roomId
        }
      } catch (err) {
        console.error('[ChatContext] Create direct room failed:', err)
      }
      return null
    },
    [selectRoom, fetchInbox]
  )

  // Create Group Chat
  const createGroupChat = useCallback(
    async (name: string, memberIds: number[]): Promise<number | null> => {
      try {
        const roomId = await chatService.createGroupRoom({ name, memberIds })
        if (roomId) {
          await fetchInbox()
          await selectRoom(roomId)
          setFloatingRoomIds((prev) => {
            const filtered = prev.filter((id) => id !== roomId)
            return [roomId, ...filtered].slice(0, 5)
          })
          return roomId
        }
      } catch (err) {
        console.error('[ChatContext] Create group chat failed:', err)
        throw err
      }
      return null
    },
    [fetchInbox, selectRoom]
  )

  // Add Members to Group
  const addMembersToGroup = useCallback(
    async (roomId: number, userIds: number[]) => {
      try {
        await chatService.addMembersToRoom(roomId, userIds)
        await fetchInbox()
      } catch (err) {
        console.error('[ChatContext] Add members to group failed:', err)
        throw err
      }
    },
    [fetchInbox]
  )

  // Rename Group
  const renameGroup = useCallback(
    async (roomId: number, name: string) => {
      try {
        await chatService.renameGroupRoom(roomId, name)
      } catch (err) {
        console.warn('[ChatContext] renameGroupRoom API call failed, updating locally:', err)
      }
      setInbox((prev) =>
        prev.map((item) => (item.roomId === roomId ? { ...item, name } : item))
      )
    },
    []
  )

  // Remove Member from Group
  const removeMemberFromGroup = useCallback(
    async (roomId: number, userId: number) => {
      await chatService.removeMemberFromRoom(roomId, userId)
    },
    []
  )

  // Open Floating Chat Widget
  const openFloatingChat = useCallback(
    async (roomId?: number, targetUserId?: number) => {
      setIsHeaderDropdownOpen(false)
      setIsFloatingChatOpen(true)
      setIsFloatingChatMinimized(false)

      let targetRoomId = roomId
      if (targetUserId) {
        const created = await openDirectChatWithUser(targetUserId)
        if (created) targetRoomId = created
      } else if (roomId) {
        await selectRoom(roomId)
      } else if (!activeRoomId && inbox.length > 0) {
        targetRoomId = inbox[0].roomId
        await selectRoom(targetRoomId)
      } else if (activeRoomId) {
        targetRoomId = activeRoomId
      }

      if (targetRoomId) {
        setFloatingRoomIds((prev) => {
          const filtered = prev.filter((id) => id !== targetRoomId)
          return [targetRoomId!, ...filtered].slice(0, 5)
        })
      }
    },
    [selectRoom, openDirectChatWithUser, activeRoomId, inbox]
  )

  const minimizeFloatingChat = useCallback(() => {
    setIsFloatingChatMinimized(true)
    setIsFloatingChatOpen(true)
    if (activeRoomIdRef.current) {
      const current = activeRoomIdRef.current
      setFloatingRoomIds((prev) => {
        const filtered = prev.filter((id) => id !== current)
        return [current, ...filtered].slice(0, 5)
      })
    }
  }, [])

  const restoreFloatingChat = useCallback(
    (roomId?: number) => {
      const targetRoomId =
        roomId ||
        activeRoomIdRef.current ||
        (floatingRoomIdsRef.current.length > 0 ? floatingRoomIdsRef.current[0] : null)

      setIsFloatingChatMinimized(false)
      setIsFloatingChatOpen(true)

      if (targetRoomId) {
        selectRoom(targetRoomId)
        setFloatingRoomIds((prev) => {
          const filtered = prev.filter((id) => id !== targetRoomId)
          return [targetRoomId, ...filtered].slice(0, 5)
        })
      }
    },
    [selectRoom]
  )

  const closeFloatingChat = useCallback(() => {
    setIsFloatingChatOpen(false)
    setIsFloatingChatMinimized(false)
    setFloatingRoomIds([])
  }, [])

  const closeChatHead = useCallback(
    (roomId: number) => {
      setFloatingRoomIds((prev) => {
        const next = prev.filter((id) => id !== roomId)
        if (next.length === 0) {
          setIsFloatingChatOpen(false)
          setIsFloatingChatMinimized(false)
          setActiveRoomId(null)
        } else if (activeRoomIdRef.current === roomId) {
          selectRoom(next[0])
        }
        return next
      })
    },
    [selectRoom]
  )

  // Leave Group Chat
  const leaveGroupChat = useCallback(
    async (roomId: number) => {
      try {
        await chatService.leaveGroupRoom(roomId)
      } catch (err) {
        console.error('[ChatContext] leaveGroupRoom API failed:', err)
        throw err
      }
      // Dọn dẹp state local sau khi API thành công
      if (activeRoomIdRef.current === roomId) {
        setActiveRoomId(null)
      }
      setInbox((prev) => prev.filter((item) => item.roomId !== roomId))
      closeChatHead(roomId)
    },
    [closeChatHead]
  )

  const toggleHeaderDropdown = useCallback(() => {
    setIsHeaderDropdownOpen((prev) => !prev)
  }, [])

  // Send Message
  const sendMessage = useCallback(
    async (payload: Omit<SendMessagePayload, 'roomId'>): Promise<ChatMessageDto | null> => {
      const roomId = activeRoomIdRef.current
      if (!roomId) return null

      try {
        const sentMsg = await chatService.sendMessage({
          ...payload,
          roomId,
        })

        // Optimistically or directly update message list
        if (sentMsg) {
          setMessagesMap((prev) => {
            const existing = prev[roomId] || []
            if (existing.some((m) => m.id === sentMsg.id)) return prev
            return {
              ...prev,
              [roomId]: [...existing, sentMsg],
            }
          })

          setInbox((prev) =>
            prev.map((item) =>
              item.roomId === roomId
                ? {
                    ...item,
                    lastMessage: sentMsg.content || (sentMsg.attachments.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
                    lastMessageAt: sentMsg.createdAt,
                  }
                : item
            )
          )

          playChatChime('send')
        }

        return sentMsg
      } catch (err) {
        console.error('[ChatContext] Send message failed:', err)
        throw err
      }
    },
    []
  )

  // Edit Message
  const editMessage = useCallback(
    async (messageId: number, content: string, customRoomId?: number) => {
      const roomId = customRoomId || activeRoomIdRef.current
      if (!roomId) return

      try {
        const updated = await chatService.editMessage(messageId, content, roomId)
        setMessagesMap((prev) => {
          const list = prev[roomId] || []
          return {
            ...prev,
            [roomId]: list.map((m) =>
              m.id === messageId ? { ...m, content: updated?.content ?? content } : m
            ),
          }
        })
        setInbox((prev) =>
          prev.map((item) =>
            item.roomId === roomId ? { ...item, lastMessage: content } : item
          )
        )
      } catch (err) {
        console.error('[ChatContext] editMessage failed:', err)
        throw err
      }
    },
    []
  )

  // Delete Message
  const deleteMessage = useCallback(
    async (messageId: number, customRoomId?: number) => {
      const roomId = customRoomId || activeRoomIdRef.current
      if (!roomId) return

      try {
        await chatService.deleteMessage(messageId, roomId)
        setMessagesMap((prev) => {
          const list = prev[roomId] || []
          return {
            ...prev,
            [roomId]: list.filter((m) => m.id !== messageId),
          }
        })
      } catch (err) {
        console.error('[ChatContext] deleteMessage failed:', err)
        throw err
      }
    },
    []
  )

  // Mark room as read
  const markRoomAsRead = useCallback(async (roomId: number) => {
    try {
      await chatService.markRoomAsRead(roomId)
      setInbox((prev) =>
        prev.map((item) => (item.roomId === roomId ? { ...item, unreadCount: 0 } : item))
      )
    } catch (err) {
      console.error('[ChatContext] markRoomAsRead failed:', err)
    }
  }, [])

  // Add Reaction
  const addReaction = useCallback(async (messageId: number, emoji: string) => {
    const roomId = activeRoomIdRef.current
    if (!roomId) return

    try {
      await chatService.addMessageReaction(roomId, messageId, emoji)
    } catch (err) {
      console.error('[ChatContext] addReaction failed:', err)
    }
  }, [])

  // Send typing indicator to SignalR
  const sendTyping = useCallback((isTyping: boolean) => {
    const roomId = activeRoomIdRef.current
    if (!roomId) return
    chatSignalR.sendTyping(roomId, isTyping)
  }, [])

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null
    return inbox.find((item) => item.roomId === activeRoomId) || null
  }, [inbox, activeRoomId])

  const messages = useMemo(() => {
    if (!activeRoomId) return []
    return messagesMap[activeRoomId] || []
  }, [messagesMap, activeRoomId])

  const totalUnreadCount = useMemo(() => {
    return inbox.reduce((sum, item) => sum + (item.unreadCount || 0), 0)
  }, [inbox])

  const hasMoreMessages = useMemo(() => {
    if (!activeRoomId) return false
    return paginationMap[activeRoomId]?.hasMore ?? false
  }, [activeRoomId, paginationMap])

  const isLoadingMoreMessages = useMemo(() => {
    if (!activeRoomId) return false
    return paginationMap[activeRoomId]?.isLoadingMore ?? false
  }, [activeRoomId, paginationMap])

  const partnerTyping = useMemo(() => {
    if (!activeRoomId) return false
    const typers = typingUsers[activeRoomId]
    return Boolean(typers && typers.length > 0)
  }, [typingUsers, activeRoomId])

  return (
    <ChatContext.Provider
      value={{
        inbox,
        isLoadingInbox,
        activeRoomId,
        activeRoom,
        messages,
        isLoadingMessages,
        hasMoreMessages,
        isLoadingMoreMessages,
        loadMoreMessages,
        totalUnreadCount,
        partnerTyping,
        incomingToast,
        dismissIncomingToast,
        isHeaderDropdownOpen,
        setIsHeaderDropdownOpen,
        toggleHeaderDropdown,
        isFloatingChatOpen,
        isFloatingChatMinimized,
        floatingRoomIds,
        openFloatingChat,
        minimizeFloatingChat,
        restoreFloatingChat,
        closeFloatingChat,
        closeChatHead,
        fetchInbox,
        selectRoom,
        openDirectChatWithUser,
        createGroupChat,
        addMembersToGroup,
        renameGroup,
        removeMemberFromGroup,
        leaveGroupChat,
        sendMessage,
        editMessage,
        deleteMessage,
        markRoomAsRead,
        addReaction,
        sendTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
