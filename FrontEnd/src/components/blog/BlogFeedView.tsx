import React, { useState, useEffect } from 'react'
import {
  Search,
  X,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { BlogListItemDto } from '@/types/models/blogArticle.model'
import type { LookupItemDto } from '@/types/models/place.model'
import { BlogCard } from './BlogCard'

interface BlogFeedViewProps {
  articles: BlogListItemDto[]
  categories?: LookupItemDto[]
  selectedCategoryId?: number | null
  searchQuery: string
  currentPage?: number
  pageSize?: number
  totalPages?: number
  onSearchChange: (q: string) => void
  onClearSearch: () => void
  onSelectCategory?: (categoryId?: number | null) => void
  onResetFilters: () => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onOpenArticle: (article: BlogListItemDto) => void
  onCreateArticle?: () => void
}

export const BlogFeedView: React.FC<BlogFeedViewProps> = ({
  articles,
  categories = [],
  selectedCategoryId,
  searchQuery,
  currentPage = 1,
  pageSize = 9,
  totalPages: controlledTotalPages,
  onSearchChange,
  onClearSearch,
  onSelectCategory,
  onResetFilters: _onResetFilters,
  onPageChange,
  onPageSizeChange,
  onOpenArticle,
  onCreateArticle: _onCreateArticle
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [internalPage, setInternalPage] = useState(currentPage)
  const [internalPageSize, setInternalPageSize] = useState(pageSize)

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setInternalPage(currentPage)
  }, [currentPage])

  useEffect(() => {
    setInternalPageSize(pageSize)
  }, [pageSize])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(localSearch)
  }

  const handleClear = () => {
    setLocalSearch('')
    onClearSearch()
  }

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedCategoryId)

  const totalItems = articles.length
  const totalPages = controlledTotalPages || Math.max(1, Math.ceil(totalItems / internalPageSize))
  const pagedArticles = onPageChange
    ? articles
    : articles.slice((internalPage - 1) * internalPageSize, internalPage * internalPageSize)

  const handlePageClick = (page: number) => {
    if (page < 1 || page > totalPages) return
    if (onPageChange) {
      onPageChange(page)
    } else {
      setInternalPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize)
    } else {
      setInternalPageSize(newSize)
      setInternalPage(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-2xs space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4 space-y-4 pr-0 lg:pr-4">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Góc nhìn cẩm nang.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Tổng hợp kinh nghiệm thực tế, cẩm nang ẩm thực và góc nhìn đa chiều từ những người đi trước.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Bỏ túi những mẹo du lịch hữu ích theo từng mùa để chuyến đi của bạn luôn trọn vẹn và an tâm nhất.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full pt-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm cẩm nang, ẩm thực, kinh nghiệm du lịch..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-20 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                    title="Xóa tìm kiếm"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Tìm
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Danh mục
              </h3>
            </div>

            <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-xs sm:text-sm">
                <li className="truncate">
                  <button
                    type="button"
                    onClick={() => onSelectCategory?.(null)}
                    className={`text-left transition-colors cursor-pointer truncate w-full block ${!selectedCategoryId
                      ? 'text-emerald-800 font-bold underline underline-offset-4 decoration-2'
                      : 'text-slate-700 hover:text-emerald-800 hover:underline'
                      }`}
                  >
                    Tất cả danh mục
                  </button>
                </li>
                {categories.map((cat) => {
                  const active = selectedCategoryId === cat.id
                  return (
                    <li key={cat.id} className="truncate">
                      <button
                        type="button"
                        onClick={() => onSelectCategory?.(active ? null : cat.id)}
                        className={`text-left transition-colors cursor-pointer truncate w-full block ${active
                          ? 'text-emerald-800 font-bold underline underline-offset-4 decoration-2'
                          : 'text-slate-700 hover:text-emerald-800 hover:underline'
                          }`}
                        title={cat.name}
                      >
                        {cat.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <Eye size={40} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy bài viết nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Không có bài viết nào khớp với các tiêu chí tìm kiếm hiện tại. Bạn có thể chọn danh mục hoặc từ khóa khác.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {hasActiveFilters ? 'Các bài viết liên quan' : 'Khám phá cẩm nang du lịch'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {pagedArticles.map((art) => (
              <BlogCard key={art.id} post={art} onRead={onOpenArticle} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>Hiển thị:</span>
              <select
                value={internalPageSize}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value={6}>6 bài / trang</option>
                <option value={9}>9 bài / trang</option>
                <option value={12}>12 bài / trang</option>
                <option value={18}>18 bài / trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={internalPage <= 1}
                onClick={() => handlePageClick(internalPage - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= internalPage - 1 && pageNum <= internalPage + 1)
                ) {
                  const isActive = pageNum === internalPage
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageClick(pageNum)}
                      className={`min-w-[34px] h-[34px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${isActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                } else if (
                  pageNum === internalPage - 2 ||
                  pageNum === internalPage + 2
                ) {
                  return (
                    <span key={pageNum} className="px-1 text-xs text-slate-400 select-none">
                      ...
                    </span>
                  )
                }
                return null
              })}

              <button
                type="button"
                disabled={internalPage >= totalPages}
                onClick={() => handlePageClick(internalPage + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogFeedView
