import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  User,
  Mail,
  Phone,
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  Loader2
} from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const ProfileSettingsTab: React.FC = () => {
  const { profile, user, updateProfile } = useAuth()

  const [fullName, setFullName] = useState(profile?.fullName || user?.fullName || '')
  const [bio, setBio] = useState(profile?.bio || user?.bio || '')
  const [phone, setPhone] = useState(profile?.phone || user?.phone || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.fullName || user?.fullName || '')
      setBio(profile?.bio || user?.bio || '')
      setPhone(profile?.phone || user?.phone || '')
    }
  }, [profile, user])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [avatarPreview, coverPreview])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setProfileError('Kích thước ảnh đại diện không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setProfileError('Ảnh đại diện phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setProfileError('')
    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setProfileError('Kích thước ảnh bìa không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setProfileError('Ảnh bìa phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setProfileError('')
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError('Họ và tên phải từ 2 đến 50 ký tự.')
      return
    }

    if (fullName.trim().length > 50) {
      setProfileError('Họ và tên không được vượt quá 50 ký tự.')
      return
    }

    if (phone && phone.trim().length > 20) {
      setProfileError('Số điện thoại không được vượt quá 20 ký tự.')
      return
    }

    if (bio && bio.trim().length > 500) {
      setProfileError('Tiểu sử không được vượt quá 500 ký tự.')
      return
    }

    setProfileLoading(true)
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatarFile: avatarFile,
        coverFile: coverFile
      })
      setProfileSuccess('Đã lưu thay đổi thông tin cá nhân thành công.')
      setAvatarFile(null)
      setCoverFile(null)
      setTimeout(() => {
        setProfileSuccess('')
      }, 4000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileError(err.message)
      } else {
        setProfileError('Không thể cập nhật hồ sơ. Vui lòng thử lại.')
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const currentAvatar = avatarPreview || profile?.avatarUrl || user?.avatarUrl || null
  const currentCover = coverPreview || profile?.coverUrl || user?.coverUrl || null
  const currentEmail = profile?.email || user?.email || ''

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      {profileError && (
        <div className="p-3.5 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
          {profileError}
        </div>
      )}

      {profileSuccess && (
        <div className="p-3.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
          Hình ảnh đại diện & Ảnh bìa
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-semibold text-slate-800 block">Ảnh đại diện (Hình tròn)</span>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-emerald-50 shrink-0 flex items-center justify-center shadow-xs">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-emerald-800">
                    {(fullName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{avatarFile ? 'Đổi ảnh khác' : 'Tải ảnh đại diện'}</span>
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={clearAvatarFile}
                    className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa ảnh đã chọn</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-semibold text-slate-800 block">Ảnh bìa hồ sơ</span>
            <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 relative flex items-center justify-center">
              {currentCover ? (
                <img
                  src={currentCover}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 flex items-center justify-center text-[11px] text-white/70">
                  Ảnh bìa mặc định
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverChange}
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>{coverFile ? 'Đổi ảnh bìa' : 'Tải ảnh bìa mới'}</span>
              </button>
              {coverFile && (
                <button
                  type="button"
                  onClick={clearCoverFile}
                  className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hủy</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={50}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email tài khoản
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={currentEmail}
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Số điện thoại
          </label>
          <div className="relative">
            <input
              type="tel"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại liên hệ"
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Tiểu sử (Bio)
          </label>
          <div className="relative">
            <textarea
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Giới thiệu đôi nét về bản thân và đam mê du lịch..."
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden resize-none leading-relaxed"
            />
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <span className="text-[11px] text-slate-400 text-right block mt-1">
            {bio.length}/500 ký tự
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
        <button
          type="submit"
          disabled={profileLoading}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          {profileLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Lưu thay đổi thông tin</span>
        </button>
      </div>
    </form>
  )
}

export default ProfileSettingsTab
