import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  X,
  MessageCircle,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Check,
  Loader2,
  Clock,
} from 'lucide-react'
import { friendService } from '@/services/friendService'
import { useChat } from '@/context/ChatContext'
import type { FriendItemDto } from '@/types/models/friend.model'

interface FriendsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
  onToast?: (msg: string) => void
}

type FriendTab = 'accepted' | 'incoming' | 'outgoing' | 'search'

export const FriendsUtility: React.FC<FriendsUtilityProps> = ({
  isDrawer = false,
  onClose,
  onToast
}) => {
  const navigate = useNavigate()
  const { openDirectChatWithUser } = useChat()

  const [activeTab, setActiveTab] = useState<FriendTab>('accepted')
  const [isLoading, setIsLoading] = useState(true)

  // Lists from getFriends API
  const [friends, setFriends] = useState<FriendItemDto[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendItemDto[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendItemDto[]>([])

  // Search inside friend list
  const [localSearch, setLocalSearch] = useState('')

  // Global user search in 'search' tab
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<FriendItemDto[]>([])
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
  const [sentRequestIds, setSentRequestIds] = useState<number[]>([])

  // Unfriend confirmation modal
  const [unfriendTarget, setUnfriendTarget] = useState<FriendItemDto | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const fetchFriendsData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await friendService.getFriends()
      if (res.success && res.data) {
        setFriends(res.data.friends || [])
        setIncomingRequests(res.data.pendingRequestsReceived || [])
        setOutgoingRequests(res.data.pendingRequestsSent || [])
      } else {
        setFriends([])
        setIncomingRequests([])
        setOutgoingRequests([])
      }
    } catch {
      setFriends([])
      setIncomingRequests([])
      setOutgoingRequests([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFriendsData()
  }, [fetchFriendsData])

  // Debounced global search for users
  useEffect(() => {
    if (activeTab !== 'search' || !globalSearch.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true)
      try {
        const res = await friendService.searchUsers(globalSearch.trim())
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as { items?: FriendItemDto[] }).items || []
          setSearchResults(list)
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearchingGlobal(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [activeTab, globalSearch])

  // Direct Message via Chat Context
  const handleOpenChat = async (userId: number) => {
    onClose?.()
    await openDirectChatWithUser(userId)
  }

  // Accept or Decline Friend Request
  const handleRespondRequest = async (userId: number, accept: boolean) => {
    setIsActionPending(true)
    try {
      const res = await friendService.respondFriendRequest(userId, accept ? 'accept' : 'reject')
      if (res.success) {
        const item = incomingRequests.find((f) => f.id === userId)
        setIncomingRequests((prev) => prev.filter((f) => f.id !== userId))
        if (accept && item) {
          setFriends((prev) => [item, ...prev])
          onToast?.(`Đã chấp nhận lời mời từ ${item.name}.`)
        } else {
          onToast?.('Đã từ chối lời mời kết bạn.')
        }
      } else {
        onToast?.(res.message || 'Không thể xử lý lời mời lúc này.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi xử lý lời mời.')
    } finally {
      setIsActionPending(false)
    }
  }

  // Send Friend Request
  const handleSendRequest = async (userId: number) => {
    try {
      const res = await friendService.sendFriendRequest(userId)
      if (res.success) {
        setSentRequestIds((prev) => [...prev, userId])
        onToast?.('Đã gửi lời mời kết bạn!')
      } else {
        onToast?.(res.message || 'Không thể gửi lời mời lúc này.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi gửi lời mời.')
    }
  }

  // Confirm Unfriend
  const handleUnfriendConfirm = async () => {
    if (!unfriendTarget) return
    setIsActionPending(true)
    try {
      const res = await friendService.unfriend(unfriendTarget.id)
      if (res.success) {
        setFriends((prev) => prev.filter((f) => f.id !== unfriendTarget.id))
        onToast?.(`Đã hủy kết bạn với ${unfriendTarget.name}.`)
        setUnfriendTarget(null)
      } else {
        onToast?.('Không thể hủy kết bạn lúc này.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi hủy kết bạn.')
    } finally {
      setIsActionPending(false)
    }
  }

  // Filtered friends by local search
  const filteredFriends = useMemo(() => {
    if (!localSearch.trim()) return friends
    const q = localSearch.toLowerCase().trim()
    return friends.filter((f) => f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q))
  }, [friends, localSearch])

  const tabs: Array<{ id: FriendTab; label: string; count?: number }> = [
    { id: 'accepted', label: 'Bạn bè', count: friends.length },
    { id: 'incoming', label: 'Lời mời', count: incomingRequests.length },
    { id: 'outgoing', label: 'Đã gửi', count: outgoingRequests.length },
    { id: 'search', label: 'Tìm bạn mới' }
  ]

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Sub Tabs */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === tab.id
                ? 'bg-indigo-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-indigo-900 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search input in Full-page mode */}
        {!isDrawer && activeTab === 'accepted' && (
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-indigo-800" />
            <span className="text-xs">Đang tải danh sách bạn bè...</span>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════════
                1. DANH SÁCH BẠN BÈ (ACCEPTED)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'accepted' && (
              filteredFriends.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
                  <Users size={36} className="text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Chưa có bạn bè nào</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Kết nối với những người đam mê xê dịch để cùng chia sẻ kinh nghiệm và đồng hành trên mọi nẻo đường.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="mt-3 px-4 py-2 text-xs font-bold text-white bg-indigo-800 rounded-xl hover:bg-indigo-900 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Tìm bạn mới</span>
                  </button>
                </div>
              ) : isDrawer ? (
                /* Drawer list */
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all shadow-2xs bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={friend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{friend.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{friend.email || 'Thành viên'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => handleOpenChat(friend.id)}
                          className="p-2 rounded-xl bg-blue-50 text-[#0084FF] hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Nhắn tin"
                        >
                          <MessageCircle size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose?.()
                            navigate(`/profile/${friend.id}`)
                          }}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Xem trang cá nhân"
                        >
                          <User size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Full page grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center text-center relative group"
                    >
                      <img
                        src={friend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                        alt={friend.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-xs mb-3"
                      />
                      <h4 className="text-sm font-bold text-slate-900 truncate w-full">{friend.name}</h4>
                      <p className="text-xs text-slate-400 truncate w-full mt-0.5">{friend.email || 'Thành viên du lịch'}</p>
                      {friend.mutualFriendsCount && friend.mutualFriendsCount > 0 ? (
                        <span className="text-[11px] text-indigo-700 font-medium mt-1">
                          {friend.mutualFriendsCount} bạn chung
                        </span>
                      ) : null}

                      <div className="flex items-center gap-2 mt-4 w-full pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenChat(friend.id)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0084FF] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle size={14} />
                          <span>Nhắn tin</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnfriendTarget(friend)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hủy kết bạn"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ══════════════════════════════════════════════════════════════════
                2. LỜI MỜI NHẬN ĐƯỢC (INCOMING)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'incoming' && (
              incomingRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
                  <UserCheck size={36} className="text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Không có lời mời kết bạn nào</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Khi ai đó gửi lời mời kết bạn cho bạn, yêu cầu sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                <div className={isDrawer ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}>
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={req.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                          alt={req.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{req.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{req.email || 'Muốn kết bạn với bạn'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => handleRespondRequest(req.id, true)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Check size={13} />
                          <span>Đồng ý</span>
                        </button>
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => handleRespondRequest(req.id, false)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ══════════════════════════════════════════════════════════════════
                3. LỜI MỜI ĐÃ GỬI (OUTGOING)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'outgoing' && (
              outgoingRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
                  <Clock size={36} className="text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Chưa gửi lời mời nào</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Tìm kiếm bạn bè mới và mở rộng mạng lưới phượt thủ cùng sở thích.
                  </p>
                </div>
              ) : (
                <div className={isDrawer ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}>
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={req.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                          alt={req.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{req.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">Đã gửi lời mời kết bạn</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                        Đang chờ...
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ══════════════════════════════════════════════════════════════════
                4. TÌM BẠN MỚI (SEARCH)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc email người dùng để tìm kiếm..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                  />
                  {globalSearch && (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isSearchingGlobal ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-indigo-800" />
                    <span className="text-xs">Đang tìm kiếm người dùng...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className={isDrawer ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}>
                    {searchResults.map((user) => {
                      const isSent = sentRequestIds.includes(user.id)
                      const isAlreadyFriend = friends.some((f) => f.id === user.id)
                      return (
                        <div
                          key={user.id}
                          className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
                              <p className="text-[11px] text-slate-400 truncate">{user.email || 'Thành viên'}</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isAlreadyFriend ? (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold">
                                Bạn bè
                              </span>
                            ) : isSent ? (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                                Đã gửi
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendRequest(user.id)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <UserPlus size={13} />
                                <span>Kết bạn</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : globalSearch.trim() ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">Không tìm thấy người dùng phù hợp với từ khóa.</p>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <p className="text-xs">Nhập từ khóa để tìm kiếm và kết bạn với mọi người trên hệ thống.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {unfriendTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <UserX size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Hủy kết bạn với {unfriendTarget.name}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn và {unfriendTarget.name} sẽ không còn trong danh sách bạn bè của nhau nữa.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnfriendTarget(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Không
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleUnfriendConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Hủy kết bạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FriendsUtility
