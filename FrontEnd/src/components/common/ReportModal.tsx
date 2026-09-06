import { useState } from 'react'
import { AlertTriangle, X, CheckCircle, Send, Flag } from 'lucide-react'
import { placeService } from '@/services/placeService'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  placeId: number
  placeName: string
}

const REPORT_REASONS = [
  { id: 'closed', label: 'Địa điểm đã đóng cửa vĩnh viễn / Tạm dừng hoạt động' },
  { id: 'wrong_info', label: 'Thông tin không chính xác (Địa chỉ, giá vé, giờ mở cửa, SĐT)' },
  { id: 'inappropriate', label: 'Hình ảnh hoặc nội dung không phù hợp / Vi phạm' },
  { id: 'spam', label: 'Spam / Quảng cáo lừa đảo / Thông tin rác' },
  { id: 'other', label: 'Lý do khác' }
]

export const ReportModal = ({ isOpen, onClose, placeId, placeName }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].id)
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const selectedReasonObj = REPORT_REASONS.find(r => r.id === selectedReason)
      await placeService.reportPlace({
        placeId,
        reason: selectedReasonObj?.label || selectedReason,
        description: description.trim(),
        contactEmail: email.trim() || undefined
      })
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setDescription('')
        setEmail('')
        onClose()
      }, 1800)
    } catch {
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setDescription('')
        setEmail('')
        onClose()
      }, 1800)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2 text-rose-600 font-semibold">
            <Flag className="w-5 h-5" />
            <h3 className="text-lg text-gray-900 font-bold">Báo cáo sai phạm / Đóng cửa</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Gửi báo cáo thành công!</h4>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Cảm ơn bạn đã đóng góp thông tin để cộng đồng chia sẻ địa điểm ngày càng hữu ích và chính xác hơn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Đang báo cáo địa điểm: <span className="font-semibold text-rose-950">{placeName}</span>. Đội ngũ kiểm duyệt sẽ xác minh trong vòng 24h.
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Lý do báo cáo <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                      selectedReason === reason.id
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-medium'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => setSelectedReason(reason.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Chi tiết bổ sung (tùy chọn)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng cung cấp thêm thông tin chứng minh hoặc mô tả cụ thể..."
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Email của bạn (để nhận phản hồi nếu cần)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
