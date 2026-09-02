import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal'
import {
  Mail,
  Phone,
  Shield,
  Award,
  Edit3,
  Key,
  BookOpen,
  Compass,
  Bookmark,
  PlusCircle,
  CheckCircle2,
  FileText,
  Inbox,
  Sparkles,
  UserCheck
} from 'lucide-react'

type TabType = 'posts' | 'itineraries' | 'saved' | 'suggested'

export const ProfilePage: React.FC = () => {
  const { profile, user, updateProfile, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('posts')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const currentProfile = {
    fullName: user?.fullName || profile?.fullName || 'Người dùng LangThang',
    email: user?.email || profile?.email || '',
    phone: user?.phone || profile?.phone || '',
    bio: user?.bio || profile?.bio || 'Chưa có tiểu sử giới thiệu bản thân.',
    avatarUrl: user?.avatarUrl || profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    coverUrl: user?.coverUrl || profile?.coverUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
    rankLevel: user?.rankLevel || profile?.rankLevel || 'Tân binh',
    reputationScore: user?.reputationScore ?? profile?.reputationScore ?? 0,
    role: user?.role || 'User'
  }

  const formattedPhone = currentProfile.phone
    ? (currentProfile.phone.length > 6
      ? `${currentProfile.phone.slice(0, 4)} *** ${currentProfile.phone.slice(-3)}`
      : currentProfile.phone)
    : 'Chưa cập nhật'

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-dark text-white text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80">
          <div className="h-48 sm:h-64 lg:h-72 w-full relative bg-slate-200">
            <img
              src={currentProfile.coverUrl}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
          </div>

          <div className="px-6 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="-mt-14 sm:-mt-20 w-28 sm:w-36 h-28 sm:h-36 rounded-3xl overflow-hidden border-4 border-white bg-slate-200 shrink-0 ring-1 ring-slate-200/50">
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentProfile.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
                    }}
                  />
                </div>

                <div className="space-y-1.5 pt-2 sm:pt-4 sm:pb-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                      {currentProfile.fullName}
                    </h1>
                    <span className="bg-emerald-100/90 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" /> {currentProfile.rankLevel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
                    {currentProfile.bio || "Người dùng chưa thêm mô tả bản thân"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-end w-full sm:w-auto sm:pb-1 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active-press cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa hồ sơ</span>
                </button>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-primary-container hover:bg-primary-hover text-white font-semibold text-xs rounded-xl active-press transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Thông tin cá nhân</span>
              </h2>

              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Email</div>
                    <span className="font-medium text-slate-800 truncate">{currentProfile.email || 'Chưa cập nhật'}</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Số điện thoại</div>
                    <span className="font-medium text-slate-800">{formattedPhone}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary-container" />
                <span>Điểm cống hiến</span>
              </h2>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
                    {currentProfile.reputationScore}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Điểm uy tín tích lũy</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                Điểm cống hiến được tích lũy thông qua việc đóng góp địa điểm, viết review chất lượng và chia sẻ lịch trình hữu ích.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-2 border border-slate-200/80 flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-primary-container text-white'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bài viết (0)</span>
              </button>

              <button
                onClick={() => setActiveTab('itineraries')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'itineraries'
                    ? 'bg-primary-container text-white'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Lịch trình (0)</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-primary-container text-white'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Đã lưu (0)</span>
              </button>

              <button
                onClick={() => setActiveTab('suggested')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'suggested'
                    ? 'bg-primary-container text-white'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Đề xuất (0)</span>
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'posts' && (
                <div className="bg-white rounded-3xl p-14 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Chưa có bài viết nào
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm font-normal">
                    Bạn chưa đăng bài viết chia sẻ kinh nghiệm du lịch nào. Hãy viết bài đầu tiên để chia sẻ với cộng đồng LangThang!
                  </p>
                </div>
              )}

              {activeTab === 'itineraries' && (
                <div className="bg-white rounded-3xl p-14 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Chưa có lịch trình nào
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm font-normal">
                    Bạn chưa lên lịch trình khám phá nào. Hãy tạo kế hoạch cho chuyến đi tiếp theo của bạn!
                  </p>
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="bg-white rounded-3xl p-14 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Chưa lưu địa điểm nào
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm font-normal">
                    Danh sách các địa điểm yêu thích của bạn đang trống. Hãy dạo quanh trang chủ để lưu lại các địa điểm hấp dẫn!
                  </p>
                </div>
              )}

              {activeTab === 'suggested' && (
                <div className="bg-white rounded-3xl p-14 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Chưa có đề xuất địa điểm nào
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm font-normal">
                    Bạn chưa gửi đề xuất địa điểm mới nào cho hệ thống. Đóng góp địa điểm để tích lũy điểm cống hiến nhé!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={currentProfile}
        onSave={async (updated) => {
          await updateProfile(updated)
          showToast('Đã lưu thay đổi hồ sơ thành công.')
        }}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  )
}
