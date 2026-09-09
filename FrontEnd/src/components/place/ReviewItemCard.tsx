import React, { useState } from 'react'
import { Star, ThumbsUp, MessageSquare, Share2, Play, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { placeService } from '@/services/placeService'
import { ReviewCommentThread } from './ReviewCommentThread'
import { MediaLightboxModal } from './MediaLightboxModal'
import { EditReviewModal } from './EditReviewModal'
import type { ReviewItemDto, UpdateReviewRequest } from '@/types/models/place.model'

interface ReviewItemCardProps {
  review: ReviewItemDto
  isAuthenticated: boolean
  onReviewUpdated?: (updatedReview: ReviewItemDto) => void
  onReviewDeleted?: (reviewId: number) => void
}

export const ReviewItemCard: React.FC<ReviewItemCardProps> = ({
  review,
  isAuthenticated,
  onReviewUpdated,
  onReviewDeleted
}) => {
  const { user } = useAuth()
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [likesCount, setLikesCount] = useState(review.likesCount || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [commentsCount, setCommentsCount] = useState(review.commentsCount || 0)
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = Boolean(isAuthenticated && user && String(user.id) === String(review.userId))

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thích đánh giá.')
      return
    }
    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Đã sao chép liên kết đánh giá vào bộ nhớ tạm!')
  }

  const handleUpdateReview = async (data: UpdateReviewRequest) => {
    const res = await placeService.updateReview(data)
    if (res.success && res.data) {
      onReviewUpdated?.(res.data)
      return { success: true, data: res.data }
    }
    return { success: false, message: res.message || 'Không thể cập nhật đánh giá.' }
  }

  const handleDeleteReview = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đánh giá này?')) return

    setIsDeleting(true)
    try {
      const res = await placeService.deleteReview(review.id)
      if (res.success) {
        onReviewDeleted?.(review.id)
      } else {
        alert(res.message || 'Không thể xóa bài đánh giá.')
      }
    } catch {
      alert('Đã xảy ra lỗi khi xóa bài đánh giá.')
    } finally {
      setIsDeleting(false)
    }
  }

  const hasPhotos = review.images && review.images.length > 0
  const hasVideos = review.videos && review.videos.length > 0

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300/80 transition-all space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {review.userAvatar ? (
            <img
              src={review.userAvatar}
              alt={review.userName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200 shrink-0">
              {(review.userName || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="font-bold text-slate-900 text-sm">{review.userName}</div>
            <div className="text-[11px] text-slate-400">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-md transition-colors cursor-pointer"
                title="Chỉnh sửa đánh giá"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteReview}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors cursor-pointer disabled:opacity-50"
                title="Xóa đánh giá"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-900">{review.rating}</span>
          </div>
        </div>
      </div>

      {review.content && (
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">
          {review.content}
        </p>
      )}

      {(hasPhotos || hasVideos) && (
        <div className="space-y-2 pt-1">
          {hasPhotos && (
            <div className="flex flex-wrap gap-2">
              {review.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveMedia({ url: imgUrl, type: 'image' })}
                  className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:opacity-90 transition-opacity"
                >
                  <img
                    src={imgUrl}
                    alt={`Ảnh đánh giá ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}

          {hasVideos && (
            <div className="flex flex-wrap gap-2">
              {review.videos?.map((videoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveMedia({ url: videoUrl, type: 'video' })}
                  className="relative group w-36 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-2xs flex items-center justify-center"
                >
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLikeToggle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isLiked
                ? 'text-emerald-700 bg-emerald-50 font-bold'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-emerald-600' : ''}`} />
            <span>{likesCount > 0 ? likesCount : 'Hữu ích'}</span>
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isCommentsOpen
                ? 'text-emerald-700 bg-emerald-50 font-bold'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {commentsCount > 0 ? `${commentsCount} phản hồi` : 'Bình luận'}
            </span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Chia sẻ đánh giá"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </button>
      </div>

      {isCommentsOpen && (
        <ReviewCommentThread
          reviewId={review.id}
          onCommentsCountChange={setCommentsCount}
        />
      )}

      {isEditModalOpen && (
        <EditReviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          review={review}
          onUpdateReview={handleUpdateReview}
        />
      )}

      {activeMedia && (
        <MediaLightboxModal
          mediaUrl={activeMedia.url}
          mediaType={activeMedia.type}
          onClose={() => setActiveMedia(null)}
        />
      )}
    </div>
  )
}
