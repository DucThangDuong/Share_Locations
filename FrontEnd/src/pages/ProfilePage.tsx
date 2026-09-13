import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal'
import { FavoritesSection } from '@/components/profile/FavoritesSection'
import { VisitedLogSection } from '@/components/profile/VisitedLogSection'
import { UserReviewsSection } from '@/components/profile/UserReviewsSection'
import { UserCommentsSection } from '@/components/profile/UserCommentsSection'
import { UserBlogsSection } from '@/components/profile/UserBlogsSection'
import { UserProposalsSection } from '@/components/profile/UserProposalsSection'
import { userService } from '@/services/userService'
import { blogService, type CreateBlogRequest } from '@/services/blogService'
import {
  Mail,
  Phone,
  Shield,
  Edit3,
  Key,
  BookOpen,
  Compass,
  Bookmark,
  PlusCircle,
  CheckCircle2,
  Inbox,
  UserCheck,
  Star,
  MessageSquare
} from 'lucide-react'
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

type TabType = 'favorites' | 'visitLogs' | 'reviews' | 'comments' | 'blogs' | 'proposals'

interface TabConfigItem {
  label: string
  tabIcon: React.ElementType
  emptyIcon: React.ElementType
  color: string
  title: string
  desc: string
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, user, updateProfile, isLoading: isAuthLoading } = useAuth()

  const validTabs: TabType[] = ['favorites', 'visitLogs', 'reviews', 'comments', 'blogs', 'proposals']
  const tabFromUrl = searchParams.get('tab') as TabType | null
  const activeTab: TabType = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'favorites'

  const handleTabChange = (tabKey: TabType) => {
    const newParams = new URLSearchParams()
    newParams.set('tab', tabKey)
    setSearchParams(newParams, { replace: true })
  }

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isTabLoading, setIsTabLoading] = useState(false)

  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLogItem[]>([])
  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [comments, setComments] = useState<UserCommentItem[]>([])
  const [blogs, setBlogs] = useState<UserBlogItem[]>([])
  const [proposals, setProposals] = useState<ProposalItem[]>([])

  const [counts, setCounts] = useState<Record<TabType, number>>({
    favorites: 0,
    visitLogs: 0,
    reviews: 0,
    comments: 0,
    blogs: 0,
    proposals: 0
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const parseResult = <T,>(data: T[] | PagedResultDto<T> | undefined | null): { items: T[]; total: number } => {
    if (!data) return { items: [], total: 0 }
    if (Array.isArray(data)) {
      return { items: data, total: data.length }
    }
    if (Array.isArray(data.items)) {
      return { items: data.items, total: typeof data.totalCount === 'number' ? data.totalCount : data.items.length }
    }
    return { items: [], total: 0 }
  }

  const fetchAllCounts = useCallback(async () => {
    try {
      const [favRes, logRes, revRes, comRes, blogRes, propRes] = await Promise.allSettled([
        userService.getMyFavorites({ pageSize: 50 }),
        userService.getMyVisitLogs({ pageSize: 50 }),
        userService.getMyReviews({ pageSize: 50 }),
        userService.getMyComments({ pageSize: 50 }),
        userService.getMyBlogs({ pageSize: 50 }),
        userService.getMyProposals({ pageSize: 50 })
      ])

      const extractCount = (settled: PromiseSettledResult<{ success?: boolean; data?: unknown }>) => {
        if (settled.status === 'fulfilled' && settled.value?.success && settled.value.data) {
          return parseResult(settled.value.data as unknown[]).total
        }
        return 0
      }

      setCounts({
        favorites: extractCount(favRes),
        visitLogs: extractCount(logRes),
        reviews: extractCount(revRes),
        comments: extractCount(comRes),
        blogs: extractCount(blogRes),
        proposals: extractCount(propRes)
      })
    } catch {
    }
  }, [])

  const fetchTabData = useCallback(async (tab: TabType) => {
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
          setBlogs(parsed.items)
          setCounts((prev) => ({ ...prev, blogs: parsed.total }))
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
    } finally {
      setIsTabLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllCounts()
  }, [fetchAllCounts])

  useEffect(() => {
    fetchTabData(activeTab)
  }, [activeTab, fetchTabData])

  const handleRemoveFavorite = async (targetType: number, targetId: number) => {
    try {
      const res = await userService.removeFavorite(targetType, targetId)
      if (res.success) {
        setFavorites((prev) => prev.filter((item) => !(item.targetType === targetType && item.targetId === targetId)))
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

  const handleAddBlog = async (newBlog: CreateBlogRequest) => {
    try {
      const res = await blogService.createBlog(newBlog)
      if (res.success && res.data) {
        setBlogs((prev) => [res.data, ...prev])
        setCounts((prev) => ({ ...prev, blogs: prev.blogs + 1 }))
        showToast(newBlog.status === 0 ? 'Đã lưu bản nháp bài viết.' : 'Đã xuất bản bài viết.')
      } else {
        showToast('Không thể tạo bài viết.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi đăng bài viết.')
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
        showToast('Không thể xóa bài viết.')
      }
    } catch {
      showToast('Có lỗi xảy ra khi xóa bài viết.')
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const currentProfile = {
    fullName: user?.fullName || profile?.fullName || 'Người dùng LangThang',
    email: user?.email || profile?.email || '',
    phone: user?.phone || profile?.phone || '',
    bio: user?.bio || profile?.bio || 'Chưa có tiểu sử giới thiệu bản thân.',
    avatarUrl: user?.avatarUrl || profile?.avatarUrl || undefined,
    coverUrl: user?.coverUrl || profile?.coverUrl || undefined,
    rankLevel: user?.rankLevel || profile?.rankLevel || 'Tân binh',
    reputationScore: user?.reputationScore ?? profile?.reputationScore ?? 0,
    role: user?.role || 'User'
  }

  const formattedPhone = currentProfile.phone
    ? currentProfile.phone.length > 6
      ? `${currentProfile.phone.slice(0, 4)} *** ${currentProfile.phone.slice(-3)}`
      : currentProfile.phone
    : 'Chưa cập nhật'

  const TAB_CONFIG: Record<TabType, TabConfigItem> = {
    favorites: {
      label: `Đã lưu (${counts.favorites || favorites.length})`,
      tabIcon: Bookmark,
      emptyIcon: Bookmark,
      color: 'bg-emerald-50 text-emerald-700',
      title: 'Chưa lưu địa điểm nào',
      desc: 'Danh sách các địa điểm yêu thích của bạn đang trống. Hãy dạo quanh trang chủ để lưu lại các địa điểm hấp dẫn!'
    },
    visitLogs: {
      label: `Nhật ký (${counts.visitLogs || visitLogs.length})`,
      tabIcon: Compass,
      emptyIcon: Compass,
      color: 'bg-teal-50 text-teal-700',
      title: 'Chưa có nhật ký chuyến đi nào',
      desc: 'Bạn chưa lưu lại nhật ký địa điểm nào đã đi qua. Hãy ghi lại những kỷ niệm và chia sẻ cùng mọi người!'
    },
    reviews: {
      label: `Đánh giá (${counts.reviews || reviews.length})`,
      tabIcon: Star,
      emptyIcon: Star,
      color: 'bg-amber-50 text-amber-700',
      title: 'Chưa có đánh giá nào',
      desc: 'Bạn chưa viết đánh giá địa điểm nào. Hãy chia sẻ cảm nhận thực tế sau các chuyến đi của mình nhé!'
    },
    comments: {
      label: `Bình luận (${counts.comments || comments.length})`,
      tabIcon: MessageSquare,
      emptyIcon: MessageSquare,
      color: 'bg-teal-50 text-teal-700',
      title: 'Chưa có bình luận nào',
      desc: 'Lịch sử thảo luận của bạn tại các bài viết cẩm nang và hỏi đáp địa điểm sẽ hiển thị tại đây.'
    },
    blogs: {
      label: `Bài viết (${counts.blogs || blogs.length})`,
      tabIcon: BookOpen,
      emptyIcon: BookOpen,
      color: 'bg-indigo-50 text-indigo-700',
      title: 'Chưa có bài viết nào',
      desc: 'Bạn chưa đăng bài viết chia sẻ cẩm nang du lịch nào. Hãy viết bài đầu tiên để chia sẻ với cộng đồng LangThang!'
    },
    proposals: {
      label: `Đề xuất (${counts.proposals || proposals.length})`,
      tabIcon: PlusCircle,
      emptyIcon: Inbox,
      color: 'bg-blue-50 text-blue-700',
      title: 'Chưa có đề xuất địa điểm nào',
      desc: 'Bạn chưa gửi đề xuất địa điểm mới nào cho hệ thống. Đóng góp địa điểm để tích lũy điểm cống hiến nhé!'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-dark text-white text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative rounded-lg overflow-hidden bg-white border border-slate-200/80">
          <div className="h-48 sm:h-64 lg:h-72 w-full relative bg-slate-900">
            {currentProfile.coverUrl ? (
              <img
                src={currentProfile.coverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
          </div>

          <div className="px-6 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="-mt-14 sm:-mt-20 w-28 sm:w-36 h-28 sm:h-36 rounded-lg overflow-hidden border-4 border-white bg-slate-200 shrink-0 ring-1 ring-slate-200/50 flex items-center justify-center">
                  {currentProfile.avatarUrl ? (
                    <img
                      src={currentProfile.avatarUrl}
                      alt={currentProfile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-700 text-white flex items-center justify-center text-3xl font-extrabold">
                      {currentProfile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 sm:pt-4 sm:pb-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                      {currentProfile.fullName}
                    </h1>
                    <span className="bg-emerald-100/90 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" /> {currentProfile.rankLevel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
                    {currentProfile.bio || 'Người dùng chưa thêm mô tả bản thân'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-end w-full sm:w-auto sm:pb-1 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 active-press cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa hồ sơ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg active-press transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg p-6 border border-slate-200/80 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Thông tin cá nhân</span>
              </h2>

              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Email</div>
                    <span className="font-medium text-slate-800 truncate">{currentProfile.email || 'Chưa cập nhật'}</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Số điện thoại</div>
                    <span className="font-medium text-slate-800">{formattedPhone}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-200/80 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>Điểm cống hiến</span>
              </h2>

              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
                    {currentProfile.reputationScore}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Điểm uy tín tích lũy</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-lg p-2 border border-slate-200/80 flex flex-wrap gap-1.5">
              {(Object.keys(TAB_CONFIG) as TabType[]).map((tabKey) => {
                const conf = TAB_CONFIG[tabKey]
                const TabIcon = conf.tabIcon
                const isActive = activeTab === tabKey
                return (
                  <button
                    type="button"
                    key={tabKey}
                    onClick={() => handleTabChange(tabKey)}
                    className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isActive
                      ? 'bg-primary-container text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80'
                      }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{conf.label}</span>
                  </button>
                )
              })}
            </div>

            {isTabLoading ? (
              <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
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

                {activeTab === 'visitLogs' && (
                  <VisitedLogSection
                    logs={visitLogs}
                    onAddLog={handleAddVisitLog}
                    onUpdateLog={handleUpdateVisitLog}
                    onDeleteLog={handleDeleteVisitLog}
                    onTogglePrivacy={handleToggleVisitLogPrivacy}
                    onSelectPlace={(name) => navigate(`/explore?q=${encodeURIComponent(name)}`)}
                  />
                )}

                {activeTab === 'reviews' && (
                  <UserReviewsSection
                    reviews={reviews}
                  />
                )}

                {activeTab === 'comments' && (
                  <UserCommentsSection
                    comments={comments}
                  />
                )}

                {activeTab === 'blogs' && (
                  <UserBlogsSection
                    blogs={blogs}
                    onAddBlog={handleAddBlog}
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
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={currentProfile}
        onSave={async (updated) => {
          await updateProfile(updated)
          showToast('Đã lưu thay đổi hồ sơ thành công.')
        }}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  )
}
