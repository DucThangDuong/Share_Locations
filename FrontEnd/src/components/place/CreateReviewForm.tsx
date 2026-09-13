import React, { useState, useRef, useEffect } from 'react'
import { Star, X, ImageIcon, Video, Trash2, Calendar, AlertCircle, Loader2, Send } from 'lucide-react'
import type { CreateReviewRequest, ReviewItemDto } from '@/types/models/place.model'

interface CreateReviewFormProps {
  placeId: number
  onClose: () => void
  onSubmitReview: (data: CreateReviewRequest) => Promise<{ success: boolean; data?: ReviewItemDto; message?: string }>
}

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const MAX_VIDEO_SIZE = 30 * 1024 * 1024
const ALLOWED_PHOTO_EXTS = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_EXTS = ['video/mp4', 'video/quicktime', 'video/webm']

export const CreateReviewForm: React.FC<CreateReviewFormProps> = ({
  placeId,
  onClose,
  onSubmitReview
}) => {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [content, setContent] = useState<string>('')
  const [visitDate, setVisitDate] = useState<string>('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
      videoPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviews, videoPreviews])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (photoFiles.length + files.length > 10) {
      setError('Bạn chỉ có thể tải lên tối đa 10 hình ảnh cho mỗi đánh giá.')
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

  const handleCancel = () => {
    photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    videoPreviews.forEach((url) => URL.revokeObjectURL(url))
    setRating(5)
    setHoverRating(0)
    setContent('')
    setVisitDate('')
    setPhotoFiles([])
    setPhotoPreviews([])
    setVideoFiles([])
    setVideoPreviews([])
    setError('')
    onClose()
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
      const res = await onSubmitReview({
        placeId,
        rating,
        content: content.trim(),
        visitDate: visitDate || undefined,
        photos: photoFiles,
        videos: videoFiles
      })

      if (res.success) {
        handleCancel()
      } else {
        setError(res.message || 'Không thể gửi đánh giá lúc này.')
      }
    } catch {
      setError('Đã xảy ra lỗi khi gửi đánh giá.')
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
    <div className="bg-slate-50/90 rounded-2xl border border-emerald-200/80 p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Viết đánh giá trải nghiệm của bạn</span>
        </h3>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Hủy biểu mẫu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Mức độ hài lòng <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5 py-1">
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
                      className={`w-6 h-6 ${
                        s <= activeVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                )
              })}
              <span className="text-xs font-bold text-slate-800 ml-1.5">
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
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
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
            placeholder="Chia sẻ chi tiết trải nghiệm thực tế của bạn (không gian, dịch vụ, giá vé, lời khuyên cho người đến sau)..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white leading-relaxed"
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-emerald-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hình ảnh & Video đính kèm
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
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
              disabled={photoFiles.length >= 10}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thêm ảnh ({photoFiles.length}/10)</span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Video className="w-3.5 h-3.5 text-sky-600" />
              <span>Thêm video ({videoFiles.length}/2)</span>
            </button>
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
              {photoPreviews.map((preview, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
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
            <div className="grid grid-cols-2 gap-3 pt-1">
              {videoPreviews.map((preview, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                  <video
                    src={preview}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 text-[10px] text-white rounded-md">
                    Video {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-emerald-100">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đăng tải...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Đăng đánh giá</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
