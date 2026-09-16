import React, { useState } from 'react'
import {
  Search,
  X,
  PenSquare,
  ArrowUpRight,
  Eye
} from 'lucide-react'
import type { BlogArticleItem } from '@/types/models/blogArticle.model'

interface BlogFeedViewProps {
  articles: BlogArticleItem[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onClearSearch: () => void
  onOpenArticle: (article: BlogArticleItem) => void
  onCreateArticle?: () => void
}

export const BlogFeedView: React.FC<BlogFeedViewProps> = ({
  articles,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onOpenArticle,
  onCreateArticle
}) => {
  const [displayCount, setDisplayCount] = useState(9)
  const visibleArticles = articles.slice(0, displayCount)
  const hasMore = visibleArticles.length < articles.length

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 6)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Tìm kiếm cẩm nang, ẩm thực..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-900 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {onCreateArticle && (
            <button
              type="button"
              onClick={onCreateArticle}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <PenSquare size={13} />
              <span>Tạo cẩm nang</span>
            </button>
          )}
        </div>
      </div>
      <div className="space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cẩm nang LangThang
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
            <Eye size={36} className="text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Không tìm thấy bài viết nào
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy thử tìm kiếm với từ khóa khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {visibleArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="group flex flex-col space-y-4 cursor-pointer"
              >
                <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-2xs border border-slate-200/60">
                  <img
                    src={art.coverImg}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300"
                    loading="lazy"
                  />
                </div>

                <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <ArrowUpRight
                        size={20}
                        className="text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                      />
                    </div>

                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 font-normal">
                      {art.excerpt || art.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {art.authorAvatar ? (
                        <img
                          src={art.authorAvatar}
                          alt={art.authorName}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {art.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-xs flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-800 truncate">
                          {art.authorName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-8 pb-4">
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đọc thêm</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogFeedView

