import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Share2,
  Calendar,
  Eye,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { RichContentRenderer } from '@/components/common/RichContentRenderer'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import type { BlogDetailDto } from '@/types/models/blogArticle.model'

interface BlogDetailModalProps {
  isOpen?: boolean
  article: BlogDetailDto | null
  onClose: () => void
}

export const BlogDetailModal: React.FC<BlogDetailModalProps> = ({
  isOpen = true,
  article,
  onClose
}) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen || !article) return
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, article, onClose])

  if (!isOpen || !article) return null

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `/blog/${article.id}`)
    alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!')
  }

  const handleNavigateToAuthor = (e?: React.MouseEvent) => {
    onClose()
    navigateToAuthorProfile(navigate, article.author, article, e)
  }

  const handleFullRead = () => {
    onClose()
    navigate(`/blog/${article.id}`)
  }

  const authorName = article.author?.name || article.authorName || 'Tác giả'
  const authorAvatar = article.author?.avatar || article.authorAvatar || null
  const authorRole = article.author?.role || 'Tác giả chia sẻ'
  const coverImage = article.coverImg || article.coverUrl || article.coverImageUrl
  const summaryText = article.summary || article.excerpt
  const categoryName = article.category || article.categoryName || 'Cẩm nang du lịch'
  const displayDate = article.publishedAt || article.createdAt
  const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString('vi-VN') : null
  const viewsCount = article.views ?? article.viewCount

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 font-sans">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-white shrink-0">
          <div
            onClick={handleNavigateToAuthor}
            className="flex items-center gap-3 min-w-0 cursor-pointer group/author hover:opacity-90 transition-opacity"
            title="Xem trang cá nhân của tác giả"
          >
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover/author:text-emerald-700 transition-colors truncate">
                  {authorName}
                </span>
                <CheckCircle2
                  size={14}
                  className="text-emerald-500 fill-emerald-100 shrink-0"
                />
              </div>
              <span className="text-[11px] text-slate-400 block truncate">
                {authorRole}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Chia sẻ bài viết"
            >
              <Share2 size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg">
                {categoryName}
              </span>
              {formattedDate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar size={12} />
                  {formattedDate}
                </span>
              )}

              {viewsCount !== undefined && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Eye size={12} />
                  {Number(viewsCount).toLocaleString('vi-VN')} lượt xem
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {article.title}
            </h1>

            {summaryText && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                {summaryText}
              </p>
            )}
          </div>

          {coverImage && (
            <div className="pt-4">
              <div className="rounded-2xl overflow-hidden h-56 sm:h-72 bg-slate-100 border border-slate-200">
                <img
                  src={coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="pt-4 text-xs sm:text-sm leading-relaxed text-slate-700 font-normal">
            <RichContentRenderer content={article.content || article.excerpt} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Đóng</span>
          </button>

          <button
            type="button"
            onClick={handleFullRead}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Đọc toàn bộ bài viết</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default BlogDetailModal
