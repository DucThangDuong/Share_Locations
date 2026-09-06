import { ChevronRight, BookOpen } from 'lucide-react'
import { extractPlainText } from '@/components/common/RichContentRenderer'
import type { BlogListItemDto } from '@/types/models/place.model'

interface BlogCardProps {
  post: BlogListItemDto
  onRead: (post: BlogListItemDto) => void
}

export const BlogCard = ({ post, onRead }: BlogCardProps) => {
  const summaryText = extractPlainText(post.excerpt || post.content)

  return (
    <div
      onClick={() => onRead(post)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <BookOpen className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-2xs font-bold bg-white/95 backdrop-blur-xs text-emerald-800 rounded-lg shadow-xs">
            {post.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="text-2xs text-gray-400 font-medium">{post.readTime || '4 phút đọc'}</div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {summaryText}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author?.name || 'Tác giả'}
                className="w-6 h-6 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                {(post.author?.name || 'T').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-2xs font-semibold text-gray-700 truncate max-w-[110px]">
              {post.author?.name || 'Tác giả'}
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
