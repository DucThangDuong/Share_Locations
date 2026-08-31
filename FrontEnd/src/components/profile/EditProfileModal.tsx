import React, { useState, useEffect } from 'react'
import type { UpdateProfileRequest, UserProfileData } from '@/types/auth'
import { X, Loader2, User, Phone, FileText, Image } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfileData
  onSave: (payload: UpdateProfileRequest) => Promise<void>
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '')
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl || '')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFullName(profile.fullName || '')
      setBio(profile.bio || '')
      setPhone(profile.phone || '')
      setAvatarUrl(profile.avatarUrl || '')
      setCoverUrl(profile.coverUrl || '')
      setErrorMessage('')
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Họ và tên phải từ 2 ký tự trở lên.')
      return
    }

    setLoading(true)
    try {
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        coverUrl: coverUrl.trim() || null
      })
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Không thể cập nhật hồ sơ. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">
              Chỉnh sửa thông tin cá nhân
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-2xl leading-relaxed">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thông tin cơ bản
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ"
                    className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiểu sử (Bio)
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Viết đôi dòng giới thiệu bản thân và đam mê du lịch..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all resize-none"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hình ảnh hồ sơ
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Ảnh đại diện (Avatar)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                  <Image className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Ảnh bìa (Cover Banner)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all"
                  />
                  <Image className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-primary-container hover:bg-primary-hover disabled:opacity-70 rounded-xl shadow-xs active-press transition-all cursor-pointer flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
