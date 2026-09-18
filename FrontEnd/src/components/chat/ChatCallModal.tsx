import React from 'react'
import { PhoneOff } from 'lucide-react'

interface ChatCallModalProps {
  isOpen: boolean
  callType: 'voice' | 'video'
  partnerName: string
  partnerAvatar: string
  onEndCall: () => void
}

export const ChatCallModal: React.FC<ChatCallModalProps> = ({
  isOpen,
  callType,
  partnerName,
  partnerAvatar,
  onEndCall,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
      <div className="bg-slate-900 text-white rounded-3xl p-6 w-[340px] flex flex-col items-center text-center space-y-4 shadow-2xl">
        <img
          src={partnerAvatar}
          alt=""
          className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 animate-pulse"
        />
        <div>
          <h3 className="text-lg font-bold">{partnerName}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {callType === 'video' ? 'Cuộc gọi video đang đổ chuông...' : 'Cuộc gọi thoại đang đổ chuông...'}
          </p>
        </div>
        <button
          type="button"
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white hover:bg-rose-700 cursor-pointer transition-colors shadow-lg"
          title="Kết thúc"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  )
}

export default ChatCallModal
