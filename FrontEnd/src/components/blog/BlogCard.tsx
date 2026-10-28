import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Image, Eye, Calendar } from 'lucide-react'
import { extractPlainText } from '@/components/common/RichContentRenderer'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import type { BlogListItemDto } from '@/types/models/blogArticle.model'
import {
  formatEditorialDate,
  formatViewsCount
} from './blogEnhancer'

interface BlogCardProps {
  post: BlogListItemDto
  onRead: (post: BlogListItemDto) => void
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, onRead }) => {
  const navigate = useNavigate()
  const authorName = post.authorName || post.author?.name || 'Tác giả'
  const authorAvatar = post.authorAvatar || post.author?.avatar || null
  const coverImage = post.coverImageUrl || post.coverUrl || post.coverImg
  const summaryText = post.summary || extractPlainText(post.excerpt || post.content)

  const formattedDate = formatEditorialDate(post.publishedAt || post.createdAt)
  const { formatted: formattedViews } = formatViewsCount(post.viewCount ?? post.views)

  const handleNavigateToAuthor = (e: React.MouseEvent) => {
    navigateToAuthorProfile(navigate, post.author, post, e)
  }

  return (
    <article
      onClick={() => onRead(post)}
      className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-600/70 hover:shadow-lg transition-all duration-300 shadow-2xs overflow-hidden cursor-pointer"
    >
      <div>
        <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
          {coverImage ? (
            <img
              src={coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent && !parent.querySelector('.no-img-placeholder')) {
                  const fallback = document.createElement('div')
                  fallback.className = 'no-img-placeholder w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 select-none'
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 mb-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[11px] font-medium text-slate-400">Hình ảnh cẩm nang</span>'
                  parent.appendChild(fallback)
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 select-none">
              <Image size={36} className="text-slate-300 mb-1" />
              <span className="text-[11px] font-medium text-slate-400">Hình ảnh cẩm nang</span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-2.5">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>

          {summaryText && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
              {summaryText}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-1">
            {formattedDate && (
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar size={10} className="text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            )}
            {formattedDate && <span className="text-slate-300">•</span>}
            <span className="flex items-center gap-1 text-slate-500" title={`${formattedViews} lượt xem`}>
              <Eye size={10} className="text-slate-400" />
              <span>{formattedViews}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div
          onClick={handleNavigateToAuthor}
          className="flex items-center gap-2 cursor-pointer group/author hover:opacity-90 transition-opacity min-w-0"
          title={`Xem trang cá nhân của ${authorName}`}
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0 group-hover/author:ring-2 group-hover/author:ring-emerald-500/50"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 group-hover/author:ring-2 group-hover/author:ring-emerald-500/50">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-2xs font-bold text-slate-700 group-hover/author:text-emerald-700 transition-colors truncate max-w-[140px]">
            {authorName}
          </span>
        </div>

        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
          <span>Chi tiết</span>
          <ChevronRight size={13} />
        </span>
      </div>
    </article>
  )
}

export default BlogCard
