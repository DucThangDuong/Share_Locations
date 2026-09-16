import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  ProfileHero,
  ProfileTabBar,
  FavoritesSection,
  UserTripsSection,
  VisitedLogSection,
  UserReviewsSection,
  UserCommentsSection,
  UserBlogsSection,
  UserProposalsSection,
  FriendsSection,
  type ProfileTabType
} from '@/components/profile'
import { userService } from '@/services/userService'
import { blogService } from '@/services/blogService'
import { tripService } from '@/services/tripService'
import { friendService } from '@/services/friendService'
import { CheckCircle2 } from 'lucide-react'
import type {
  FavoriteItem,
  VisitLogItem,
  ProposalItem,
  UserReviewItem,
  UserCommentItem,
  UserBlogItem,
  PagedResultDto,
  CreateVisitLogRequest,
  UpdateVisitLogRequest
} from '@/types/models/userProfile.model'

const VALID_TABS: ProfileTabType[] = [
  'favorites',
  'trips',
  'visitLogs',
  'friends',
  'reviews',
  'comments',
  'blogs',
  'proposals'
]

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  const tabFromUrl = searchParams.get('tab') as ProfileTabType | null
  const activeTab: ProfileTabType =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'favorites'

  const handleTabChange = (tabKey: ProfileTabType) => {
    const newParams = new URLSearchParams()
    newParams.set('tab', tabKey)
    setSearchParams(newParams, { replace: true })
  }

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isTabLoading, setIsTabLoading] = useState(false)

  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLogItem[]>([])
  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [comments, setComments] = useState<UserCommentItem[]>([])
  const [blogs, setBlogs] = useState<UserBlogItem[]>([])
  const [proposals, setProposals] = useState<ProposalItem[]>([])

  const [counts, setCounts] = useState<Record<ProfileTabType, number>>({
    favorites: 0,
    trips: 0,
    visitLogs: 0,
    friends: 0,
    reviews: 0,
    comments: 0,
    blogs: 0,
    proposals: 0
  })

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: '/profile' } })
    }
  }, [isAuthenticated, isAuthLoading, navigate])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const parseResult = <T,>(
    data: T[] | PagedResultDto<T> | undefined | null
  ): { items: T[]; total: number } => {
    if (!data) return { items: [], total: 0 }
    if (Array.isArray(data)) {
      return { items: data, total: data.length }
    }
    if (Array.isArray(data.items)) {
      return {
        items: data.items,
        total: typeof data.totalCount === 'number' ? data.totalCount : data.items.length
      }
    }
    return { items: [], total: 0 }
  }

  const extractCount = (
    settled: PromiseSettledResult<{ success?: boolean; data?: unknown }>,
    fallback = 0
  ) => {
    if (settled.status === 'fulfilled' && settled.value?.success && settled.value.data) {
      const total = parseResult(settled.value.data as unknown[]).total
      return total > 0 ? total : fallback
    }
    return fallback
  }

  const fetchAllCounts = useCallback(async () => {
    try {
      const [favRes, tripRes, logRes, friendRes, revRes, comRes, blogRes, propRes] = await Promise.allSettled([
        userService.getMyFavorites({ pageSize: 50 }),
        tripService.getUserTrips({ pageSize: 50 }),
        userService.getMyVisitLogs({ pageSize: 50 }),
        friendService.getFriends(),
        userService.getMyReviews({ pageSize: 50 }),
        userService.getMyComments({ pageSize: 50 }),
        userService.getMyBlogs({ pageSize: 50 }),
        userService.getMyProposals({ pageSize: 50 })
      ])

      let friendCount = 0
      if (friendRes.status === 'fulfilled' && friendRes.value?.success && friendRes.value.data) {
        friendCount = Array.isArray(friendRes.value.data.friends) ? friendRes.value.data.friends.length : 0
      }

      setCounts({
        favorites: extractCount(favRes, 0),
        trips: extractCount(tripRes, 0),
        visitLogs: extractCount(logRes, 0),
        friends: friendCount,
        reviews: extractCount(revRes, 0),
        comments: extractCount(comRes, 0),
        blogs: extractCount(blogRes, 0),
        proposals: extractCount(propRes, 0)
      })
    } catch {
    }
  }, [])

  const fetchTabData = useCallback(async (tab: ProfileTabType) => {
    if (tab === 'friends' || tab === 'trips') {
      return
    }

    setIsTabLoading(true)
    try {
      if (tab === 'favorites') {
        const res = await userService.getMyFavorites({ pageSize: 50 })
        if (res.success && res.data) {
          const parsed = parseResult<FavoriteItem>(res.data)
          setFavorites(parsed.items)
          setCounts((prev) => ({ ...prev, favorites: parsed.total }))
        }
      } else if (tab === 'visitLogs') {
        const res = await userService.getMyVisitLogs({ pageSize: 50 })
        if (res.success && res.data) {
          const parsed = parseResult<VisitLogItem>(res.data)
          setVisitLogs(parsed.items)
          setCounts((prev) => ({ ...prev, visitLogs: parsed.total }))
        }
      } else if (tab === 'reviews') {
        const res = await userService.getMyReviews({ pageSize: 50 })
        if (res.success && res.data) {
          const parsed = parseResult<UserReviewItem>(res.data)
          setReviews(parsed.items)
          setCounts((prev) => ({ ...prev, reviews: parsed.total }))
        }
      } else if (tab === 'comments') {
        const res = await userService.getMyComments({ pageSize: 50 })
        if (res.success && res.data) {
          const parsed = parseResult<UserCommentItem>(res.data)
          setComments(parsed.items)
          setCounts((prev) => ({ ...prev, comments: parsed.total }))
        }
      } else if (tab === 'blogs') {
        const res = await userService.getMyBlogs({ pageSize: 50 })
        if (res.success && res.data) {
          const parsed = parseResult<UserBlogItem>(res.data)
          if (parsed.items && parsed.items.length > 0) {
            setBlogs(parsed.items)
            setCounts((prev) => ({ ...prev, blogs: parsed.total }))
          } else {
            setBlogs([])
            setCounts((prev) => ({ ...prev, blogs: 0 }))
          }
        } else {
          setBlogs([])
          setCounts((prev) => ({ ...prev, blogs: 0 }))
        }
      } else if (tab === 'proposals') {
        const res = await userService.getMyProposals({ pageSize: 50 })
        if (res.success && res.data) {
          const parsed = parseResult<ProposalItem>(res.data)
          setProposals(parsed.items)
          setCounts((prev) => ({ ...prev, proposals: parsed.total }))
        }
      }
    } catch {
      if (tab === 'blogs') {
        setBlogs([])
        setCounts((prev) => ({ ...prev, blogs: 0 }))
      }
    } finally {
      setIsTabLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllCounts()
    }
  }, [isAuthenticated, fetchAllCounts])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTabData(activeTab)
    }
  }, [isAuthenticated, activeTab, fetchTabData])

  const handleRemoveFavorite = async (targetType: number, targetId: number) => {
    try {
      const res = await userService.removeFavorite(targetType, targetId)
      if (res.success) {
        setFavorites((prev) =>
          prev.filter((item) => !(item.targetType === targetType && item.targetId === targetId))
        )
        setCounts((prev) => ({ ...prev, favorites: Math.max(0, prev.favorites - 1) }))
        showToast('Đã xóa khỏi danh sách đã lưu.')
      } else {
        showToast('Không thể bỏ lưu lúc này.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi bỏ lưu.')
    }
  }

  const handleAddVisitLog = async (data: CreateVisitLogRequest) => {
    try {
      const res = await userService.createVisitLog(data)
      if (res.success && res.data) {
        setVisitLogs((prev) => [res.data, ...prev])
        setCounts((prev) => ({ ...prev, visitLogs: prev.visitLogs + 1 }))
        showToast('Đã thêm nhật ký hành trình mới.')
      } else {
        showToast('Không thể lưu nhật ký.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi lưu nhật ký.')
    }
  }

  const handleUpdateVisitLog = async (id: number, data: UpdateVisitLogRequest) => {
    try {
      const res = await userService.updateVisitLog(id, data)
      if (res.success) {
        setVisitLogs((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, visitedDate: data.visitedDate, privacy: data.privacy as 0 | 1 }
              : item
          )
        )
        showToast('Đã cập nhật nhật ký chuyến đi.')
      } else {
        showToast('Không thể cập nhật nhật ký.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi cập nhật.')
    }
  }

  const handleDeleteVisitLog = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhật ký chuyến đi này?')) return
    try {
      const res = await userService.deleteVisitLog(id)
      if (res.success) {
        setVisitLogs((prev) => prev.filter((item) => item.id !== id))
        setCounts((prev) => ({ ...prev, visitLogs: Math.max(0, prev.visitLogs - 1) }))
        showToast('Đã xóa nhật ký chuyến đi.')
      } else {
        showToast('Không thể xóa nhật ký.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi xóa.')
    }
  }

  const handleToggleVisitLogPrivacy = async (id: number, newPrivacy: number) => {
    try {
      const res = await userService.changeVisitLogPrivacy(id, newPrivacy)
      if (res.success) {
        setVisitLogs((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, privacy: newPrivacy as 0 | 1 } : item
          )
        )
        showToast('Đã thay đổi quyền riêng tư nhật ký.')
      } else {
        showToast('Không thể cập nhật quyền riêng tư.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi đổi quyền riêng tư.')
    }
  }

  const handleDeleteBlog = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return
    try {
      const res = await blogService.deleteBlog(id)
      if (res.success) {
        setBlogs((prev) => prev.filter((b) => b.id !== id))
        setCounts((prev) => ({ ...prev, blogs: Math.max(0, prev.blogs - 1) }))
        showToast('Đã xóa bài viết.')
      } else {
        setBlogs((prev) => prev.filter((b) => b.id !== id))
        setCounts((prev) => ({ ...prev, blogs: Math.max(0, prev.blogs - 1) }))
        showToast('Đã xóa bài viết.')
      }
    } catch {
      setBlogs((prev) => prev.filter((b) => b.id !== id))
      setCounts((prev) => ({ ...prev, blogs: Math.max(0, prev.blogs - 1) }))
      showToast('Đã xóa bài viết.')
    }
  }

  const handleDeleteProposal = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi đề xuất địa điểm này?')) return
    try {
      const res = await userService.deleteProposal(id)
      if (res.success) {
        setProposals((prev) => prev.filter((p) => p.id !== id))
        setCounts((prev) => ({ ...prev, proposals: Math.max(0, prev.proposals - 1) }))
        showToast('Đã thu hồi đề xuất địa điểm.')
      } else {
        showToast('Không thể thu hồi đề xuất.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi thu hồi đề xuất.')
    }
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-dark text-white text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in border border-emerald-500/30 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ProfileHero onToast={showToast} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <ProfileTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
        />

        {isTabLoading ? (
          <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            {activeTab === 'favorites' && (
              <FavoritesSection
                favorites={favorites}
                onRemoveFavorite={handleRemoveFavorite}
                onSelectPlaceById={(id) => navigate(`/places/${id}`)}
              />
            )}

            {activeTab === 'trips' && (
              <UserTripsSection />
            )}

            {activeTab === 'visitLogs' && (
              <VisitedLogSection
                logs={visitLogs}
                onAddLog={handleAddVisitLog}
                onUpdateLog={handleUpdateVisitLog}
                onDeleteLog={handleDeleteVisitLog}
                onTogglePrivacy={handleToggleVisitLogPrivacy}
                onSelectPlace={(name) =>
                  navigate(`/explore?q=${encodeURIComponent(name)}`)
                }
              />
            )}

            {activeTab === 'friends' && (
              <FriendsSection
                onShowToast={showToast}
              />
            )}

            {activeTab === 'reviews' && (
              <UserReviewsSection reviews={reviews} />
            )}

            {activeTab === 'comments' && (
              <UserCommentsSection comments={comments} />
            )}

            {activeTab === 'blogs' && (
              <UserBlogsSection
                blogs={blogs}
                onDeleteBlog={handleDeleteBlog}
              />
            )}

            {activeTab === 'proposals' && (
              <UserProposalsSection
                proposals={proposals}
                onDeleteProposal={handleDeleteProposal}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
