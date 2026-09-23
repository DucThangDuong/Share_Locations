import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  Check,
  Link2,
  Share2,
  MessageCircle,
  Loader2,
  MapPin,
  Star,
  Mail
} from 'lucide-react'
import { chatService, type InboxItemDto } from '@/services/chatService'
import { friendService } from '@/services/friendService'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'
import type { PlaceDetailDto } from '@/types/models/place.model'

interface SharePlaceModalProps {
  isOpen: boolean
  onClose: () => void
  place: PlaceDetailDto
  onToast?: (msg: string) => void
}

interface ShareContact {
  id: string
  name: string
  avatarUrl: string | null
  roomId?: number
  userId?: number
  isGroup?: boolean
}

export const SharePlaceModal: React.FC<SharePlaceModalProps> = ({
  isOpen,
  onClose,
  place,
  onToast
}) => {
  const { isAuthenticated } = useAuth()
  const { fetchInbox } = useChat()

  const [contacts, setContacts] = useState<ShareContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageNote, setMessageNote] = useState('')
  const [sendingContactId, setSendingContactId] = useState<string | null>(null)
  const [sentContactIds, setSentContactIds] = useState<Set<string>>(new Set())
  const [isCopied, setIsCopied] = useState(false)

  // Fetch recent inbox rooms and friends
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return

    let isMounted = true
    const loadContacts = async () => {
      setIsLoadingContacts(true)
      try {
        const [inboxItems, friendsRes] = await Promise.all([
          chatService.getInbox().catch(() => [] as InboxItemDto[]),
          friendService.getFriends().catch(() => null)
        ])

        if (!isMounted) return

        const combinedList: ShareContact[] = []
        const seenIds = new Set<string>()

        // 1. Add active chat rooms (Group & Direct)
        if (Array.isArray(inboxItems)) {
          inboxItems.forEach((room) => {
            const key = `room-${room.roomId}`
            if (!seenIds.has(key)) {
              seenIds.add(key)
              combinedList.push({
                id: key,
                name: room.name || (room.isGroup ? 'Nhóm trò chuyện' : 'Bạn bè'),
                avatarUrl: room.avatarUrl,
                roomId: room.roomId,
                userId: room.otherUserId || undefined,
                isGroup: room.isGroup
              })
            }
          })
        }

        // 2. Add remaining friends that might not have active recent rooms
        if (friendsRes?.success && friendsRes.data?.friends) {
          friendsRes.data.friends.forEach((f) => {
            const hasExisting = combinedList.some(
              (c) => c.userId === f.id && !c.isGroup
            )
            if (!hasExisting) {
              const key = `user-${f.id}`
              if (!seenIds.has(key)) {
                seenIds.add(key)
                combinedList.push({
                  id: key,
                  name: f.name || 'Người dùng',
                  avatarUrl: f.avatar || null,
                  userId: f.id,
                  isGroup: false
                })
              }
            }
          })
        }

        setContacts(combinedList)
      } catch (err) {
        console.error('Failed to load share contacts:', err)
      } finally {
        if (isMounted) setIsLoadingContacts(false)
      }
    }

    loadContacts()

    return () => {
      isMounted = false
    }
  }, [isOpen, isAuthenticated])

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase().trim()
    return contacts.filter((c) => c.name.toLowerCase().includes(q))
  }, [contacts, searchQuery])

  if (!isOpen) return null

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  // Handle Send Place Attachment to a Chat Contact
  const handleSendToChat = async (contact: ShareContact) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi địa điểm qua tin nhắn!')
      return
    }

    if (sentContactIds.has(contact.id) || sendingContactId) return

    setSendingContactId(contact.id)
    try {
      let targetRoomId = contact.roomId

      // If room doesn't exist yet, get or create direct room with friend
      if (!targetRoomId && contact.userId) {
        targetRoomId = await chatService.getOrCreateDirectRoom(contact.userId)
      }

      if (!targetRoomId) {
        throw new Error('Không tìm thấy phòng trò chuyện phù hợp.')
      }

      // Send place attachment with optional message note
      await chatService.sendMessage({
        roomId: targetRoomId,
        content: messageNote.trim() || undefined,
        placeId: Number(place.id)
      })

      // Update sent list & notify
      setSentContactIds((prev) => new Set(prev).add(contact.id))
      await fetchInbox().catch(() => { })

      onToast?.(`Đã gửi địa điểm tới ${contact.name}!`)
    } catch (err) {
      console.error('Error sending place to chat:', err)
      alert('Không thể gửi địa điểm lúc này. Vui lòng thử lại sau.')
    } finally {
      setSendingContactId(null)
    }
  }

  // Handle Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setIsCopied(true)
      onToast?.('Đã sao chép liên kết địa điểm!')
      setTimeout(() => setIsCopied(false), 2500)
    } catch {
      alert('Không thể sao chép liên kết vào bộ nhớ tạm.')
    }
  }

  // Handle Social Sharing
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const handleShareMessenger = () => {
    const url = `fb-messenger://share/?link=${encodeURIComponent(currentUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareWhatsApp = () => {
    const text = `Khám phá địa điểm "${place.name}" trên Lãng Thang: ${currentUrl}`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareTwitter = () => {
    const text = `Khám phá địa điểm "${place.name}" trên Lãng Thang`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const handleShareEmail = () => {
    const subject = `Địa điểm du lịch thú vị: ${place.name}`
    const body = `Chào bạn,\n\nMình muốn chia sẻ với bạn địa điểm "${place.name}" rất thú vị này:\n${currentUrl}\n\nChúc bạn có chuyến đi vui vẻ!`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const coverPhoto =
    place.mediaUrls && place.mediaUrls.length > 0
      ? place.mediaUrls[0]
      : place.thumbnailUrl || ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Share2 size={16} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Chia sẻ địa điểm</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Place Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt={place.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-lg">
                <MapPin size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md inline-block mb-1">
                {place.categoryName || 'Địa điểm'}
              </span>
              <h4 className="text-sm font-bold text-slate-900 truncate">{place.name}</h4>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{place.address || place.regionName || 'Việt Nam'}</span>
              </p>
              {place.avgRating > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-1">
                  <Star size={12} className="fill-current text-amber-400" />
                  <span>{Number(place.avgRating).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Message Note */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Lời nhắn gửi kèm
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Điểm này đẹp quá, hôm nào cùng đi nhé!..."
              value={messageNote}
              onChange={(e) => setMessageNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1: GỬI BẰNG CHAT / TIN NHẮN TRỰC TIẾP
          ═══════════════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle size={14} className="text-emerald-700" />
                <span>Gửi qua tin nhắn Lãng Thang</span>
              </h4>
              {contacts.length > 0 && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {contacts.length} liên hệ
                </span>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-center text-xs text-amber-900 space-y-1">
                <p className="font-bold">Bạn chưa đăng nhập</p>
                <p className="text-[11px] text-amber-700">
                  Vui lòng đăng nhập để gửi trực tiếp địa điểm này qua hệ thống tin nhắn.
                </p>
              </div>
            ) : isLoadingContacts ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 size={20} className="animate-spin text-emerald-800" />
                <span className="text-xs">Đang tải danh sách bạn bè...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                Chưa có cuộc trò chuyện hoặc bạn bè nào để gửi.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar for Contacts */}
                {contacts.length > 5 && (
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm bạn bè hoặc nhóm trò chuyện..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Horizontal / Grid list of Contacts (matching Messenger Share dialog) */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-1">
                  {filteredContacts.slice(0, 10).map((contact) => {
                    const isSent = sentContactIds.has(contact.id)
                    const isSending = sendingContactId === contact.id

                    return (
                      <div
                        key={contact.id}
                        className="flex flex-col items-center text-center group cursor-pointer"
                        onClick={() => handleSendToChat(contact)}
                      >
                        <div className="relative">
                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              alt={contact.name}
                              className={`w-12 h-12 rounded-full object-cover border-2 transition-all shadow-2xs group-hover:opacity-80 duration-200 ${isSent
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'border-white group-hover:border-emerald-500'
                                }`}
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-2xs ${contact.isGroup
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                } ${isSent
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                  : 'group-hover:border-emerald-500'
                                }`}
                            >
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Status Badge */}
                          {isSending && (
                            <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center">
                              <Loader2 size={16} className="animate-spin text-white" />
                            </div>
                          )}
                          {isSent && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-slate-800 truncate w-full mt-1.5 group-hover:text-emerald-800 transition-colors">
                          {contact.name}
                        </span>

                        <button
                          type="button"
                          disabled={isSent || isSending}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendToChat(contact)
                          }}
                          className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${isSent
                            ? 'bg-emerald-100 text-emerald-800 font-extrabold cursor-default'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-800 hover:text-white cursor-pointer'
                            }`}
                        >
                          {isSent ? 'Đã gửi' : isSending ? 'Đang gửi...' : 'Gửi'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2: CHIA SẺ LÊN CÁC NỀN TẢNG KHÁC
          ═══════════════════════════════════════════════════════════════ */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Chia sẻ lên
            </h4>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 text-center">
              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xs ${isCopied
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                    : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                    }`}
                >
                  {isCopied ? <Check size={20} /> : <Link2 size={20} />}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  {isCopied ? 'Đã chép' : 'Sao chép link'}
                </span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleShareFacebook}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  Facebook
                </span>
              </button>

              {/* Messenger */}
              <button
                type="button"
                onClick={handleShareMessenger}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#0084FF]/10 text-[#0084FF] group-hover:bg-[#0084FF] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.082.3 2.227.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.559 6.963z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  Messenger
                </span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  WhatsApp
                </span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={handleShareTwitter}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900/10 text-slate-900 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  X
                </span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <Mail size={20} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  Email
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
