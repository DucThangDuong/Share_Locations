import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ChatLightboxProps {
  imageUrl: string | null
  onClose: () => void
}

export const ChatLightbox: React.FC<ChatLightboxProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    if (!imageUrl) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [imageUrl, onClose])

  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
        title="Đóng (Esc)"
      >
        <X size={24} />
      </button>

      <img
        src={imageUrl}
        alt=""
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default ChatLightbox
