import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'
import { userService } from '@/services/userService'
import { friendService } from '@/services/friendService'
import { UserProfileHeader, type ProfileTabType } from '@/components/profile/UserProfileHeader'
import { UserProfileSidebar } from '@/components/profile/UserProfileSidebar'
import { ReportModal } from '@/components/report/ReportModal'
import { ChatLightbox } from '@/components/chat/ChatLightbox'
import { UserProfileReviewsTab } from '@/components/profile/tabs/UserProfileReviewsTab'
import { UserProfileActivityTab } from '@/components/profile/tabs/UserProfileActivityTab'
import { UserProfileTripsTab } from '@/components/profile/tabs/UserProfileTripsTab'
import { UserProfileVisitLogsTab } from '@/components/profile/tabs/UserProfileVisitLogsTab'
import { UserProfileBlogsTab } from '@/components/profile/tabs/UserProfileBlogsTab'
import { UserProfileProposalsTab } from '@/components/profile/tabs/UserProfileProposalsTab'
import type { PublicUserProfileDto } from '@/types/models/userProfile.model'

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { user: currentUser } = useAuth()
  const { openFloatingChat } = useChat()

  const [activeTab, setActiveTab] = useState<ProfileTabType>('reviews')
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Profile info state ONLY
  const [profile, setProfile] = useState<PublicUserProfileDto | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const locationState = location.state as { authorName?: string; authorAvatar?: string; authorRole?: string } | undefined
  const nameFromQuery = searchParams.get('name') || locationState?.authorName

  // Determine target User ID
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null
  const hasExplicitId = Boolean(id && id !== 'me')
  const targetUserId = hasExplicitId ? Number(id) || 1 : (nameFromQuery ? null : (currentUserId || 1))
  const isCurrentUser = Boolean(currentUserId && targetUserId && currentUserId === targetUserId && !nameFromQuery)

  // ── Fetch Profile Info ONLY on mount / params change ──
  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setLoading(true)

      // Case 1: An explicit target ID is present
      if (targetUserId) {
        try {
          const res = await userService.getUserPublicProfile(targetUserId)
          if (res.success && res.data && isMounted) {
            setProfile(res.data)
          } else if (isCurrentUser && isMounted) {
            setProfile({
              id: currentUserId || 1,
              fullName: currentUser?.fullName || 'Người dùng',
              avatarUrl: currentUser?.avatarUrl || null,
              coverUrl: currentUser?.coverUrl || null,
              bio: currentUser?.bio || 'Đam mê khám phá các cung đường và địa điểm mới trên khắp Việt Nam.',
              joinedDate: 'Tháng 4, 2024',
              rankLevel: currentUser?.rankLevel || 'Chuyên gia khám phá',
              reputationScore: currentUser?.reputationScore || 1250,
              friendStatus: 'none'
            })
          }
        } catch {
          if (isMounted) {
            setProfile({
              id: targetUserId,
              fullName: isCurrentUser ? currentUser?.fullName || 'Người dùng' : (nameFromQuery || 'Người dùng'),
              avatarUrl: isCurrentUser
                ? currentUser?.avatarUrl || null
                : (locationState?.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'),
              coverUrl: isCurrentUser
                ? currentUser?.coverUrl || null
                : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=400&fit=crop',
              bio: 'Đam mê khám phá các cung đường và địa điểm mới trên khắp Việt Nam.',
              joinedDate: 'Tháng 4, 2024',
              rankLevel: 'Chuyên gia khám phá',
              reputationScore: 890,
              friendStatus: 'none'
            })
          }
        } finally {
          if (isMounted) setLoading(false)
        }
        return
      }

      // Case 2: No explicit ID but author name is provided -> Look up user by name
      if (nameFromQuery) {
        try {
          const searchRes = await friendService.searchUsers(nameFromQuery.trim())
          if (searchRes.success && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
            const foundUser =
              searchRes.data.find(
                (u) => u.name?.trim().toLowerCase() === nameFromQuery.trim().toLowerCase()
              ) || searchRes.data[0]

            if (foundUser && foundUser.id) {
              const profileRes = await userService.getUserPublicProfile(foundUser.id)
              if (profileRes.success && profileRes.data && isMounted) {
                setProfile(profileRes.data)
                if (isMounted) setLoading(false)
                return
              }
            }
          }
        } catch {
          // search error fallback
        }

        if (isMounted) {
          setProfile({
            id: 9999,
            fullName: nameFromQuery,
            avatarUrl: locationState?.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
            coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=400&fit=crop',
            bio: locationState?.authorRole || 'Tác giả chia sẻ cẩm nang du lịch và địa điểm trên LangThang.',
            joinedDate: 'Tháng 4, 2024',
            rankLevel: 'Tác giả cẩm nang',
            reputationScore: 1200,
            friendStatus: 'none'
          })
          setLoading(false)
        }
        return
      }

      // Case 3: Default current user profile
      if (isMounted) {
        setProfile({
          id: currentUserId || 1,
          fullName: currentUser?.fullName || 'Người dùng',
          avatarUrl: currentUser?.avatarUrl || null,
          coverUrl: currentUser?.coverUrl || null,
          bio: currentUser?.bio || 'Đam mê khám phá các cung đường và địa điểm mới trên khắp Việt Nam.',
          joinedDate: 'Tháng 4, 2024',
          rankLevel: currentUser?.rankLevel || 'Chuyên gia khám phá',
          reputationScore: currentUser?.reputationScore || 1250,
          friendStatus: 'none'
        })
        setLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [id, targetUserId, isCurrentUser, currentUser, nameFromQuery, locationState])

  // Handle Social Actions
  const handleSendMessage = () => {
    if (!profile) return
    openFloatingChat(undefined, profile.id)
  }

  const handleAddFriend = async () => {
    const friendId = profile?.id || targetUserId
    if (!friendId) return
    try {
      const res = await friendService.sendFriendRequest(friendId)
      if (res.success || res.data) {
        setProfile((prev) => (prev ? { ...prev, friendStatus: 'pending_sent' } : null))
        showToast('Đã gửi lời mời kết bạn!')
      } else {
        showToast(res.message || 'Không thể gửi lời mời kết bạn lúc này.')
      }
    } catch (err: any) {
      console.error('Failed to send friend request:', err)
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi lời mời kết bạn.'
      showToast(errorMsg)
    }
  }

  const handleUnfriend = async () => {
    const friendId = profile?.id || targetUserId
    if (!friendId) return
    if (!confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${profile?.fullName || 'người dùng này'}?`)) return
    try {
      const res = await friendService.unfriend(friendId)
      if (res.success || res.data) {
        setProfile((prev) => (prev ? { ...prev, friendStatus: 'none' } : null))
        showToast('Đã hủy kết bạn')
      } else {
        showToast(res.message || 'Không thể hủy kết bạn lúc này.')
      }
    } catch (err: any) {
      console.error('Failed to unfriend:', err)
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi hủy kết bạn.'
      showToast(errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-surface">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">
          Đang tải trang cá nhân...
        </span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-surface">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy người dùng</h2>
        <p className="text-sm text-slate-500 max-w-md mb-5">
          Trang cá nhân này không tồn tại hoặc đã bị ẩn.
        </p>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          Khám phá địa điểm
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-top-3 fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Lightbox Modal */}
      <ChatLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* Report Modal */}
      <ReportModal
        placeName={profile.fullName}
        placeId={profile.id}
        initialTarget={{
          targetType: 'place',
          targetId: profile.id,
          targetTitle: `Người dùng: ${profile.fullName}`
        }}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmittedReport={() => {
          showToast('Đã gửi báo cáo vi phạm thành công')
          setIsReportModalOpen(false)
        }}
      />

      {/* ── HEADER HERO SECTION (Tripadvisor Style) ── */}
      <UserProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCurrentUser={isCurrentUser}
        onSendMessage={handleSendMessage}
        onAddFriend={handleAddFriend}
        onUnfriend={handleUnfriend}
      />

      {/* ── 2-COLUMN MAIN CONTENT (Intro Sidebar + Feed) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Intro Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <UserProfileSidebar profile={profile} />
          </div>

          {/* Right Column: Tab Activities Feed (Isolated Component per Tab) */}
          <div className="lg:col-span-8 space-y-5">
            {activeTab === 'reviews' && (
              <UserProfileReviewsTab
                userId={profile.id}
                authorName={profile.fullName}
                authorAvatar={profile.avatarUrl}
                onImageClick={(img) => setLightboxImage(img)}
                showToast={showToast}
              />
            )}

            {activeTab === 'activity' && (
              <UserProfileActivityTab
                userId={profile.id}
                userName={profile.fullName}
              />
            )}

            {activeTab === 'trips' && (
              <UserProfileTripsTab userId={profile.id} />
            )}

            {activeTab === 'visit_logs' && (
              <UserProfileVisitLogsTab userId={profile.id} />
            )}

            {activeTab === 'blogs' && (
              <UserProfileBlogsTab userId={profile.id} />
            )}

            {activeTab === 'proposals' && (
              <UserProfileProposalsTab userId={profile.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage
