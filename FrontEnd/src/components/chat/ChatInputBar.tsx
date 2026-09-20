import React from 'react'
import { Image as ImageIcon, Send, Loader2, Reply, X } from 'lucide-react'

interface ChatInputBarProps {
  inputText: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSendMessage: (customText?: string) => void
  isSending: boolean
  replyingTo: { id: number; senderName: string; text: string } | null
  onCancelReply: () => void
  onTriggerImageUpload: () => void
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  onInputChange,
  onSendMessage,
  isSending,
  replyingTo,
  onCancelReply,
  onTriggerImageUpload,
}) => {
  return (
    <>
      {/* Replying banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-1.5 truncate">
            <Reply size={13} className="rotate-180 text-blue-600" />
            <span className="truncate">
              Đang trả lời {replyingTo.senderName}: "{replyingTo.text}"
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <footer className="p-3 bg-white border-t border-[#E4E6EB] flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={onTriggerImageUpload}
          className="p-2 rounded-full hover:bg-[#F0F2F5] text-[#0084FF] transition-colors cursor-pointer"
          title="Đính kèm ảnh"
        >
          <ImageIcon size={20} />
        </button>

        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSendMessage()
          }}
          className="flex-1 px-4 py-2 bg-[#F0F2F5] focus:bg-white text-sm text-[#050505] rounded-full outline-none placeholder-[#65676B] border border-transparent focus:border-[#0084FF] transition-all"
        />

        <button
          type="button"
          disabled={!inputText.trim() || isSending}
          onClick={() => onSendMessage()}
          className={`p-2 rounded-full transition-colors ${
            inputText.trim() && !isSending
              ? 'bg-[#0084FF] hover:bg-[#0073E6] text-white cursor-pointer'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Gửi"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </footer>
    </>
  )
}

export default ChatInputBar
