import React from 'react'

export type ProfileTabType =
  | 'favorites'
  | 'trips'
  | 'visitLogs'
  | 'friends'
  | 'reviews'
  | 'comments'
  | 'blogs'
  | 'proposals'

interface ProfileTabBarProps {
  activeTab: ProfileTabType
  onTabChange: (tab: ProfileTabType) => void
  counts?: Record<ProfileTabType, number>
}

interface TabDef {
  key: ProfileTabType
  label: string
}

const TABS: TabDef[] = [
  { key: 'favorites', label: 'Đã lưu' },
  { key: 'trips', label: 'Chuyến đi' },
  { key: 'visitLogs', label: 'Nhật ký' },
  { key: 'friends', label: 'Bạn bè' },
  { key: 'reviews', label: 'Đánh giá' },
  { key: 'comments', label: 'Bình luận' },
  { key: 'blogs', label: 'Bài viết' },
  { key: 'proposals', label: 'Đề xuất' }
]

export const ProfileTabBar: React.FC<ProfileTabBarProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 flex items-center overflow-x-auto no-scrollbar gap-1.5 shadow-2xs font-sans">
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key
        return (
          <button
            type="button"
            key={key}
            onClick={() => onTabChange(key)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 text-center ${
              isActive
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ProfileTabBar
