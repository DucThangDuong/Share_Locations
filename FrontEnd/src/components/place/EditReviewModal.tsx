import React, { useState, useRef, useEffect } from 'react'
import { Star, X, ImageIcon, Video, Trash2, Calendar, AlertCircle, Loader2, Send } from 'lucide-react'
import type { UpdateReviewRequest, ReviewItemDto } from '@/types/models/place.model'

interface EditReviewModalProps {
  isOpen: boolean
  onClose: () => void
  review: ReviewItemDto
  onUpdateReview: (data: UpdateReviewRequest) => Promise<{ success: boolean; data?: ReviewItemDto; message?: string }>
}

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const MAX_VIDEO_SIZE = 30 * 1024 * 1024
const ALLOWED_PHOTO_EXTS = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_EXTS = ['video/mp4', 'video/quicktime', 'video/webm']

export const EditReviewModal: React.FC<EditReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  onUpdateReview
}) => {
  const [rating, setRating] = useState<number>(review.rating || 5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [content, setContent] = useState<string>(review.content || '')
  const [visitDate, setVisitDate] = useState<string>('')
  const [existingMedia, setExistingMedia] = useState<string[]>([
    ...(review.images || []),
    ...(review.videos || [])
  ])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setRating(review.rating || 5)
      setContent(review.content || '')
      setExistingMedia([...(review.images || []), ...(review.videos || [])])
      setPhotoFiles([])
      setPhotoPreviews([])
      setVideoFiles([])
      setVideoPreviews([])
      setError('')
    }
  }, [isOpen, review])

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
      videoPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviews, videoPreviews])

  if (!isOpen) return null

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (existingMedia.length + photoFiles.length + files.length > 10) {
      setError('Bạn chỉ có thể lưu tối đa 10 hình ảnh cho mỗi đánh giá.')
      return
    }

    for (const f of files) {
      if (f.size > MAX_PHOTO_SIZE) {
        setError(`Ảnh "${f.name}" vượt quá dung lượng tối đa 2MB.`)
        return
      }
      if (!ALLOWED_PHOTO_EXTS.includes(f.type) && !/\.(jpg|jpeg|png|webp)$/i.test(f.name)) {
        setError(`Ảnh "${f.name}" không đúng định dạng (.jpg, .jpeg, .png, .webp).`)
        return
      }
    }

    setError('')
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (videoFiles.length + files.length > 2) {
      setError('Bạn chỉ có thể tải lên tối đa 2 video cho mỗi đánh giá.')
      return
    }

    for (const f of files) {
      if (f.size > MAX_VIDEO_SIZE) {
        setError(`Video "${f.name}" vượt quá dung lượng tối đa 30MB.`)
        return
      }
      if (!ALLOWED_VIDEO_EXTS.includes(f.type) && !/\.(mp4|mov|webm)$/i.test(f.name)) {
        setError(`Video "${f.name}" không đúng định dạng (.mp4, .mov, .webm).`)
        return
      }
    }

    setError('')
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setVideoFiles((prev) => [...prev, ...files])
    setVideoPreviews((prev) => [...prev, ...newPreviews])
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const removeExistingMedia = (urlToRemove: string) => {
    setExistingMedia((prev) => prev.filter((url) => url !== urlToRemove))
  }

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx])
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeVideo = (idx: number) => {
    URL.revokeObjectURL(videoPreviews[idx])
    setVideoFiles((prev) => prev.filter((_, i) => i !== idx))
    setVideoPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung đánh giá của bạn.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await onUpdateReview({
        reviewId: review.id,
        rating,
        content: content.trim(),
        visitDate: visitDate || undefined,
        existingMediaUrls: existingMedia,
        photos: photoFiles,
        videos: videoFiles
      })

      if (res.success) {
        onClose()
      } else {
        setError(res.message || 'Không thể cập nhật đánh giá lúc này.')
      }
    } catch {
      setError('Đã xảy ra lỗi khi cập nhật đánh giá.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return 'Tuyệt vời'
      case 4:
        return 'Rất tốt'
      case 3:
        return 'Hài lòng'
      case 2:
        return 'Trung bình'
      case 1:
        return 'Không tốt'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
          <h3 className="text-base font-bold text-slate-900">Chỉnh sửa đánh giá của bạn</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Mức độ hài lòng <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((s) => {
                const activeVal = hoverRating || rating
                return (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= activeVal ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  </button>
                )
              })}
              <span className="text-xs font-bold text-slate-800 ml-2">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Thời gian ghé thăm
            </label>
            <div className="relative">
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nội dung chia sẻ cảm nhận <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{content.length}/2000 ký tự</span>
            </div>
            <textarea
              rows={4}
              required
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ chi tiết trải nghiệm thực tế của bạn..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50/50 leading-relaxed"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hình ảnh & Video đính kèm
            </label>

            {existingMedia.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Hình ảnh/video hiện tại:</span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {existingMedia.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(url)}
                        className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoSelect}
                multiple
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={existingMedia.length + photoFiles.length >= 10}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Thêm ảnh ({existingMedia.length + photoFiles.length}/10)</span>
              </button>

              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoSelect}
                multiple
                accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={videoFiles.length >= 2}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Video className="w-4 h-4 text-sky-600" />
                <span>Thêm video ({videoFiles.length}/2)</span>
              </button>
            </div>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={preview} alt={`New Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {videoPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {videoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                    <video src={preview} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
