import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  MessageCircle,
  Search,
  X,
  MapPin,
  Calendar,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { userService } from '@/services/userService'
import type { UserCommentItem } from '@/types/models/userProfile.model'

interface CommentsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
}

export const CommentsUtility: React.FC<CommentsUtilityProps> = ({
  isDrawer = false,
  onClose
}) => {
  const navigate = useNavigate()
  const [comments, setComments] = useState<UserCommentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getMyComments({ pageSize: 50 })
      if (res.success && Array.isArray(res.data)) {
        setComments(res.data)
      } else {
        setComments([])
      }
    } catch {
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSelectPlace = (placeId: number) => {
    onClose?.()
    navigate(`/places/${placeId}`)
  }

  const filteredComments = useMemo(() => {
    if (!searchQuery.trim()) return comments
    const q = searchQuery.toLowerCase().trim()
    return comments.filter(
      (c) => c.placeName?.toLowerCase().includes(q) || c.content?.toLowerCase().includes(q)
    )
  }, [comments, searchQuery])

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top Header / Search in Full-page */}
      {!isDrawer && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Tổng số bình luận ({comments.length})
            </span>
          </div>

          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bình luận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-cyan-800" />
            <span className="text-xs">Đang tải bình luận...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <MessageCircle size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có bình luận nào</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Tham gia bình luận tại các địa điểm du lịch và trao đổi kinh nghiệm cùng những phượt thủ khác.
            </p>
            <Link
              to="/explore"
              onClick={onClose}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-cyan-800 rounded-xl hover:bg-cyan-900 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Khám phá địa điểm</span>
            </Link>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Layout */
          <div className="space-y-2.5">
            {filteredComments.map((com) => (
              <div
                key={com.id}
                onClick={() => handleSelectPlace(com.placeId)}
                className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs bg-white"
              >
                <div className="flex items-center gap-2 mb-1">
                  {com.placeThumb ? (
                    <img
                      src={com.placeThumb}
                      alt={com.placeName}
                      className="w-5 h-5 rounded-md object-cover"
                    />
                  ) : (
                    <MapPin size={13} className="text-cyan-800" />
                  )}
                  <h4 className="text-xs font-bold text-slate-900 truncate flex-1">
                    {com.placeName}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                  "{com.content}"
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{new Date(com.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="text-emerald-800 font-bold">Xem địa điểm →</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="space-y-3">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {comment.placeThumb ? (
                      <img
                        src={comment.placeThumb}
                        alt={comment.placeName}
                        className="w-7 h-7 rounded-lg object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-800 flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <Link
                      to={`/places/${comment.placeId}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-800 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{comment.placeName}</span>
                      <ExternalLink size={12} className="text-slate-400" />
                    </Link>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{comment.content}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentsUtility
