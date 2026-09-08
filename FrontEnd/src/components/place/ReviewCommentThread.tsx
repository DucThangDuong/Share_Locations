import React, { useState, useEffect, useCallback } from 'react'
import { Send, Loader2, MessageSquare, AlertCircle } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { useAuth } from '@/context/AuthContext'
import { ReviewCommentItem } from './ReviewCommentItem'
import type { CommentDto } from '@/types/models/place.model'

interface ReviewCommentThreadProps {
  reviewId: number
  onCommentsCountChange?: (newCount: number) => void
}

export const ReviewCommentThread: React.FC<ReviewCommentThreadProps> = ({
  reviewId,
  onCommentsCountChange
}) => {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<CommentDto[]>([])
  const [totalComments, setTotalComments] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [rootText, setRootText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await placeService.getReviewComments(reviewId)
      if (res.success && res.data) {
        setComments(res.data.items || [])
        setTotalComments(res.data.totalComments || 0)
        onCommentsCountChange?.(res.data.totalComments || 0)
      }
    } catch {
      setError('Không thể tải danh sách bình luận lúc này.')
    } finally {
      setLoading(false)
    }
  }, [reviewId, onCommentsCountChange])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleRootSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi bình luận.')
      return
    }
    if (!rootText.trim()) return

    setIsSubmitting(true)
    setError('')
    try {
      const res = await placeService.createReviewComment({
        reviewId,
        content: rootText.trim()
      })
      if (res.success && res.data) {
        const newComment: CommentDto = {
          ...res.data,
          replies: []
        }
        setComments((prev) => [newComment, ...prev])
        const updatedTotal = totalComments + 1
        setTotalComments(updatedTotal)
        onCommentsCountChange?.(updatedTotal)
        setRootText('')
      } else {
        setError(res.message || 'Không thể gửi bình luận.')
      }
    } catch {
      setError('Đã xảy ra lỗi khi gửi bình luận.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId: number, content: string): Promise<boolean> => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi phản hồi.')
      return false
    }
    try {
      const res = await placeService.createReviewComment({
        reviewId,
        content,
        parentId
      })
      if (res.success && res.data) {
        const newReply: CommentDto = {
          ...res.data,
          replies: []
        }
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply]
              }
            }
            return c
          })
        )
        const updatedTotal = totalComments + 1
        setTotalComments(updatedTotal)
        onCommentsCountChange?.(updatedTotal)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return (
    <div className="pt-3 border-t border-slate-100 space-y-4">
      <form onSubmit={handleRootSubmit} className="flex items-center gap-3">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
            {(user?.fullName || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition-all px-3 py-1.5 shadow-2xs">
          <input
            type="text"
            maxLength={1000}
            value={rootText}
            onChange={(e) => setRootText(e.target.value)}
            placeholder={isAuthenticated ? 'Viết bình luận của bạn...' : 'Đăng nhập để bình luận...'}
            disabled={!isAuthenticated || isSubmitting}
            className="flex-1 text-xs bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 py-1"
          />

          <button
            type="submit"
            disabled={!isAuthenticated || isSubmitting || !rootText.trim()}
            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Gửi</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang tải bình luận...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-3 text-slate-400 text-xs flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chưa có bình luận nào. Hãy là người đầu tiên để lại phản hồi!</span>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {comments.map((comment) => (
            <ReviewCommentItem
              key={comment.id}
              comment={comment}
              isAuthenticated={isAuthenticated}
              currentUserAvatar={user?.avatarUrl}
              currentUserName={user?.fullName}
              onReplySubmit={handleReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
