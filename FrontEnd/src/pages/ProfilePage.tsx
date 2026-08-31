import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal'
import { 
  USER_SAVED_PLACES, 
  USER_SUGGESTED_PLACES, 
  BLOG_ITEMS, 
  ITINERARY_ITEMS 
} from '@/services/travelDataService'
import { 
  MapPin, 
  Briefcase, 
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
  CheckCircle2
} from 'lucide-react'

type TabType = 'posts' | 'itineraries' | 'saved' | 'suggested'

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('posts')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const currentProfile = profile || {
    fullName: 'Nguyễn Minh Anh',
    email: 'anh.nguyen@gmail.com',
    phone: '0912345678',
    bio: 'Đam mê du lịch tự túc, khám phá ẩm thực đường phố và lưu giữ những hành trình thật đẹp.',
    job: 'Travel Blogger & Nhiếp ảnh',
    address: 'Hà Nội, Việt Nam',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    coverUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop',
    rankLevel: 'Khám phá gia',
    reputationScore: 420
  }

  const formattedPhone = currentProfile.phone?.length > 6
    ? `${currentProfile.phone.slice(0, 4)} *** ${currentProfile.phone.slice(-3)}`
    : currentProfile.phone || 'Chưa cập nhật'

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <div className="relative rounded-3xl overflow-hidden shadow-sm bg-white border border-surface-variant">
          <div className="h-48 sm:h-64 w-full relative">
            <img
              src={currentProfile.coverUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop'}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex items-end gap-4">
              <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-200 shrink-0">
                <img
                  src={currentProfile.avatarUrl}
                  alt={currentProfile.fullName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mb-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                    {currentProfile.fullName}
                  </h1>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {currentProfile.rankLevel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl line-clamp-2 font-light">
                  {currentProfile.bio}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa hồ sơ</span>
              </button>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-primary-container hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-surface-variant shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-surface-variant pb-3">
                Thông tin cá nhân
              </h2>

              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{currentProfile.job || 'Chưa cập nhật'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{currentProfile.address || 'Chưa cập nhật'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">{currentProfile.email || 'Chưa cập nhật'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{formattedPhone}</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-surface-variant shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-surface-variant pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary-container" /> Điểm cống hiến
              </h2>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-amber-600">
                    {currentProfile.reputationScore}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Điểm uy tín tích lũy</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  ★
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-2 border border-surface-variant shadow-xs flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bài viết (3)</span>
              </button>

              <button
                onClick={() => setActiveTab('itineraries')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'itineraries'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Lịch trình (2)</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Đã lưu (2)</span>
              </button>

              <button
                onClick={() => setActiveTab('suggested')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'suggested'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Đề xuất (1)</span>
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {BLOG_ITEMS.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-3xl p-5 border border-surface-variant shadow-xs flex flex-col sm:flex-row gap-5 hover-lift transition-all group"
                    >
                      <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-secondary-container uppercase tracking-wider">
                            {post.category} • {post.publishedAt}
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-container transition-colors leading-snug">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 font-light">
                            {post.summary}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-400">{post.readTime}</span>
                          <button className="text-primary-container font-semibold hover:text-secondary-container transition-colors cursor-pointer">
                            Đọc bài viết →
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'itineraries' && (
                <div className="space-y-4">
                  {ITINERARY_ITEMS.slice(0, 2).map((itinerary) => (
                    <article
                      key={itinerary.id}
                      className="bg-white rounded-3xl p-5 border border-surface-variant shadow-xs flex flex-col sm:flex-row gap-5 hover-lift transition-all group"
                    >
                      <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={itinerary.imageUrl}
                          alt={itinerary.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-primary-container uppercase tracking-wider">
                            {itinerary.duration} • {itinerary.placesCount} điểm dừng
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-container transition-colors leading-snug">
                            {itinerary.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 font-light">
                            {itinerary.description}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-400">{itinerary.updatedAt}</span>
                          <button className="text-primary-container font-semibold hover:text-secondary-container transition-colors cursor-pointer">
                            Xem lịch trình →
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="space-y-4">
                  {USER_SAVED_PLACES.map((item) => (
                    <article
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-surface-variant shadow-xs flex flex-col sm:flex-row gap-5 hover-lift transition-all group"
                    >
                      <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {item.savedAt}
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-container transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-light">
                            <MapPin className="w-3.5 h-3.5 text-secondary-container" /> {item.location}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center justify-end text-xs">
                          <button className="text-primary-container font-semibold hover:text-secondary-container transition-colors cursor-pointer">
                            Xem địa điểm →
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'suggested' && (
                <div className="space-y-4">
                  {USER_SUGGESTED_PLACES.map((item) => (
                    <article
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-surface-variant shadow-xs flex flex-col sm:flex-row gap-5 hover-lift transition-all group"
                    >
                      <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                            {item.suggestedBy}
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-container transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-light">
                            <MapPin className="w-3.5 h-3.5 text-secondary-container" /> {item.location}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center justify-end text-xs">
                          <button className="text-primary-container font-semibold hover:text-secondary-container transition-colors cursor-pointer">
                            Xem đề xuất →
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
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
        onSave={(updated) => {
          updateProfile(updated)
          showToast('Đã lưu thay đổi hồ sơ.')
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
