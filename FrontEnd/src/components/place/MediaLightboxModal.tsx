import React from 'react'
import { X } from 'lucide-react'

interface MediaLightboxModalProps {
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  onClose: () => void
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  mediaUrl,
  mediaType,
  onClose
}) => {
  if (!mediaUrl) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full flex items-center justify-center p-2">
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full rounded-lg"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Xem ảnh lớn"
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  )
}
