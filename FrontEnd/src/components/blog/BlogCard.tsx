import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Image } from 'lucide-react'
import { extractPlainText } from '@/components/common/RichContentRenderer'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import type { BlogListItemDto } from '@/types/models/place.model'

interface BlogCardProps {
  post: BlogListItemDto
  onRead: (post: BlogListItemDto) => void
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, onRead }) => {
  const navigate = useNavigate()
  const authorName = post.author?.name || post.authorName || 'Tác giả'
  const authorAvatar = post.author?.avatar || post.authorAvatar || null
  const coverImage = post.coverImg || post.coverUrl || post.coverImageUrl
  const summaryText = post.summary || extractPlainText(post.excerpt || post.content)

  const handleNavigateToAuthor = (e: React.MouseEvent) => {
    navigateToAuthorProfile(navigate, post.author, post, e)
  }

  return (
    <div
      onClick={() => onRead(post)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-all duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.no-img-placeholder')) {
                const fallback = document.createElement('div');
                fallback.className = 'no-img-placeholder w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 select-none';
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 select-none">
            <Image size={32} className="text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-2xs font-bold bg-white/95 backdrop-blur-xs text-emerald-800 rounded-lg shadow-xs">
            {post.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">

          <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {summaryText}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div
            onClick={handleNavigateToAuthor}
            className="flex items-center gap-2 cursor-pointer group/author hover:opacity-90 transition-opacity"
            title="Xem trang cá nhân của tác giả"
          >
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-6 h-6 rounded-full object-cover border border-gray-200 group-hover/author:ring-1 group-hover/author:ring-emerald-500/50"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold group-hover/author:ring-1 group-hover/author:ring-emerald-500/50">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-2xs font-semibold text-gray-700 group-hover/author:text-emerald-700 transition-colors truncate max-w-[110px]">
              {authorName}
            </span>
          </div>

          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  )
}
