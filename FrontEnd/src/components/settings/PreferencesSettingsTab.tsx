import React, { useState } from 'react'

export const PreferencesSettingsTab: React.FC = () => {
  const [notifyComments, setNotifyComments] = useState(true)
  const [notifyReviews, setNotifyReviews] = useState(true)
  const [publicVisitLogs, setPublicVisitLogs] = useState(true)

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Thông báo & Tương tác cộng đồng
        </h3>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Thông báo phản hồi đánh giá</span>
            <span className="text-[11px] text-slate-500">Nhận thông báo khi có người trả lời hoặc thả cảm xúc đánh giá của bạn</span>
          </div>
          <input
            type="checkbox"
            checked={notifyReviews}
            onChange={(e) => setNotifyReviews(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between gap-4 cursor-pointer pt-3 border-t border-slate-200/60">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Thông báo bài viết & bình luận</span>
            <span className="text-[11px] text-slate-500">Nhận cập nhật khi bài viết cẩm nang được kiểm duyệt hoặc có bình luận mới</span>
          </div>
          <input
            type="checkbox"
            checked={notifyComments}
            onChange={(e) => setNotifyComments(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </label>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Quyền riêng tư mặc định
        </h3>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Nhật ký hành trình công khai</span>
            <span className="text-[11px] text-slate-500">Cho phép người dùng khác xem các chuyến đi được chia sẻ của bạn</span>
          </div>
          <input
            type="checkbox"
            checked={publicVisitLogs}
            onChange={(e) => setPublicVisitLogs(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  )
}

export default PreferencesSettingsTab
