import { useState } from 'react'
import { Star, MessageSquare, Send, X, AlertCircle } from 'lucide-react'
import { placeService } from '@/services/placeService'
import type { ReviewItemDto } from '@/types/models/place.model'

interface PlaceDetailReviewsProps {
  placeId: number
  reviews: ReviewItemDto[]
  ratingBreakdown: Record<string, number>
  avgRating: number
  isAuthenticated: boolean
  onReviewAdded: (newReview: ReviewItemDto) => void
}

export const PlaceDetailReviews = ({
  placeId,
  reviews,
  ratingBreakdown,
  avgRating,
  isAuthenticated,
  onReviewAdded
}: PlaceDetailReviewsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalReviews = reviews.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi đánh giá.')
      return
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung cảm nhận của bạn.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const res = await placeService.submitReview({
        placeId,
        rating,
        content: content.trim()
      })
      if (res.success && res.data) {
        onReviewAdded(res.data)
        setContent('')
        setIsModalOpen(false)
      } else {
        setError(res.message || 'Không thể gửi đánh giá lúc này.')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Đã xảy ra lỗi khi gửi đánh giá.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 sm:p-7 rounded-lg border border-gray-200/80 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>Đánh giá từ cộng đồng ({totalReviews})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Trải nghiệm thực tế của du khách đã từng ghé thăm</p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              alert('Vui lòng đăng nhập để gửi đánh giá.')
              return
            }
            setIsModalOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
        >
          <Star className="w-4 h-4 fill-white" />
          <span>Viết đánh giá</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50/80 rounded-lg border border-gray-100">
        <div className="flex flex-col items-center justify-center text-center md:border-r md:border-gray-200 pr-4">
          <div className="text-4xl font-extrabold text-gray-900">{Number(avgRating || 5).toFixed(1)}</div>
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(avgRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">Dựa trên {totalReviews} lượt đánh giá</span>
        </div>

        <div className="md:col-span-2 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star.toString()] || 0
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-12 text-gray-600 font-medium shrink-0">{star} sao</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-500 font-medium shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            Chưa có đánh giá nào cho địa điểm này. Hãy là người đầu tiên chia sẻ cảm nhận!
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-lg border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {r.userAvatar ? (
                    <img
                      src={r.userAvatar}
                      alt={r.userName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200 shrink-0">
                      {(r.userName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.userName}</div>
                    <div className="text-2xs text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-900">{r.rating}</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{r.content}</p>

              {r.images && r.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Ảnh đánh giá"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-2xs"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-lg font-bold text-gray-900">Viết đánh giá địa điểm</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Mức độ hài lòng của bạn</label>
                <div className="flex items-center gap-2 my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 text-gray-300 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-gray-700 ml-2">
                    {rating === 5 && 'Tuyệt vời'}
                    {rating === 4 && 'Rất tốt'}
                    {rating === 3 && 'Hài lòng'}
                    {rating === 2 && 'Trung bình'}
                    {rating === 1 && 'Không tốt'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Nội dung chia sẻ cảm nhận</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Chia sẻ kinh nghiệm thực tế của bạn về địa điểm này (cảnh quan, phục vụ, giá vé, lời khuyên)..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang gửi...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Đăng đánh giá</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
