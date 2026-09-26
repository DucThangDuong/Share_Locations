import React from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  UserPlus,
  UserCheck,
  Clock,
  Pencil
} from 'lucide-react'
import type { PublicUserProfileDto } from '@/types/models/userProfile.model'

export type ProfileTabType = 'activity' | 'reviews' | 'trips' | 'visit_logs' | 'blogs' | 'proposals'

interface UserProfileHeaderProps {
  profile: PublicUserProfileDto
  activeTab: ProfileTabType
  onTabChange: (tab: ProfileTabType) => void
  isCurrentUser: boolean
  onSendMessage: () => void
  onAddFriend: () => void
  onUnfriend: () => void
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  activeTab,
  onTabChange,
  isCurrentUser,
  onSendMessage,
  onAddFriend,
  onUnfriend,
}) => {

  const avatar =
    profile.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'
  const coverImage =
    profile.coverUrl ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=400&fit=crop'


  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Cover Banner (Constrained to main width with rounded corners) */}
        <div className="relative h-44 sm:h-56 md:h-64 lg:h-72 w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 shadow-xs">
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        </div>

        {/* Profile Header Main Box */}
        <div className="relative pb-5 pt-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            {/* Left: Avatar (with -mt) + Names (in normal flow on white background) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar floating half on cover, half on white */}
              <div className="relative -mt-16 sm:-mt-20 shrink-0 group z-10">
                <div className="relative w-28 h-28 sm:w-34 sm:h-34 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 ring-2 ring-slate-200/90 shrink-0">
                  <img
                    src={avatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 pt-1 sm:pt-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{profile.fullName}</span>
                    {isCurrentUser && (
                      <Link
                        to="/settings"
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin cá nhân"
                      >
                        <Pencil size={18} />
                      </Link>
                    )}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-1 sm:pt-2">
              {!isCurrentUser && (
                <>
                  <button
                    type="button"
                    onClick={onSendMessage}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    Nhắn tin
                  </button>

                  {profile.friendStatus === 'accepted' ? (
                    <button
                      type="button"
                      onClick={onUnfriend}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-sm font-semibold border border-slate-200 transition-all cursor-pointer"
                      title="Hủy kết bạn"
                    >
                      <UserCheck size={16} className="text-emerald-600" />
                      Bạn bè
                    </button>
                  ) : profile.friendStatus === 'pending_sent' ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium border border-slate-200 cursor-default"
                    >
                      <Clock size={16} />
                      Đã gửi lời mời
                    </button>
                  ) : profile.friendStatus === 'pending_received' ? (
                    <button
                      type="button"
                      onClick={onAddFriend}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                    >
                      <UserCheck size={16} />
                      Chấp nhận kết bạn
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onAddFriend}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                    >
                      <UserPlus size={16} className="text-emerald-600" />
                      Kết bạn
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Tripadvisor style with green indicator) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-1">
          <button
            type="button"
            onClick={() => onTabChange('reviews')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            Đánh giá
          </button>

          <button
            type="button"
            onClick={() => onTabChange('activity')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === 'activity'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            Dòng hoạt động
          </button>

          <button
            type="button"
            onClick={() => onTabChange('trips')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === 'trips'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            Chuyến đi
          </button>

          <button
            type="button"
            onClick={() => onTabChange('visit_logs')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === 'visit_logs'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            Nhật ký điểm đến
          </button>

          <button
            type="button"
            onClick={() => onTabChange('blogs')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === 'blogs'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            Bài viết
          </button>

          <button
            type="button"
            onClick={() => onTabChange('proposals')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === 'proposals'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            Địa điểm đề xuất
          </button>
        </div>
      </div>
    </div>
  )
}
