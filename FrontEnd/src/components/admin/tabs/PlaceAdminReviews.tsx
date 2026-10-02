import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Plus,
  Search,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
  CornerDownRight,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react'
import { placeService } from '@/services/placeService'
import { adminService, extractList } from '@/services/adminService'
import { useAuth } from '@/context/AuthContext'
import { MediaLightboxModal } from '@/components/place/MediaLightboxModal'
import { CreateReviewForm } from '@/components/place/CreateReviewForm'
import type {
  ReviewItemDto,
  CommentDto,
  PlaceReviewSummaryDto,
  CreateReviewRequest
} from '@/types/models/place.model'

interface PlaceAdminReviewsProps {
  placeId: number
  placeName?: string
  onReviewsCountChange?: (count: number) => void
}

interface DeleteConfirmModalState {
  type: 'review' | 'comment'
  id: number
  parentReviewId?: number
  name: string
}

export const PlaceAdminReviews: React.FC<PlaceAdminReviewsProps> = ({
  placeId,
  placeName: _placeName,
  onReviewsCountChange
}) => {
  const { user } = useAuth()

  // Main Review State
  const [reviews, setReviews] = useState<ReviewItemDto[]>([])
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [avgRating, setAvgRating] = useState<number>(5)
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [successToast, setSuccessToast] = useState<string>('')

  // Filters & Sorting
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all')
  const [mediaOnlyFilter, setMediaOnlyFilter] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all')

  // Review Status Override Tracker (local state for optimistic UI)
  const [reviewStatusOverrides, setReviewStatusOverrides] = useState<Record<number, 'active' | 'hidden'>>({})

  // Comments Thread State
  const [openCommentsReviewId, setOpenCommentsReviewId] = useState<number | null>(null)
  const [commentsByReviewId, setCommentsByReviewId] = useState<Record<number, CommentDto[]>>({})
  const [loadingCommentsReviewId, setLoadingCommentsReviewId] = useState<number | null>(null)
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null)
  const [replyInputText, setReplyInputText] = useState<string>('')
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false)

  // Quick Admin Comment to Review
  const [newAdminCommentText, setNewAdminCommentText] = useState<Record<number, string>>({})
  const [isSubmittingAdminComment, setIsSubmittingAdminComment] = useState<boolean>(false)

  // Inline Comment Editing
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState<string>('')
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState<boolean>(false)

  // Lightbox Media Preview
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  // Create Review Form
  const [isCreateFormOpen, setIsCreateFormOpen] = useState<boolean>(false)

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmModalState | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const showNotification = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(''), 3500)
  }

  // 1. Fetch Reviews & Analytics from server
  const fetchReviews = useCallback(async () => {
    if (!placeId) return
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await placeService.getPlaceReviews(placeId, { page: 1, pageSize: 20 })
      if (res.success && res.data) {
        const data: PlaceReviewSummaryDto = res.data
        const items = data.items || []
        setReviews(items)
        setTotalReviews(data.totalReviews ?? items.length)
        setAvgRating(Number(data.avgRating) || 5)
        setRatingBreakdown(data.ratingBreakdown || {})
        onReviewsCountChange?.(data.totalReviews ?? items.length)
      } else {
        setReviews([])
        setTotalReviews(0)
      }
    } catch (err: any) {
      console.error('Error loading place reviews for admin:', err)
      setErrorMsg(err?.message || 'Không thể tải danh sách đánh giá của địa điểm.')
    } finally {
      setIsLoading(false)
    }
  }, [placeId, onReviewsCountChange])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // 2. Fetch Comments for a specific Review (GET /api/admin/comments)
  const fetchReviewComments = useCallback(async (reviewId: number) => {
    setLoadingCommentsReviewId(reviewId)
    try {
      // 1. Try Admin comments endpoint first
      const adminCommentsRes = await adminService.getComments({ page: 1, pageSize: 50, reviewId })
      const rawAdminItems = extractList(adminCommentsRes?.data || adminCommentsRes)
      const matchingComments = rawAdminItems.filter(
        (c: any) => Number(c.reviewId) === reviewId || Number(c.ReviewId) === reviewId
      )

      if (matchingComments.length > 0) {
        const formattedComments: CommentDto[] = matchingComments.map((c: any) => ({
          id: c.id,
          reviewId: c.reviewId,
          userId: c.userId,
          userName: c.userName || 'Người dùng',
          userAvatar: c.userAvatar,
          content: c.content,
          createdAt: c.createdAt,
          parentId: c.parentId || null,
          status: c.status || 'active',
          replies: []
        }))

        setCommentsByReviewId((prev) => ({
          ...prev,
          [reviewId]: formattedComments
        }))
        return
      }

      // 2. Fallback to review comments endpoint
      const res = await placeService.getReviewComments(reviewId)
      if (res.success && res.data) {
        setCommentsByReviewId((prev) => ({
          ...prev,
          [reviewId]: res.data.items || []
        }))
      }
    } catch {
      try {
        const res = await placeService.getReviewComments(reviewId)
        if (res.success && res.data) {
          setCommentsByReviewId((prev) => ({
            ...prev,
            [reviewId]: res.data.items || []
          }))
        }
      } catch {
        // Fallback
      }
    } finally {
      setLoadingCommentsReviewId(null)
    }
  }, [])

  const handleToggleComments = (reviewId: number) => {
    if (openCommentsReviewId === reviewId) {
      setOpenCommentsReviewId(null)
    } else {
      setOpenCommentsReviewId(reviewId)
      if (!commentsByReviewId[reviewId]) {
        fetchReviewComments(reviewId)
      }
    }
  }

  // 3. Admin: Toggle Review Status (Ẩn / Hiện Review)
  const handleToggleReviewStatus = async (review: ReviewItemDto, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const currentStatus = reviewStatusOverrides[review.id] || 'active'
    const nextStatus = currentStatus === 'active' ? 'hidden' : 'active'

    setReviewStatusOverrides((prev) => ({
      ...prev,
      [review.id]: nextStatus
    }))

    try {
      await adminService.updateReviewStatus(review.id, nextStatus)
      showNotification(`Đã ${nextStatus === 'active' ? 'công khai' : 'tạm ẩn'} đánh giá của ${review.userName}.`)
    } catch {
      setReviewStatusOverrides((prev) => ({
        ...prev,
        [review.id]: currentStatus
      }))
      alert('Không thể cập nhật trạng thái đánh giá trên máy chủ.')
    }
  }

  // 4. Admin: Delete Review
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'review') {
        try {
          await adminService.deleteReview(deleteTarget.id)
        } catch {
          await placeService.deleteReview(deleteTarget.id)
        }

        setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id))
        setTotalReviews((prev) => Math.max(0, prev - 1))
        showNotification(`Đã xóa vĩnh viễn đánh giá của "${deleteTarget.name}".`)
        if (openCommentsReviewId === deleteTarget.id) {
          setOpenCommentsReviewId(null)
        }
      } else if (deleteTarget.type === 'comment' && deleteTarget.parentReviewId) {
        const reviewId = deleteTarget.parentReviewId
        try {
          await adminService.deleteComment(deleteTarget.id)
        } catch {
          await placeService.deleteReviewComment(deleteTarget.id)
        }

        setCommentsByReviewId((prev) => {
          const list = prev[reviewId] || []
          const filtered = list
            .filter((c) => c.id !== deleteTarget.id)
            .map((c) => ({
              ...c,
              replies: c.replies ? c.replies.filter((rep) => rep.id !== deleteTarget.id) : []
            }))
          return { ...prev, [reviewId]: filtered }
        })

        // Update comment count on the review item
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, commentsCount: Math.max(0, (r.commentsCount || 1) - 1) } : r
          )
        )
        showNotification('Đã xóa bình luận thành công.')
      }
      setDeleteTarget(null)
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi xóa dữ liệu.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 5. Admin: Add Comment to Review
  const handleSendAdminComment = async (reviewId: number) => {
    const text = (newAdminCommentText[reviewId] || '').trim()
    if (!text) return

    setIsSubmittingAdminComment(true)
    try {
      const res = await placeService.createReviewComment({
        reviewId,
        content: text
      })
      if (res.success && res.data) {
        const created: CommentDto = {
          ...res.data,
          replies: []
        }
        setCommentsByReviewId((prev) => ({
          ...prev,
          [reviewId]: [created, ...(prev[reviewId] || [])]
        }))
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r))
        )
        setNewAdminCommentText((prev) => ({ ...prev, [reviewId]: '' }))
        showNotification('Đã gửi bình luận quản trị viên.')
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể gửi bình luận lúc này.')
    } finally {
      setIsSubmittingAdminComment(false)
    }
  }

  // 7. Admin: Reply to Nested Comment
  const handleSendReply = async (reviewId: number, parentId: number) => {
    if (!replyInputText.trim()) return

    setIsSubmittingReply(true)
    try {
      const res = await placeService.createReviewComment({
        reviewId,
        parentId,
        content: replyInputText.trim()
      })
      if (res.success && res.data) {
        const newReply: CommentDto = {
          ...res.data,
          replies: []
        }
        setCommentsByReviewId((prev) => {
          const list = prev[reviewId] || []
          const updated = list.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply]
              }
            }
            return c
          })
          return { ...prev, [reviewId]: updated }
        })
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r))
        )
        setReplyingToCommentId(null)
        setReplyInputText('')
        showNotification('Đã gửi phản hồi thành công.')
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi gửi phản hồi.')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  // 8. Admin: Save Comment Edit
  const handleSaveCommentEdit = async (reviewId: number, commentId: number) => {
    if (!editingCommentContent.trim()) return
    setIsSavingCommentEdit(true)
    try {
      const res = await placeService.updateReviewComment({
        commentId,
        content: editingCommentContent.trim()
      })
      if (res.success) {
        setCommentsByReviewId((prev) => {
          const list = prev[reviewId] || []
          const updated = list.map((c) => {
            if (c.id === commentId) {
              return { ...c, content: editingCommentContent.trim() }
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((rep) =>
                  rep.id === commentId ? { ...rep, content: editingCommentContent.trim() } : rep
                )
              }
            }
            return c
          })
          return { ...prev, [reviewId]: updated }
        })
        setEditingCommentId(null)
        setEditingCommentContent('')
        showNotification('Đã cập nhật nội dung bình luận.')
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể lưu chỉnh sửa bình luận.')
    } finally {
      setIsSavingCommentEdit(false)
    }
  }

  // 9. Admin: Submit New Review (Seeding / Test)
  const handleCreateReviewSubmit = async (data: CreateReviewRequest) => {
    try {
      const res = await placeService.submitReview(data)
      if (res.success && res.data) {
        setReviews((prev) => [res.data, ...prev])
        setTotalReviews((prev) => prev + 1)
        setIsCreateFormOpen(false)
        showNotification('Đã tạo đánh giá mới thành công!')
        fetchReviews()
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message || 'Không thể tạo đánh giá.' }
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || err?.message || 'Lỗi khi gửi đánh giá.' }
    }
  }

  // Computed & Filtered Reviews
  const filteredAndSortedReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        // Keyword
        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase()
          const matchUser = (rev.userName || '').toLowerCase().includes(q)
          const matchContent = (rev.content || '').toLowerCase().includes(q)
          const matchId = String(rev.id).includes(q)
          if (!matchUser && !matchContent && !matchId) return false
        }

        // Rating
        if (selectedRatingFilter !== 'all') {
          const rVal = parseInt(selectedRatingFilter, 10)
          if (Math.round(rev.rating) !== rVal) return false
        }

        // Media only
        if (mediaOnlyFilter) {
          const hasImg = Array.isArray(rev.images) && rev.images.length > 0
          const hasVid = Array.isArray(rev.videos) && rev.videos.length > 0
          if (!hasImg && !hasVid) return false
        }

        // Status
        const st = reviewStatusOverrides[rev.id] || 'active'
        if (statusFilter !== 'all' && st !== statusFilter) return false

        return true
      })
  }, [reviews, searchKeyword, selectedRatingFilter, mediaOnlyFilter, statusFilter, reviewStatusOverrides])

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-900 text-white shadow-xl flex items-center gap-2.5 border border-emerald-700 animate-in slide-in-from-top-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold text-xs">{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={fetchReviews}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold transition-colors cursor-pointer text-[11px]"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── SECTION 1: STATS & RATING BREAKDOWN OVERVIEW ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Trung tâm Quản trị Đánh giá & Bình luận
                </h3>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchReviews}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Tải lại danh sách đánh giá"
            >
              <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateFormOpen((prev) => !prev)}
              className={`px-4 py-2 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${isCreateFormOpen
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                }`}
            >
              {isCreateFormOpen ? <X size={14} /> : <Plus size={14} />}
              <span>{isCreateFormOpen ? 'Đóng biểu mẫu' : 'Thêm đánh giá'}</span>
            </button>
          </div>
        </div>

        {/* Rating Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 items-center">
          {/* Average Rating Big Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r md:border-slate-200 md:pr-6 py-2">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {avgRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={star <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
              ))}
            </div>
            <div className="text-xs font-bold text-slate-700">
              {totalReviews} đánh giá từ cộng đồng
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Cập nhật trực tiếp từ hệ thống
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown[String(star)] || 0
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
              const isSelected = selectedRatingFilter === String(star)

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRatingFilter(isSelected ? 'all' : String(star))}
                  className={`w-full flex items-center gap-3 p-1.5 rounded-xl transition-all text-left cursor-pointer ${isSelected ? 'bg-emerald-100/70 ring-1 ring-emerald-400' : 'hover:bg-white/80'
                    }`}
                  title={`Lọc xem các đánh giá ${star} sao`}
                >
                  <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-slate-700 text-xs">
                    <span>{star}</span>
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-emerald-600' : star === 3 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="w-16 text-right text-[11px] font-bold text-slate-600 shrink-0">
                    <span>{count}</span>
                    <span className="text-slate-400 font-normal ml-1">({percentage}%)</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CREATE REVIEW FORM ACCORDION ── */}
      {isCreateFormOpen && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-300 shadow-md animate-in slide-in-from-top-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Plus size={16} className="text-emerald-700" />
              <span>Thêm đánh giá mới cho địa điểm này</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsCreateFormOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
          <CreateReviewForm
            placeId={placeId}
            onClose={() => setIsCreateFormOpen(false)}
            onSubmitReview={handleCreateReviewSubmit}
          />
        </div>
      )}

      {/* ── SECTION 2: FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo nội dung, tên người dùng, ID..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-700 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all font-medium"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Rating Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-emerald-700"
            >
              <option value="all">Tất cả số sao (1 - 5 ★)</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
              <option value="4">⭐⭐⭐⭐ 4 sao</option>
              <option value="3">⭐⭐⭐ 3 sao</option>
              <option value="2">⭐⭐ 2 sao</option>
              <option value="1">⭐ 1 sao</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-emerald-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="hidden">Đang tạm ẩn</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags Bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setMediaOnlyFilter((prev) => !prev)}
              className={`px-3 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${mediaOnlyFilter
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
            >
              <ImageIcon size={12} />
              <span>Chỉ xem có hình ảnh/video</span>
            </button>

            {(searchKeyword || selectedRatingFilter !== 'all' || mediaOnlyFilter || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('')
                  setSelectedRatingFilter('all')
                  setMediaOnlyFilter(false)
                  setStatusFilter('all')
                }}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X size={12} />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>

          <div className="text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-900">{filteredAndSortedReviews.length}</strong> / {totalReviews} đánh giá
          </div>
        </div>
      </div>

      {/* ── SECTION 3: REVIEWS LIST ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
          <Loader2 size={32} className="animate-spin text-emerald-700" />
          <span className="font-semibold">Đang tải danh sách đánh giá từ máy chủ...</span>
        </div>
      ) : filteredAndSortedReviews.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center gap-3">
          <MessageSquare size={44} className="text-slate-300" />
          <p className="text-sm font-bold text-slate-800">Không tìm thấy đánh giá nào</p>
          <p className="text-xs text-slate-500 max-w-md">
            {reviews.length === 0
              ? 'Địa điểm này chưa có đánh giá nào từ cộng đồng. Bạn có thể sử dụng nút "Thêm đánh giá" ở trên để tạo đánh giá đầu tiên.'
              : 'Không có đánh giá nào phù hợp với bộ lọc hiện tại. Vui lòng xóa bớt bộ lọc để hiển thị lại dữ liệu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedReviews.map((rev) => {
            const isHidden = reviewStatusOverrides[rev.id] === 'hidden'
            const isCommentsOpen = openCommentsReviewId === rev.id
            const commentsList = commentsByReviewId[rev.id] || []
            const isLoadingComments = loadingCommentsReviewId === rev.id

            return (
              <div
                key={rev.id}
                className={`bg-white rounded-3xl border transition-all shadow-2xs overflow-hidden ${isHidden ? 'border-amber-200/90 bg-amber-50/20 opacity-80' : 'border-slate-200/90 hover:border-slate-300'
                  }`}
              >
                {/* Review Header Card */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* User Profile & Rating */}
                    <div className="flex items-center gap-3">
                      {rev.userAvatar ? (
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            ; (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
                          {(rev.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">{rev.userName}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{rev.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isHidden
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                          >
                            {isHidden ? 'Đang tạm ẩn' : 'Công khai'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= Math.round(rev.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                            <span className="font-bold text-slate-800 ml-1">({rev.rating.toFixed(1)})</span>
                          </div>

                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar size={11} />
                            <span>
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Toolbar */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleReviewStatus(rev, e)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${isHidden
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        title={isHidden ? 'Bấm để công khai lại đánh giá này' : 'Bấm để tạm ẩn đánh giá này'}
                      >
                        {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>{isHidden ? 'Hiện' : 'Ẩn'}</span>
                      </button>

                      {/* Delete Review */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'review',
                            id: rev.id,
                            name: rev.userName || `Đánh giá #${rev.id}`
                          })
                        }
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        title="Xóa đánh giá này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line pl-0.5">
                    {rev.content || <span className="italic text-slate-400">Người dùng không để lại lời bình luận.</span>}
                  </div>

                  {/* Media Gallery (Images & Videos) */}
                  {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {rev.images?.map((imgUrl, i) => (
                        <div
                          key={`img-${i}`}
                          onClick={() => setLightboxMedia({ url: imgUrl, type: 'image' })}
                          className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer group shadow-2xs hover:ring-2 hover:ring-emerald-400 transition-all"
                        >
                          <img
                            src={imgUrl}
                            alt={`Ảnh review ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}

                      {rev.videos?.map((vidUrl, i) => (
                        <div
                          key={`vid-${i}`}
                          onClick={() => setLightboxMedia({ url: vidUrl, type: 'video' })}
                          className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer group shadow-2xs hover:ring-2 hover:ring-emerald-400 transition-all flex items-center justify-center"
                        >
                          <video src={vidUrl} className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-1.5 bg-black/60 rounded-full text-white">
                              <Play size={14} className="fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer Interaction & Toggle Comment Thread */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-bold text-slate-600">
                        <ThumbsUp size={13} className="text-emerald-700" />
                        <span>{rev.likesCount || 0} lượt thích</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleComments(rev.id)}
                        className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${isCommentsOpen
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                      >
                        <MessageSquare size={13} />
                        <span>{rev.commentsCount || 0} bình luận</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      ID Tác giả: #{rev.userId}
                    </div>
                  </div>
                </div>

                {/* ── COMMENTS THREAD ACCORDION (FULL ADMIN CONTROL) ── */}
                {isCommentsOpen && (
                  <div className="bg-slate-50/90 border-t border-slate-200/90 p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                        <MessageSquare size={14} className="text-emerald-800" />
                        <span>Quản lý bài đánh giá này ({commentsList.length})</span>
                      </h5>

                      <button
                        type="button"
                        onClick={() => fetchReviewComments(rev.id)}
                        disabled={isLoadingComments}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                        title="Tải lại bình luận"
                      >
                        <RotateCcw size={13} className={isLoadingComments ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {/* Quick Admin Reply Box */}
                    <div className="flex items-start gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Viết phản hồi / bình luận từ Quản trị viên..."
                          value={newAdminCommentText[rev.id] || ''}
                          onChange={(e) =>
                            setNewAdminCommentText((prev) => ({
                              ...prev,
                              [rev.id]: e.target.value
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendAdminComment(rev.id)
                            }
                          }}
                          className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendAdminComment(rev.id)}
                          disabled={isSubmittingAdminComment || !(newAdminCommentText[rev.id] || '').trim()}
                          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 text-xs shadow-xs"
                        >
                          {isSubmittingAdminComment ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Send size={13} />
                          )}
                          <span>Gửi</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {isLoadingComments ? (
                      <div className="py-6 flex items-center justify-center text-slate-400 gap-2">
                        <Loader2 size={18} className="animate-spin text-emerald-700" />
                        <span className="text-xs">Đang tải bình luận...</span>
                      </div>
                    ) : commentsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Đánh giá này chưa có bình luận nào.
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {commentsList.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            {/* Parent Comment Card */}
                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 group">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                    {(comment.userName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-xs text-slate-900">
                                      {comment.userName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-2">
                                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : ''}
                                    </span>
                                  </div>
                                </div>

                                {/* Admin Action Toolbar on Comment */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingToCommentId(
                                        replyingToCommentId === comment.id ? null : comment.id
                                      )
                                      setReplyInputText(`@${comment.userName} `)
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title="Trả lời bình luận này"
                                  >
                                    Phản hồi
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(comment.id)
                                      setEditingCommentContent(comment.content)
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                                    title="Sửa bình luận"
                                  >
                                    <Pencil size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: 'comment',
                                        id: comment.id,
                                        parentReviewId: rev.id,
                                        name: `Bình luận của ${comment.userName}`
                                      })
                                    }
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                    title="Xóa bình luận"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Comment Content (View or Edit Mode) */}
                              {editingCommentId === comment.id ? (
                                <div className="space-y-2 pt-1">
                                  <textarea
                                    rows={2}
                                    value={editingCommentContent}
                                    onChange={(e) => setEditingCommentContent(e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-emerald-600 rounded-xl outline-none"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCommentId(null)}
                                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-semibold"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveCommentEdit(rev.id, comment.id)}
                                      disabled={isSavingCommentEdit}
                                      className="px-3 py-1 text-xs bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold cursor-pointer shadow-xs"
                                    >
                                      Lưu
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-0.5">
                                  {comment.content}
                                </p>
                              )}
                            </div>

                            {/* Reply Input Box */}
                            {replyingToCommentId === comment.id && (
                              <div className="ml-6 flex items-start gap-2 bg-white p-2.5 rounded-2xl border border-emerald-300 shadow-2xs animate-in fade-in">
                                <CornerDownRight size={14} className="text-emerald-700 mt-1 shrink-0" />
                                <input
                                  type="text"
                                  placeholder="Nhập nội dung phản hồi..."
                                  value={replyInputText}
                                  onChange={(e) => setReplyInputText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSendReply(rev.id, comment.id)
                                  }}
                                  className="flex-1 px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(rev.id, comment.id)}
                                  disabled={isSubmittingReply || !replyInputText.trim()}
                                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                                >
                                  Gửi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReplyingToCommentId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}

                            {/* Nested Replies List */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-6 space-y-2 border-l-2 border-slate-200 pl-3">
                                {comment.replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                          {(reply.userName || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-extrabold text-[11px] text-slate-900">
                                          {reply.userName}
                                        </span>
                                        <span className="text-[9px] text-slate-400">
                                          {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCommentId(reply.id)
                                            setEditingCommentContent(reply.content)
                                          }}
                                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                                          title="Sửa phản hồi"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDeleteTarget({
                                              type: 'comment',
                                              id: reply.id,
                                              parentReviewId: rev.id,
                                              name: `Phản hồi của ${reply.userName}`
                                            })
                                          }
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                          title="Xóa phản hồi"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>

                                    {editingCommentId === reply.id ? (
                                      <div className="space-y-2 pt-1">
                                        <textarea
                                          rows={2}
                                          value={editingCommentContent}
                                          onChange={(e) => setEditingCommentContent(e.target.value)}
                                          className="w-full p-2 text-xs bg-slate-50 border border-emerald-600 rounded-xl outline-none"
                                        />
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setEditingCommentId(null)}
                                            className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                                          >
                                            Hủy
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveCommentEdit(rev.id, reply.id)}
                                            disabled={isSavingCommentEdit}
                                            className="px-2.5 py-0.5 text-xs bg-emerald-800 text-white rounded font-bold cursor-pointer"
                                          >
                                            Lưu
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-0.5">
                                        {reply.content}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxMedia && (
        <MediaLightboxModal
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Xác nhận xóa vĩnh viễn
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa {deleteTarget.type === 'review' ? 'bài đánh giá' : 'bình luận'} của{' '}
              <strong className="text-slate-900 font-bold">"{deleteTarget.name}"</strong> khỏi hệ thống? Tất cả dữ liệu liên quan sẽ bị xóa hoàn toàn.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceAdminReviews
