import { X, Share2, Tag, ChevronRight } from 'lucide-react'
import { RichContentRenderer } from '@/components/common/RichContentRenderer'
import type { BlogDetailDto, BlogListItemDto } from '@/types/models/place.model'

interface BlogDetailModalProps {
  article: BlogDetailDto | null
  onClose: () => void
  onSelectRelated: (post: BlogListItemDto) => void
}

export const BlogDetailModal = ({
  article,
  onClose,
  onSelectRelated
}: BlogDetailModalProps) => {
  if (!article) return null

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
            {article.category}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Chia sẻ bài viết"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {article.author?.avatar ? (
                <img
                  src={article.author.avatar}
                  alt={article.author?.name || 'Tác giả'}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                  {(article.author?.name || 'T').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-bold text-gray-900 block">{article.author?.name || 'Tác giả'}</span>
                <span>{article.publishedAt} • {article.readTime || '5 phút đọc'}</span>
              </div>
            </div>
          </div>

          {article.coverUrl && (
            <div className="rounded-lg overflow-hidden h-64 sm:h-80 bg-gray-100">
              <img
                src={article.coverUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <RichContentRenderer content={article.content || article.excerpt} />

          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              {article.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {article.relatedPosts && article.relatedPosts.length > 0 && (
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Bài viết liên quan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {article.relatedPosts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-lg border border-gray-200/60 cursor-pointer transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="text-xs font-semibold text-gray-800 line-clamp-1">{rel.title}</div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
