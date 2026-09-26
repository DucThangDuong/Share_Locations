import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Share2 } from 'lucide-react'
import { RichContentRenderer } from '@/components/common/RichContentRenderer'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import type { BlogDetailDto } from '@/types/models/blogArticle.model'

interface BlogDetailModalProps {
  article: BlogDetailDto | null
  onClose: () => void
}

export const BlogDetailModal: React.FC<BlogDetailModalProps> = ({
  article,
  onClose
}) => {
  const navigate = useNavigate()
  if (!article) return null

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!')
  }

  const handleNavigateToAuthor = (e?: React.MouseEvent) => {
    onClose()
    navigateToAuthorProfile(navigate, article.author, article, e)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
            {article.category || 'Cẩm nang'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Chia sẻ bài viết"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
              <div
                onClick={handleNavigateToAuthor}
                className="flex items-center gap-3 cursor-pointer group/author hover:opacity-90 transition-opacity"
                title="Xem trang cá nhân của tác giả"
              >
                {article.author?.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author?.name || 'Tác giả'}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 group-hover/author:ring-1 group-hover/author:ring-emerald-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold group-hover/author:ring-1 group-hover/author:ring-emerald-500/50">
                    {(article.author?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="font-bold text-gray-900 group-hover/author:text-emerald-700 transition-colors block">{article.author?.name || 'Tác giả'}</span>
                  <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
                </div>
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
        </div>
      </div>
    </div>
  )
}
