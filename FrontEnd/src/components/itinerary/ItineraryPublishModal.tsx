import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Send,
  Lock,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import type { PublishTripRequestDto } from '@/types/models/trip.model'
import type { DetailedItineraryItem } from '@/types/models/itinerary.model'

interface ItineraryPublishModalProps {
  isOpen: boolean
  trip?: DetailedItineraryItem | null
  tripId?: number | string
  initialTitle?: string
  initialDescription?: string
  initialCoverImage?: string
  onClose: () => void
  onPublish: (data: PublishTripRequestDto) => Promise<boolean | void> | void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const ItineraryPublishModal: React.FC<ItineraryPublishModalProps> = ({
  isOpen,
  trip,
  initialTitle = '',
  initialDescription = '',
  initialCoverImage = '',
  onClose,
  onPublish
}) => {
  const [title, setTitle] = useState(initialTitle || trip?.title || '')
  const [description, setDescription] = useState(initialDescription || trip?.description || '')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>(initialCoverImage || trip?.coverImg || '')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || trip?.title || '')
      setDescription(initialDescription || trip?.description || '')
      setCoverImageFile(null)
      setCoverImagePreview(initialCoverImage || trip?.coverImg || '')
      setSelectedFileName('')
      setErrorMessage('')
      setIsSubmitting(false)
    }
  }, [isOpen, trip, initialTitle, initialDescription, initialCoverImage])

  useEffect(() => {
    return () => {
      if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverImagePreview)
      }
    }
  }, [coverImagePreview])

  if (!isOpen) return null

  const trimmedDesc = description.trim()
  const isDescValid = trimmedDesc.length >= 10 && trimmedDesc.length <= 2000

  const handleProcessFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Kích thước ảnh bìa không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type) && !file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setErrorMessage('')
    setCoverImageFile(file)
    setSelectedFileName(file.name)

    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverImagePreview)
    }
    const objectUrl = URL.createObjectURL(file)
    setCoverImagePreview(objectUrl)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleProcessFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleProcessFile(file)
    }
  }

  const handleClearCoverImage = () => {
    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverImagePreview)
    }
    setCoverImageFile(null)
    setCoverImagePreview('')
    setSelectedFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDescValid) {
      setErrorMessage('Mô tả chuyến đi là bắt buộc (tối thiểu 10 ký tự, tối đa 2000 ký tự).')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await onPublish({
        description: trimmedDesc,
        title: title.trim() || undefined,
        coverImageFile: coverImageFile || undefined
      })
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xuất bản chuyến đi.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
              <Send size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                Xuất bản chuyến đi công khai
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Chia sẻ lịch trình của bạn lên thư viện cộng đồng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3">
            <div className="p-1 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
              <Lock size={15} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-xs">Chế độ Chỉ xem sau khi xuất bản:</p>
              <p className="text-[11px] leading-relaxed text-amber-800/90 font-medium">
                Sau khi xuất bản, chuyến đi sẽ được chia sẻ công khai và <strong>khóa ở chế độ chỉ xem</strong>. Bạn (và các thành viên) sẽ không thể chỉnh sửa điểm dừng, ngày đi hoặc mời thêm thành viên nữa.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề chuyến đi
            </label>
            <input
              type="text"
              value={title}
              disabled={isSubmitting}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề chuyến đi..."
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Description Field (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <FileText size={13} className="text-emerald-700" />
                <span>Mô tả chuyến đi</span>
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-bold ${trimmedDesc.length < 10
                    ? 'text-amber-600'
                    : trimmedDesc.length > 2000
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
              >
                {trimmedDesc.length} / 2000 ký tự (tối thiểu 10)
              </span>
            </div>
            <textarea
              rows={4}
              value={description}
              disabled={isSubmitting}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chia sẻ tổng quan chuyến đi, trải nghiệm nổi bật, kinh nghiệm di chuyển, thời gian đẹp nhất trong năm..."
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-900 outline-none transition-all leading-relaxed"
            />
            {trimmedDesc.length > 0 && trimmedDesc.length < 10 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1">
                * Vui lòng nhập thêm ít nhất {10 - trimmedDesc.length} ký tự mô tả.
              </p>
            )}
          </div>

          {/* Cover Image Upload (From user's device) */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
              className="hidden"
            />

            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ImageIcon size={13} className="text-emerald-700" />
                <span>Ảnh bìa chuyến đi (Tùy chọn)</span>
              </label>
              <span className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)</span>
            </div>

            {coverImagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <div className="w-full h-40 bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={coverImagePreview}
                    alt="Ảnh bìa xem trước"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {selectedFileName || 'Ảnh bìa chuyến đi'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={12} className="text-emerald-700" />
                      <span>Đổi ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCoverImage}
                      disabled={isSubmitting}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30'
                  }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 shadow-xs border border-slate-200/80 flex items-center justify-center mb-2.5">
                  <Upload size={20} />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Nhấn để chọn ảnh từ máy tính hoặc kéo thả vào đây
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chọn bức ảnh đẹp nhất để thu hút người xem trong thư viện cộng đồng
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isDescValid}
              className={`px-5 py-2 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${isSubmitting || !isDescValid
                  ? 'bg-emerald-400 cursor-not-allowed opacity-70'
                  : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang xuất bản...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận xuất bản</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ItineraryPublishModal
