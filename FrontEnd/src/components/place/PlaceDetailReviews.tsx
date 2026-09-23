import React, { useState } from 'react'
import { Star, MessageSquare, Plus, X, ChevronDown, Loader2 } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { ReviewItemCard } from './ReviewItemCard'
import { CreateReviewForm } from './CreateReviewForm'
import type { ReviewItemDto, CreateReviewRequest } from '@/types/models/place.model'

interface PlaceDetailReviewsProps {
  placeId: number
  reviews: ReviewItemDto[]
  totalReviews?: number
  ratingBreakdown: Record<string, number>
  avgRating: number
  isAuthenticated: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onReviewAdded: (newReview: ReviewItemDto) => void
  onReviewUpdated?: (updatedReview: ReviewItemDto) => void
  onReviewDeleted?: (reviewId: number) => void
}

export const PlaceDetailReviews: React.FC<PlaceDetailReviewsProps> = ({
  placeId,
  reviews,
  totalReviews,
  ratingBreakdown,
  avgRating,
  isAuthenticated,
  hasMore,
  isLoadingMore = false,
  onLoadMore,
  onReviewAdded,
  onReviewUpdated,
  onReviewDeleted
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const effectiveTotalReviews = totalReviews !== undefined ? totalReviews : reviews.length
  const shouldShowLoadMore = hasMore !== undefined ? hasMore : reviews.length < effectiveTotalReviews

  const handleToggleWriteReview = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi đánh giá.')
      return
    }
    setIsFormOpen((prev) => !prev)
  }

  const handleReviewSubmit = async (data: CreateReviewRequest) => {
    try {
      const res = await placeService.submitReview(data)
      if (res.success && res.data) {
        onReviewAdded(res.data)
        setIsFormOpen(false)
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message || 'Không thể gửi đánh giá.' }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      return {
        success: false,
        message: axiosErr?.response?.data?.message || 'Đã có lỗi xảy ra khi gửi đánh giá.'
      }
    }
  }

  return (
    <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>Đánh giá từ cộng đồng</span>
          </h2>
        </div>

        <button type="button"
          onClick={handleToggleWriteReview}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors cursor-pointer ${isFormOpen
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>Đóng biểu mẫu</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Viết đánh giá</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4.5 bg-slate-50/80 rounded-xl border border-slate-100">
        <div className="flex flex-col items-center justify-center text-center md:border-r md:border-slate-200 pr-4">
          <div className="text-4xl font-black text-slate-900">{Number(avgRating || 5).toFixed(1)}</div>
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= Math.round(avgRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium">Dựa trên {effectiveTotalReviews} lượt đánh giá</span>
        </div>

        <div className="md:col-span-2 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star.toString()] || 0
            const pct = effectiveTotalReviews > 0 ? (count / effectiveTotalReviews) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2.5 text-xs">
                <span className="w-12 text-slate-600 font-semibold shrink-0">{star} sao</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500 font-medium shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {isFormOpen && (
        <CreateReviewForm
          placeId={placeId}
          onClose={() => setIsFormOpen(false)}
          onSubmitReview={handleReviewSubmit}
        />
      )}

      <div className="space-y-4 pt-2">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs sm:text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Chưa có đánh giá nào cho địa điểm này. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
          </div>
        ) : (
          <>
            {reviews.map((r) => (
              <ReviewItemCard
                key={r.id}
                review={r}
                isAuthenticated={isAuthenticated}
                onReviewUpdated={onReviewUpdated}
                onReviewDeleted={onReviewDeleted}
              />
            ))}

            {shouldShowLoadMore && (
              <div className="pt-4 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs hover:border-slate-300 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Đang tải thêm đánh giá...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      <span>Xem thêm đánh giá ({reviews.length}/{effectiveTotalReviews})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

