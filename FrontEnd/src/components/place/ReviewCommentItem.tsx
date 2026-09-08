import React, { useState } from 'react'
import { Reply, Send, Loader2 } from 'lucide-react'
import type { CommentDto } from '@/types/models/place.model'

interface ReviewCommentItemProps {
  comment: CommentDto
  isAuthenticated: boolean
  currentUserAvatar?: string | null
  currentUserName?: string | null
  onReplySubmit: (parentId: number, content: string) => Promise<boolean>
}

const formatCommentTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return d.toLocaleDateString('vi-VN')
  } catch {
    return 'Vừa xong'
  }
}

export const ReviewCommentItem: React.FC<ReviewCommentItemProps> = ({
  comment,
  isAuthenticated,
  currentUserAvatar,
  currentUserName,
  onReplySubmit
}) => {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenReply = (mentionName?: string) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi phản hồi.')
      return
    }
    setIsReplying(true)
    if (mentionName && mentionName !== comment.userName) {
      setReplyText(`@${mentionName} `)
    } else {
      setReplyText('')
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setIsSubmitting(true)
    const success = await onReplySubmit(comment.id, replyText.trim())
    setIsSubmitting(false)
    if (success) {
      setReplyText('')
      setIsReplying(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 group">
        {comment.userAvatar ? (
          <img
            src={comment.userAvatar}
            alt={comment.userName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0 mt-0.5">
            {(comment.userName || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="inline-block bg-slate-50 border border-slate-200/70 rounded-2xl px-3.5 py-2.5 max-w-full">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">{comment.userName}</span>
              <span className="text-[10px] text-slate-400">{formatCommentTime(comment.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-700 mt-1 whitespace-pre-line break-words leading-relaxed">
              {comment.content}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-slate-500 font-medium">
            <button
              onClick={() => handleOpenReply()}
              className="hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Reply className="w-3 h-3" />
              <span>Phản hồi</span>
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <form
          onSubmit={handleSendReply}
          className="ml-11 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200"
        >
          {currentUserAvatar ? (
            <img
              src={currentUserAvatar}
              alt="Avatar"
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {(currentUserName || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <input
            type="text"
            required
            maxLength={1000}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Trả lời ${comment.userName}...`}
            className="flex-1 text-xs bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 px-1"
            autoFocus
          />

          <button
            type="button"
            onClick={() => {
              setIsReplying(false)
              setReplyText('')
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !replyText.trim()}
            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            <span>Gửi</span>
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 sm:pl-9 border-l-2 border-emerald-100 space-y-3 mt-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5">
              {reply.userAvatar ? (
                <img
                  src={reply.userAvatar}
                  alt={reply.userName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {(reply.userName || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="inline-block bg-white border border-slate-200/80 rounded-2xl px-3 py-2 max-w-full shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{reply.userName}</span>
                    <span className="text-[10px] text-slate-400">{formatCommentTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-line break-words leading-relaxed">
                    {reply.content}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-slate-500 font-medium">
                  <button
                    onClick={() => handleOpenReply(reply.userName)}
                    className="hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Phản hồi</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
