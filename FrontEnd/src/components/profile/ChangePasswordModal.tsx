import React, { useState } from 'react'
import { X, Lock } from 'lucide-react'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới chưa khớp.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onSuccess('Đã cập nhật mật khẩu thành công.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-surface-variant overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant">
          <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-secondary-container" /> Đổi mật khẩu
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Để bảo vệ tài khoản, hãy dùng ít nhất 6 ký tự kết hợp chữ và số.
            </p>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-surface-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-container hover:bg-primary-hover rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
