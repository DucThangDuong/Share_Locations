import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  UserPlus,
  MessageCircle,
  UserX,
  Check,
  Users,
  Loader2,
} from 'lucide-react'
import type { FriendUser, FriendshipStatus } from '@/types/models/friend.model'
import { friendService } from '@/services/friendService'
import { useChat } from '@/context/ChatContext'
import { UnfriendConfirmModal } from './UnfriendConfirmModal'

interface FriendsSectionProps {
  onShowToast: (msg: string) => void
}

type SubTabType = 'accepted' | 'suggestions' | 'incoming' | 'outgoing' | 'blocked'

export const FriendsSection: React.FC<FriendsSectionProps> = ({
  onShowToast
}) => {
  const { openFloatingChat } = useChat()
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SubTabType>('accepted')
  const [chattingUserId, setChattingUserId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestionSearchQuery, setSuggestionSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FriendUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [unfriendConfirmUser, setUnfriendConfirmUser] = useState<FriendUser | null>(null)

  const fetchFriends = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await friendService.getFriends()
      if (res.success && res.data) {
        const accepted: FriendUser[] = (res.data.friends || []).map((f) => ({
          id: Number(f.id),
          fullName: f.name,
          email: f.email || '',
          avatarUrl: f.avatar || '',
          coverUrl: f.coverUrl || '',
          city: '',
          bio: f.bio || '',
          rankLevel: f.rankLevel,
          reputationScore: f.reputationScore,
          mutualFriendsCount: f.mutualFriendsCount || 0,
          status: 'accepted' as FriendshipStatus,
          connectedDate: 'Đã kết bạn'
        }))

        const incoming: FriendUser[] = (res.data.pendingRequestsReceived || []).map((f) => ({
          id: Number(f.id),
          fullName: f.name,
          email: f.email || '',
          avatarUrl: f.avatar || '',
          coverUrl: f.coverUrl || '',
          city: '',
          bio: f.bio || '',
          rankLevel: f.rankLevel,
          reputationScore: f.reputationScore,
          mutualFriendsCount: f.mutualFriendsCount || 0,
          status: 'pending_incoming' as FriendshipStatus,
          connectedDate: f.requestedAt ? new Date(f.requestedAt).toLocaleDateString('vi-VN') : undefined
        }))

        const outgoing: FriendUser[] = (res.data.pendingRequestsSent || []).map((f) => ({
          id: Number(f.id),
          fullName: f.name,
          email: f.email || '',
          avatarUrl: f.avatar || '',
          coverUrl: f.coverUrl || '',
          city: '',
          bio: f.bio || '',
          rankLevel: f.rankLevel,
          reputationScore: f.reputationScore,
          mutualFriendsCount: f.mutualFriendsCount || 0,
          status: 'pending_outgoing' as FriendshipStatus,
          connectedDate: f.requestedAt ? new Date(f.requestedAt).toLocaleDateString('vi-VN') : undefined
        }))

        setFriends([...accepted, ...incoming, ...outgoing])
      } else {
        setFriends([])
      }
    } catch {
      setFriends([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const handleSearchUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const query = suggestionSearchQuery.trim()
    if (!query) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    try {
      const res = await friendService.searchUsers(query)
      if (res.success && Array.isArray(res.data)) {
        const mapped: FriendUser[] = res.data.map((u) => {
          let st: FriendshipStatus = 'suggestion'
          if (u.status === 'pending_sent') st = 'pending_outgoing'
          else if (u.status === 'pending_received') st = 'pending_incoming'
          else if (u.status === 'accepted') st = 'accepted'
          else if (u.status === 'self') st = 'self'
          else if (u.status === 'blocked') st = 'blocked'

          return {
            id: Number(u.id),
            fullName: u.name,
            email: u.email || '',
            avatarUrl: u.avatar || '',
            coverUrl: u.coverUrl || '',
            city: '',
            bio: u.bio || '',
            rankLevel: u.rankLevel,
            reputationScore: u.reputationScore,
            mutualFriendsCount: u.mutualFriendsCount || 0,
            status: st,
            connectedDate: u.requestedAt ? new Date(u.requestedAt).toLocaleDateString('vi-VN') : undefined
          }
        })
        setSearchResults(mapped)
      } else {
        setSearchResults([])
      }
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted')
  const incomingRequests = friends.filter((f) => f.status === 'pending_incoming')
  const outgoingRequests = friends.filter((f) => f.status === 'pending_outgoing')
  const blockedUsers = friends.filter((f) => f.status === 'blocked')

  const filterUser = (u: FriendUser) => {
    const q = searchQuery.toLowerCase().trim()
    return !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  }

  const displayedAccepted = acceptedFriends.filter(filterUser)
  const displayedIncoming = incomingRequests.filter(filterUser)
  const displayedOutgoing = outgoingRequests.filter(filterUser)
  const displayedBlocked = blockedUsers.filter(filterUser)

  const handleAccept = async (friend: FriendUser) => {
    try {
      await friendService.respondFriendRequest(friend.id, 'accept')
    } catch {
    }
    setFriends((prev) =>
      prev.map((f) =>
        f.id === friend.id
          ? { ...f, status: 'accepted' as FriendshipStatus, connectedDate: 'Vừa kết bạn' }
          : f
      )
    )
    setSearchResults((prev) =>
      prev.map((f) =>
        f.id === friend.id
          ? { ...f, status: 'accepted' as FriendshipStatus, connectedDate: 'Vừa kết bạn' }
          : f
      )
    )
    onShowToast(`Đã kết bạn với ${friend.fullName}.`)
  }

  const handleDecline = async (friend: FriendUser) => {
    try {
      await friendService.respondFriendRequest(friend.id, 'reject')
    } catch {
    }
    setFriends((prev) => prev.filter((f) => f.id !== friend.id))
    setSearchResults((prev) =>
      prev.map((f) => (f.id === friend.id ? { ...f, status: 'suggestion' as FriendshipStatus } : f))
    )
    onShowToast(`Đã gỡ lời mời từ ${friend.fullName}.`)
  }

  const handleSendRequest = async (friend: FriendUser) => {
    try {
      await friendService.sendFriendRequest(friend.id)
    } catch {
    }
    setFriends((prev) => {
      const exists = prev.some((f) => f.id === friend.id)
      if (exists) {
        return prev.map((f) =>
          f.id === friend.id ? { ...f, status: 'pending_outgoing' as FriendshipStatus } : f
        )
      }
      return [...prev, { ...friend, status: 'pending_outgoing' as FriendshipStatus }]
    })
    setSearchResults((prev) =>
      prev.map((f) =>
        f.id === friend.id ? { ...f, status: 'pending_outgoing' as FriendshipStatus } : f
      )
    )
    onShowToast(`Đã gửi lời mời đến ${friend.fullName}.`)
  }

  const handleCancelOutgoing = async (friend: FriendUser) => {
    try {
      await friendService.unfriend(friend.id)
    } catch {
    }
    setFriends((prev) => prev.filter((f) => f.id !== friend.id))
    setSearchResults((prev) =>
      prev.map((f) => (f.id === friend.id ? { ...f, status: 'suggestion' as FriendshipStatus } : f))
    )
    onShowToast(`Đã hủy lời mời gửi đến ${friend.fullName}.`)
  }

  const handleUnfriendConfirm = async () => {
    if (!unfriendConfirmUser) return
    try {
      await friendService.unfriend(unfriendConfirmUser.id)
    } catch {
    }
    setFriends((prev) => prev.filter((f) => f.id !== unfriendConfirmUser.id))
    setSearchResults((prev) =>
      prev.map((f) =>
        f.id === unfriendConfirmUser.id ? { ...f, status: 'suggestion' as FriendshipStatus } : f
      )
    )
    onShowToast(`Đã hủy kết bạn với ${unfriendConfirmUser.fullName}.`)
    setUnfriendConfirmUser(null)
  }

  const handleUnblock = (friend: FriendUser) => {
    setFriends((prev) =>
      prev.map((f) =>
        f.id === friend.id
          ? { ...f, status: 'suggestion' as FriendshipStatus, blockedDate: undefined }
          : f
      )
    )
    setSearchResults((prev) =>
      prev.map((f) =>
        f.id === friend.id
          ? { ...f, status: 'suggestion' as FriendshipStatus, blockedDate: undefined }
          : f
      )
    )
    onShowToast(`Đã bỏ chặn ${friend.fullName}.`)
  }

  const handleStartChat = async (friend: FriendUser) => {
    setChattingUserId(friend.id)
    try {
      await openFloatingChat(undefined, friend.id)
    } catch {
      onShowToast('Không thể mở cuộc trò chuyện với bạn bè')
    } finally {
      setChattingUserId(null)
    }
  }

  const tabs = [
    { key: 'accepted' as const, label: 'Tất cả bạn bè', count: acceptedFriends.length },
    { key: 'suggestions' as const, label: 'Khám phá bạn mới', count: 0 },
    { key: 'incoming' as const, label: 'Lời mời kết bạn', count: incomingRequests.length },
    { key: 'outgoing' as const, label: 'Đã gửi', count: outgoingRequests.length },
    { key: 'blocked' as const, label: 'Đã chặn', count: blockedUsers.length }
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-64 bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Users size={18} className="text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900">Danh mục bạn bè</h3>
          </div>

          <div className="p-2 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key)
                    setSearchQuery('')
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-xs ${isActive
                    ? 'bg-emerald-50 font-bold text-emerald-900 border border-emerald-200'
                    : 'hover:bg-slate-100 font-semibold text-slate-700'
                    }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        <main className="w-full flex-1">
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {tabs.find((t) => t.key === activeTab)?.label}
              </h3>

              {activeTab !== 'suggestions' && (
                <div className="relative w-full sm:w-64">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải dữ liệu bạn bè...
              </div>
            ) : (
              <div>
                {activeTab === 'accepted' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedAccepted.length === 0 && (
                      <p className="text-slate-400 col-span-full text-center py-10 text-xs">
                        Không tìm thấy bạn bè nào.
                      </p>
                    )}
                    {displayedAccepted.map((friend) => (
                      <div
                        key={friend.id}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                      >
                        <div className="relative">
                          {friend.coverUrl ? (
                            <img
                              src={friend.coverUrl}
                              alt=""
                              className="w-full h-28 object-cover bg-slate-100"
                            />
                          ) : (
                            <div className="w-full h-28 bg-gradient-to-r from-emerald-700 to-teal-800" />
                          )}
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                            {friend.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt={friend.fullName}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm bg-white"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
                                {(friend.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-12 flex-1 flex flex-col justify-between text-center">
                          <div className="mb-4">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                              {friend.fullName}
                            </h4>
                            {friend.bio && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 italic">
                                "{friend.bio}"
                              </p>
                            )}
                            {friend.mutualFriendsCount > 0 && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                {friend.mutualFriendsCount} bạn chung
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-auto">
                            <button
                              type="button"
                              disabled={chattingUserId === friend.id}
                              onClick={() => handleStartChat(friend)}
                              className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {chattingUserId === friend.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <MessageCircle size={14} />
                              )}
                              Nhắn tin
                            </button>
                            <button
                              type="button"
                              onClick={() => setUnfriendConfirmUser(friend)}
                              className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                              title="Hủy kết bạn"
                            >
                              <UserX size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div>
                    <form
                      onSubmit={handleSearchUsers}
                      className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200"
                    >
                      <div className="relative flex-1">
                        <Search
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Nhập tên người dùng hoặc ID (ví dụ: #10 hoặc 10)..."
                          value={suggestionSearchQuery}
                          onChange={(e) => setSuggestionSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSearching || !suggestionSearchQuery.trim()}
                        className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                      >
                        <Search size={14} />
                        {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
                      </button>
                    </form>

                    {isSearching ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Đang tìm kiếm người dùng...
                      </div>
                    ) : !hasSearched ? null : searchResults.length === 0 ? (
                      <p className="text-slate-400 text-center py-12 text-xs">
                        Không tìm thấy người dùng nào phù hợp với từ khóa "{suggestionSearchQuery}".
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                          >
                            <div className="relative">
                              {user.coverUrl ? (
                                <img
                                  src={user.coverUrl}
                                  alt=""
                                  className="w-full h-28 object-cover bg-slate-100"
                                />
                              ) : (
                                <div className="w-full h-28 bg-gradient-to-r from-emerald-700 to-teal-800" />
                              )}
                              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.fullName}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm bg-white"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
                                    {(user.fullName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-4 pt-12 flex-1 flex flex-col justify-between text-center">
                              <div className="mb-4">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                                  {user.fullName}
                                </h4>
                                {user.bio && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 italic">
                                    "{user.bio}"
                                  </p>
                                )}
                                {user.mutualFriendsCount > 0 && (
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    {user.mutualFriendsCount} bạn chung
                                  </p>
                                )}
                              </div>

                              <div className="mt-auto">
                                {user.status === 'self' ? (
                                  <div className="w-full py-2 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl text-center">
                                    Tài khoản của bạn
                                  </div>
                                ) : user.status === 'accepted' ? (
                                  <button
                                    type="button"
                                    disabled={chattingUserId === user.id}
                                    onClick={() => handleStartChat(user)}
                                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer transition-colors disabled:opacity-60"
                                  >
                                    {chattingUserId === user.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <MessageCircle size={14} />
                                    )}
                                    Nhắn tin
                                  </button>
                                ) : user.status === 'pending_outgoing' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelOutgoing(user)}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <UserX size={14} /> Hủy lời mời
                                  </button>
                                ) : user.status === 'pending_incoming' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAccept(user)}
                                      className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-2xs"
                                    >
                                      <Check size={14} /> Xác nhận
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDecline(user)}
                                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendRequest(user)}
                                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    <UserPlus size={14} /> Thêm bạn bè
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'incoming' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedIncoming.length === 0 && (
                      <p className="text-slate-400 col-span-full text-center py-10 text-xs">
                        Không có lời mời kết bạn nào mới.
                      </p>
                    )}
                    {displayedIncoming.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                      >
                        <div className="relative">
                          {user.coverUrl ? (
                            <img
                              src={user.coverUrl}
                              alt=""
                              className="w-full h-28 object-cover bg-slate-100"
                            />
                          ) : (
                            <div className="w-full h-28 bg-gradient-to-r from-emerald-700 to-teal-800" />
                          )}
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.fullName}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm bg-white"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
                                {(user.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-12 flex-1 flex flex-col justify-between text-center">
                          <div className="mb-4">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                              {user.fullName}
                            </h4>
                            {user.bio && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 italic">
                                "{user.bio}"
                              </p>
                            )}
                            {user.mutualFriendsCount > 0 && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                {user.mutualFriendsCount} bạn chung
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-auto">
                            <button
                              type="button"
                              onClick={() => handleAccept(user)}
                              className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Check size={14} /> Xác nhận
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecline(user)}
                              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'outgoing' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedOutgoing.length === 0 && (
                      <p className="text-slate-400 col-span-full text-center py-10 text-xs">
                        Không có lời mời nào đã gửi.
                      </p>
                    )}
                    {displayedOutgoing.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                      >
                        <div className="relative">
                          {user.coverUrl ? (
                            <img
                              src={user.coverUrl}
                              alt=""
                              className="w-full h-28 object-cover bg-slate-100"
                            />
                          ) : (
                            <div className="w-full h-28 bg-gradient-to-r from-emerald-700 to-teal-800" />
                          )}
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.fullName}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm bg-white"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
                                {(user.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-12 flex-1 flex flex-col justify-between text-center">
                          <div className="mb-4">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                              {user.fullName}
                            </h4>
                            {user.bio && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 italic">
                                "{user.bio}"
                              </p>
                            )}
                          </div>

                          <div className="mt-auto">
                            <button
                              type="button"
                              onClick={() => handleCancelOutgoing(user)}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                            >
                              <UserX size={14} /> Hủy lời mời
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'blocked' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedBlocked.length === 0 && (
                      <p className="text-slate-400 col-span-2 text-center py-10 text-xs">
                        Danh sách người dùng đã chặn trống.
                      </p>
                    )}
                    {displayedBlocked.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white"
                      >
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover grayscale opacity-60"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                              {(user.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-xs sm:text-sm text-slate-600 line-through">
                            {user.fullName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnblock(user)}
                          className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          Bỏ chặn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <UnfriendConfirmModal
        user={unfriendConfirmUser}
        onClose={() => setUnfriendConfirmUser(null)}
        onConfirm={handleUnfriendConfirm}
      />
    </div>
  )
}

export default FriendsSection
