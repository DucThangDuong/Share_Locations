import { ChevronRight, Sparkles, BookOpen } from 'lucide-react'
import { extractPlainText } from '@/components/common/RichContentRenderer'
import type { BlogListItemDto } from '@/types/models/place.model'

interface BlogFeaturedCardProps {
  post: BlogListItemDto
  onRead: (post: BlogListItemDto) => void
}

export const BlogFeaturedCard = ({ post, onRead }: BlogFeaturedCardProps) => {
  const summaryText = extractPlainText(post.excerpt || post.content)
  return (
    <div
      onClick={() => onRead(post)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer grid grid-cols-1 md:grid-cols-2 group"
    >
      <div className="relative h-64 md:h-auto overflow-hidden bg-gray-100">
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full min-h-[220px] flex items-center justify-center bg-slate-100 text-slate-300">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 font-bold text-xs rounded-lg shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
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
            <span>•</span>
            <span className="text-gray-500">{post.readTime || '5 phút đọc'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
            {post.title}
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {summaryText}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author?.name || 'Tác giả'}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                {(post.author?.name || 'T').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-xs">
              <span className="font-bold text-gray-900 block">{post.author?.name || 'Tác giả'}</span>
              <span className="text-gray-400">{post.publishedAt}</span>
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
