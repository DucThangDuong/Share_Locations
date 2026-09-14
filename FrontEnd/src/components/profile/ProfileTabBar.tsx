import React from 'react'
import {
  Bookmark,
  Compass,
  Star,
  MessageSquare,
  BookOpen,
  PlusCircle
} from 'lucide-react'

export type ProfileTabType = 'favorites' | 'visitLogs' | 'reviews' | 'comments' | 'blogs' | 'proposals'

interface ProfileTabBarProps {
  activeTab: ProfileTabType
  onTabChange: (tab: ProfileTabType) => void
  counts: Record<ProfileTabType, number>
}

interface TabDef {
  key: ProfileTabType
  label: string
  icon: React.ElementType
}

const TABS: TabDef[] = [
  { key: 'favorites', label: 'Đã lưu', icon: Bookmark },
  { key: 'visitLogs', label: 'Nhật ký', icon: Compass },
  { key: 'reviews', label: 'Đánh giá', icon: Star },
  { key: 'comments', label: 'Bình luận', icon: MessageSquare },
  { key: 'blogs', label: 'Bài viết', icon: BookOpen },
  { key: 'proposals', label: 'Đề xuất', icon: PlusCircle }
]

export const ProfileTabBar: React.FC<ProfileTabBarProps> = ({
  activeTab,
  onTabChange,
  counts
}) => {
  return (
    <div className="bg-white rounded-2xl p-2 border border-slate-200/80 flex flex-wrap gap-1.5 shadow-2xs">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key
        const count = counts[key] ?? 0
        return (
          <button
            type="button"
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>
              {label} ({count})
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ProfileTabBar
