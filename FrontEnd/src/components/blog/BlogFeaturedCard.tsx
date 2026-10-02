import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, BookOpen } from 'lucide-react'
import { extractPlainText } from '@/components/common/RichContentRenderer'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import type { BlogListItemDto } from '@/types/models/place.model'

interface BlogFeaturedCardProps {
  post: BlogListItemDto
  onRead: (post: BlogListItemDto) => void
}

export const BlogFeaturedCard: React.FC<BlogFeaturedCardProps> = ({ post, onRead }) => {
  const navigate = useNavigate()
  const authorName = post.author?.name || post.authorName || 'Tác giả'
  const authorAvatar = post.author?.avatar || post.authorAvatar || null
  const coverImage = post.coverImg || post.coverUrl || post.coverImageUrl
  const summaryText = post.summary || extractPlainText(post.excerpt || post.content)
  const displayDate = post.publishedAt || post.createdAt
  const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString('vi-VN') : null

  const handleNavigateToAuthor = (e: React.MouseEvent) => {
    navigateToAuthorProfile(navigate, post.author, post, e)
  }

  return (
    <div
      onClick={() => onRead(post)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer grid grid-cols-1 md:grid-cols-2 group"
    >
      <div className="relative h-64 md:h-auto overflow-hidden bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full min-h-[220px] flex items-center justify-center bg-slate-100 text-slate-300">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 font-bold text-xs rounded-lg shadow-sm">
            <span>Bài viết nổi bật</span>
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <span className="px-2.5 py-0.5 bg-emerald-50 rounded-md border border-emerald-200/60">
              {post.category}
            </span>

          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
            {post.title}
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {summaryText}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div
            onClick={handleNavigateToAuthor}
            className="flex items-center gap-3 cursor-pointer group/author hover:opacity-90 transition-opacity"
            title="Xem trang cá nhân của tác giả"
          >
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 group-hover/author:ring-1 group-hover/author:ring-emerald-500/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold group-hover/author:ring-1 group-hover/author:ring-emerald-500/50">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-xs">
              <span className="font-bold text-gray-900 group-hover/author:text-emerald-700 transition-colors block">{authorName}</span>
              {formattedDate && <span className="text-gray-400">{formattedDate}</span>}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
            <span>Đọc tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  )
}
