import React from 'react'
import { UserMinus } from 'lucide-react'
import type { FriendUser } from '@/types/models/friend.model'

interface UnfriendConfirmModalProps {
  user: FriendUser | null
  onClose: () => void
  onConfirm: () => void
}

export const UnfriendConfirmModal: React.FC<UnfriendConfirmModalProps> = ({
  user,
  onClose,
  onConfirm
}) => {
  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserMinus size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1.5">
          Hủy kết bạn?
        </h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Bạn có chắc chắn muốn hủy kết bạn với{' '}
          <strong className="text-slate-900 font-bold">{user.fullName}</strong>?
          Hành động này sẽ không gửi thông báo cho đối phương.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
          >
            Trở lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnfriendConfirmModal
