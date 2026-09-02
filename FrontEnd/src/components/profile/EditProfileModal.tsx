import React, { useState, useEffect, useRef } from 'react'
import type { UpdateProfileRequest, UserProfileData } from '@/types/auth'
import { X, Loader2, User, Phone, FileText, Upload, Trash2 } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfileData
  onSave: (payload: UpdateProfileRequest) => Promise<void>
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFullName(profile.fullName || '')
      setBio(profile.bio || '')
      setPhone(profile.phone || '')
      setAvatarFile(null)
      setCoverFile(null)
      setAvatarPreview(null)
      setCoverPreview(null)
      setErrorMessage('')
    }
  }, [isOpen, profile])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [avatarPreview, coverPreview])

  if (!isOpen) return null

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Kích thước ảnh đại diện không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setErrorMessage('Ảnh đại diện phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setErrorMessage('')
    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Kích thước ảnh bìa không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setErrorMessage('Ảnh bìa phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setErrorMessage('')
    setCoverFile(file)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(URL.createObjectURL(file))
  }

  const clearAvatarFile = () => {
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const clearCoverFile = () => {
    setCoverFile(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Họ và tên phải từ 2 đến 50 ký tự.')
      return
    }

    if (fullName.trim().length > 50) {
      setErrorMessage('Họ và tên không được vượt quá 50 ký tự.')
      return
    }

    if (phone && phone.trim().length > 20) {
      setErrorMessage('Số điện thoại không được vượt quá 20 ký tự.')
      return
    }

    if (bio && bio.trim().length > 500) {
      setErrorMessage('Tiểu sử không được vượt quá 500 ký tự.')
      return
    }

    setLoading(true)
    try {
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatarFile: avatarFile,
        coverFile: coverFile
      })
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại thông tin.')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentAvatar = avatarPreview || profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
  const currentCover = coverPreview || profile.coverUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
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
                    maxLength={50}
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
                    maxLength={20}
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
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Viết đôi dòng giới thiệu bản thân và đam mê du lịch..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-hidden transition-all resize-none"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hình ảnh hồ sơ (Tải lên từ thiết bị)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ảnh đại diện (Avatar - Tối đa 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={currentAvatar}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{avatarFile ? 'Chọn ảnh khác' : 'Tải ảnh đại diện'}</span>
                    </button>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={clearAvatarFile}
                        className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ảnh bìa (Cover Banner - Tối đa 5MB)
                </label>
                <div className="space-y-2">
                  <div className="w-full h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                    <img
                      src={currentCover}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop'
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{coverFile ? 'Chọn ảnh khác' : 'Tải ảnh bìa mới'}</span>
                    </button>
                    {coverFile && (
                      <button
                        type="button"
                        onClick={clearCoverFile}
                        className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    )}
                  </div>
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-primary-container hover:bg-primary-hover disabled:opacity-70 rounded-xl active-press transition-all cursor-pointer flex items-center gap-2"
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
