import React from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Calendar,
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react'
import type { UserCommentItem } from '@/types/models/userProfile.model'

interface UserCommentsSectionProps {
  comments: UserCommentItem[]
}

export const UserCommentsSection: React.FC<UserCommentsSectionProps> = ({
  comments,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            <span>Bình luận & Thảo luận ({comments.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch sử các phản hồi, giải đáp thắc mắc và trao đổi bạn đã tham gia cùng cộng đồng.
          </p>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Chưa có bình luận nào
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Tham gia bình luận tại các địa điểm du lịch và trao đổi kinh nghiệm cùng những phượt thủ khác nhé!
          </p>
          <Link
            to="/explore"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>Khám phá địa điểm</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {comment.placeThumb ? (
                    <img
                      src={comment.placeThumb}
                      alt={comment.placeName}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <Link
                    to={`/places/${comment.placeId}`}
                    className="text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-800 transition-colors flex items-center gap-1"
                  >
                    <span>{comment.placeName}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </Link>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </span>
                </div>
              </div>

              {comment.parentAuthor && (
                <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Phản hồi tới:</span>
                  <span>{comment.parentAuthor}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
                "{comment.content}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
