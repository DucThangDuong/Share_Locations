import React from 'react'
import { User, Lock, Bell } from 'lucide-react'

export type SettingsTab = 'profile' | 'security' | 'preferences'

interface SettingsSidebarProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-1">
      <button
        type="button"
        onClick={() => onTabChange('profile')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <User className="w-4 h-4" />
        <div className="flex-1">
          <div>Thông tin cá nhân</div>
          <div className={`text-[10px] font-normal ${activeTab === 'profile' ? 'text-white/80' : 'text-slate-400'}`}>
            Họ tên, ảnh đại diện, tiểu sử
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('security')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
          activeTab === 'security'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Lock className="w-4 h-4" />
        <div className="flex-1">
          <div>Đổi mật khẩu & Bảo mật</div>
          <div className={`text-[10px] font-normal ${activeTab === 'security' ? 'text-white/80' : 'text-slate-400'}`}>
            Mật khẩu tài khoản đăng nhập
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('preferences')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
          activeTab === 'preferences'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Bell className="w-4 h-4" />
        <div className="flex-1">
          <div>Tùy chọn & Quyền riêng tư</div>
          <div className={`text-[10px] font-normal ${activeTab === 'preferences' ? 'text-white/80' : 'text-slate-400'}`}>
            Thông báo, nhật ký hành trình
          </div>
        </div>
      </button>
    </div>
  )
}

export default SettingsSidebar
