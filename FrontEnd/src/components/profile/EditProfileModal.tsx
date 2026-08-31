import React, { useState, useEffect } from 'react'
import type { UserProfileData } from '@/types/auth'
import { X } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfileData
  onSave: (updated: Partial<UserProfileData>) => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [fullName, setFullName] = useState(profile.fullName)
  const [bio, setBio] = useState(profile.bio)
  const [job, setJob] = useState(profile.job)
  const [address, setAddress] = useState(profile.address)
  const [phone, setPhone] = useState(profile.phone)
  const [email, setEmail] = useState(profile.email)

  useEffect(() => {
    if (isOpen) {
      setFullName(profile.fullName)
      setBio(profile.bio)
      setJob(profile.job)
      setAddress(profile.address)
      setPhone(profile.phone)
      setEmail(profile.email)
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      fullName,
      bio,
      job,
      address,
      phone,
      email
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-surface-variant overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant">
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Chỉnh sửa trang cá nhân
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thông tin cơ bản
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiểu sử
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nghề nghiệp
                  </label>
                  <input
                    type="text"
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nơi sống
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-surface-variant">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thông tin liên hệ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-surface-variant rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>
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
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
