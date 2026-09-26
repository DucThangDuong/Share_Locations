import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  PenSquare,
  ArrowUpRight,
  Eye,
  Tag,
  RotateCcw,
  BookOpen,
  Check
} from 'lucide-react'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import type { BlogListItemDto } from '@/types/models/blogArticle.model'
import type { LookupItemDto } from '@/types/models/place.model'

interface BlogFeedViewProps {
  articles: BlogListItemDto[]
  categories?: LookupItemDto[]
  searchQuery: string
  selectedCategoryIds: number[]
  onSearchChange: (q: string) => void
  onClearSearch: () => void
  onCategoryToggle: (cat: LookupItemDto) => void
  onClearCategories: () => void
  onResetFilters: () => void
  onOpenArticle: (article: BlogListItemDto) => void
  onCreateArticle?: () => void
}

export const BlogFeedView: React.FC<BlogFeedViewProps> = ({
  articles,
  categories = [],
  searchQuery,
  selectedCategoryIds,
  onSearchChange,
  onClearSearch,
  onCategoryToggle,
  onClearCategories,
  onResetFilters,
  onOpenArticle,
  onCreateArticle
}) => {
  const navigate = useNavigate()
  const [displayCount, setDisplayCount] = useState(9)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Sync external search changes into local input value
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(localSearch)
  }

  const handleClear = () => {
    setLocalSearch('')
    onClearSearch()
  }

  const visibleArticles = articles.slice(0, displayCount)
  const hasMore = visibleArticles.length < articles.length

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 6)
  }

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategoryIds.length > 0
  )

  const totalSelectedCategories = selectedCategoryIds.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Header Search & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Tìm kiếm cẩm nang, ẩm thực, địa điểm..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-900 outline-hidden transition-all font-medium"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Search size={14} />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {onCreateArticle && (
            <button
              type="button"
              onClick={onCreateArticle}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <PenSquare size={14} />
              <span>Viết cẩm nang</span>
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('')
              onResetFilters()
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer w-fit"
          >
            <RotateCcw size={12} />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>

      {/* Categories Filter Card */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-700" />
              <span>Chủ đề & Danh mục:</span>
              {totalSelectedCategories > 0 && (
                <span className="ml-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Đã chọn {totalSelectedCategories} danh mục
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClearCategories}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                selectedCategoryIds.length === 0
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-700 border-stone-200'
              }`}
            >
              {selectedCategoryIds.length === 0 && <Check size={13} className="stroke-[3]" />}
              <span>Tất cả danh mục</span>
            </button>

            {categories.map((cat) => {
              const isCatSelected = selectedCategoryIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryToggle(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isCatSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-700 border-stone-200 font-medium'
                  }`}
                >
                  {isCatSelected && <Check size={13} className="stroke-[3]" />}
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Tìm thấy <strong className="text-slate-900 font-bold">{articles.length}</strong> bài viết cẩm nang
          {totalSelectedCategories > 0 && ` • ${totalSelectedCategories} chủ đề`}
        </span>
      </div>

      {/* Articles Grid or Empty State */}
      <div>
        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <Eye size={40} className="text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy bài viết nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Không có bài viết nào khớp với các tiêu chí tìm kiếm hiện tại. Bạn có thể thử đặt lại bộ lọc để khám phá toàn bộ cẩm nang.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('')
                  onResetFilters()
                }}
                className="mt-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {visibleArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="group flex flex-col space-y-3.5 cursor-pointer bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-emerald-600/70 hover:shadow-md transition-all shadow-2xs"
              >
                <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60">
                  {art.coverUrl ? (
                    <img
                      src={art.coverUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/10 to-teal-900/20 text-emerald-800">
                      <BookOpen size={32} />
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <ArrowUpRight
                        size={18}
                        className="text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                      />
                    </div>

                    {art.excerpt && (
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 font-normal">
                        {art.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div
                      onClick={(e) => navigateToAuthorProfile(navigate, art.author, art, e)}
                      className="flex items-center gap-2 min-w-0 cursor-pointer group/author hover:opacity-90 transition-opacity"
                      title="Xem trang cá nhân của tác giả"
                    >
                      {art.author?.avatar ? (
                        <img
                          src={art.author.avatar}
                          alt={art.author?.name || 'Tác giả'}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0 group-hover/author:ring-1 group-hover/author:ring-emerald-500/50"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 group-hover/author:ring-1 group-hover/author:ring-emerald-500/50">
                          {(art.author?.name || 'T').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-xs text-slate-800 group-hover/author:text-emerald-700 transition-colors truncate">
                        {art.author?.name || 'Tác giả'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {art.readTime || '5 phút đọc'}
                    </span>
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
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xem thêm bài viết</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogFeedView
