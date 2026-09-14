import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Edit3,
  X,
  Upload,
  Trash2,
  Loader2,
  User,
  FileText
} from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface ProfileHeroProps {
  onToast: (msg: string) => void
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({ onToast }) => {
  const { user, profile, updateProfile } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [editFullName, setEditFullName] = useState(user?.fullName || profile?.fullName || '')
  const [editBio, setEditBio] = useState(user?.bio || profile?.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user || profile) {
      setEditFullName(user?.fullName || profile?.fullName || '')
      setEditBio(user?.bio || profile?.bio || '')
    }
  }, [user, profile])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [avatarPreview, coverPreview])

  const handleToggleEdit = () => {
    if (!isEditing) {
      setEditFullName(user?.fullName || profile?.fullName || '')
      setEditBio(user?.bio || profile?.bio || '')
      setAvatarFile(null)
      setCoverFile(null)
      setAvatarPreview(null)
      setCoverPreview(null)
      setError('')
    }
    setIsEditing((prev) => !prev)
  }

  const handleCancelEdit = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setAvatarFile(null)
    setCoverFile(null)
    setAvatarPreview(null)
    setCoverPreview(null)
    setError('')
    setIsEditing(false)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError('Kích thước ảnh đại diện không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setError('Ảnh đại diện phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setError('')
    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError('Kích thước ảnh bìa không được vượt quá 5MB.')
      return
    }

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setError('Ảnh bìa phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).')
      return
    }

    setError('')
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!editFullName.trim() || editFullName.trim().length < 2) {
      setError('Họ và tên phải từ 2 đến 50 ký tự.')
      return
    }

    if (editFullName.trim().length > 50) {
      setError('Họ và tên không được vượt quá 50 ký tự.')
      return
    }

    if (editBio && editBio.trim().length > 500) {
      setError('Tiểu sử không được vượt quá 500 ký tự.')
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        fullName: editFullName.trim(),
        bio: editBio.trim() || null,
        avatarFile,
        coverFile
      })
      onToast('Đã cập nhật thông tin trang cá nhân thành công!')
      handleCancelEdit()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể cập nhật hồ sơ. Vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fullName = user?.fullName || profile?.fullName || 'Người dùng LangThang'
  const bio = user?.bio || profile?.bio || 'Chưa có tiểu sử giới thiệu bản thân.'
  const avatarUrl = user?.avatarUrl || profile?.avatarUrl
  const coverUrl = user?.coverUrl || profile?.coverUrl

  const activeAvatarSrc = avatarPreview || avatarUrl
  const activeCoverSrc = coverPreview || coverUrl

  return (
    <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs">
      <div className="h-64 sm:h-80 lg:h-96 w-full relative bg-slate-900 transition-all duration-300">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      <div className="px-6 sm:px-8 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="-mt-16 sm:-mt-22 w-32 sm:w-40 h-32 sm:h-40 rounded-full overflow-hidden border-4 border-white bg-slate-200 shrink-0 ring-2 ring-emerald-500/20 shadow-md flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-700 text-white flex items-center justify-center text-3xl font-extrabold">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2 sm:pt-4 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                  {fullName}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
                {bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-end w-full sm:w-auto sm:pb-1 pt-2">
            <button
              type="button"
              onClick={handleToggleEdit}
              className={`flex-1 sm:flex-initial px-4 py-2.5 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active-press cursor-pointer border shadow-2xs ${
                isEditing
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Đóng chỉnh sửa</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa trang cá nhân</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="border-t border-slate-200/90 bg-slate-50/80 p-6 sm:p-8 animate-in slide-in-from-top-3 duration-200">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Họ và tên của tôi <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={50}
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        placeholder="Nhập họ và tên của bạn"
                        className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden shadow-2xs"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Ảnh đại diện (Hình tròn)
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-emerald-50 shrink-0 flex items-center justify-center shadow-xs">
                        {activeAvatarSrc ? (
                          <img
                            src={activeAvatarSrc}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-black text-emerald-800">
                            {(editFullName || 'U').charAt(0).toUpperCase()}
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
                          className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{avatarFile ? 'Chọn ảnh khác' : 'Tải ảnh đại diện'}</span>
                        </button>
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={clearAvatarFile}
                            className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa ảnh chọn</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Ảnh bìa trang cá nhân
                      </span>
                      {coverFile && (
                        <button
                          type="button"
                          onClick={clearCoverFile}
                          className="px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hủy ảnh</span>
                        </button>
                      )}
                    </div>

                    <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative flex items-center justify-center shadow-xs">
                      {activeCoverSrc ? (
                        <img
                          src={activeCoverSrc}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 flex items-center justify-center text-xs text-white/70">
                          Ảnh bìa mặc định
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
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
                      className="w-full py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{coverFile ? 'Đổi ảnh bìa khác' : 'Tải ảnh bìa mới'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tiểu sử giới thiệu bản thân (Bio)
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Viết đôi dòng giới thiệu về bản thân và niềm đam mê du lịch..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden resize-none leading-relaxed shadow-2xs"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <span className="text-[11px] text-slate-400 text-right block mt-1">
                  {editBio.length}/500 ký tự
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileHero
