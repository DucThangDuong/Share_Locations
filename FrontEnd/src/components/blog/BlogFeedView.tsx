import React, { useState, useMemo } from 'react'
import {
  Search,
  X,
  PenSquare,
  ArrowUpRight,
  Eye,
  MapPin,
  Tag,
  RotateCcw,
  BookOpen
} from 'lucide-react'
import type { BlogListItemDto } from '@/types/models/blogArticle.model'
import type { LookupItemDto, RegionLookupDto } from '@/types/models/place.model'

interface BlogFeedViewProps {
  articles: BlogListItemDto[]
  categories?: LookupItemDto[]
  regions?: RegionLookupDto[]
  searchQuery: string
  selectedRegion: string | null
  selectedProvince: string | null
  selectedCategory: string | null
  onSearchChange: (q: string) => void
  onClearSearch: () => void
  onSelectRegion: (reg: string | null) => void
  onSelectProvince: (prov: string | null) => void
  onSelectCategory: (cat: string | null) => void
  onResetFilters: () => void
  onOpenArticle: (article: BlogListItemDto) => void
  onCreateArticle?: () => void
}

export const BlogFeedView: React.FC<BlogFeedViewProps> = ({
  articles,
  categories = [],
  regions = [],
  searchQuery,
  selectedRegion,
  selectedProvince,
  selectedCategory,
  onSearchChange,
  onClearSearch,
  onSelectRegion,
  onSelectProvince,
  onSelectCategory,
  onResetFilters,
  onOpenArticle,
  onCreateArticle
}) => {
  const [displayCount, setDisplayCount] = useState(9)
  const visibleArticles = articles.slice(0, displayCount)
  const hasMore = visibleArticles.length < articles.length

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 6)
  }

  const handleToggleRegion = (regionName: string) => {
    if (selectedRegion === regionName) {
      onSelectRegion(null)
      onSelectProvince(null)
    } else {
      onSelectRegion(regionName)
      onSelectProvince(null)
    }
  }

  const handleToggleProvince = (provName: string) => {
    if (selectedProvince === provName) {
      onSelectProvince(null)
    } else {
      onSelectProvince(provName)
    }
  }

  const handleToggleCategory = (catName: string) => {
    if (selectedCategory === catName) {
      onSelectCategory(null)
    } else {
      onSelectCategory(catName)
    }
  }

  const activeProvincesList = useMemo(() => {
    if (!selectedRegion) return []
    const found = regions.find((r) => r.name === selectedRegion)
    return found ? found.provinces : []
  }, [regions, selectedRegion])

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedRegion ||
    selectedProvince ||
    selectedCategory
  )

  const regionNames = regions.length > 0
    ? regions.map((r) => r.name)
    : ['Miền Bắc', 'Miền Trung', 'Miền Nam']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Tìm kiếm cẩm nang, ẩm thực, địa điểm..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-900 outline-hidden transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <MapPin size={14} className="text-[#004f32]" />
            <span>Vùng miền:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {regionNames.map((reg) => {
              const isSelected = selectedRegion === reg
              return (
                <button
                  type="button"
                  key={reg}
                  onClick={() => handleToggleRegion(reg)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${isSelected
                    ? 'bg-[#004f32] text-white border-[#004f32] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-700 border-stone-200'
                    }`}
                >
                  {reg}
                </button>
              )
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {selectedRegion && activeProvincesList.length > 0 && (
          <div className="pt-3 border-t border-dashed border-slate-200 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Tỉnh thành thuộc {selectedRegion}:</span>
              <span className="text-[10px] font-normal text-slate-400">
                {selectedProvince ? `Đang chọn: ${selectedProvince}` : 'Chọn tỉnh thành để lọc chi tiết'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => onSelectProvince(null)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${selectedProvince === null
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                Tất cả {selectedRegion}
              </button>

              {activeProvincesList.map((prov) => {
                const isProvSelected = selectedProvince === prov.name
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleToggleProvince(prov.name)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer border ${isProvSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 border-slate-200 font-medium'
                      }`}
                  >
                    {prov.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-emerald-700" />
                <span>Chủ đề & Danh mục:</span>
              </div>
              {selectedCategory && (
                <span className="text-[11px] font-normal text-slate-500">
                  Đang lọc: <strong className="text-emerald-900 font-bold">{selectedCategory}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${selectedCategory === null
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                Tất cả danh mục
              </button>

              {categories.map((cat) => {
                const isCatSelected = selectedCategory === cat.name
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleCategory(cat.name)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer border ${isCatSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 border-slate-200 font-medium'
                      }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Tìm thấy <strong className="text-slate-900 font-bold">{articles.length}</strong> bài viết cẩm nang
          {selectedRegion ? ` tại ${selectedRegion}` : ''}
          {selectedProvince ? ` • ${selectedProvince}` : ''}
          {selectedCategory ? ` • ${selectedCategory}` : ''}
        </span>
      </div>

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
                onClick={onResetFilters}
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
                    <div className="flex items-center gap-2 min-w-0">
                      {art.author?.avatar ? (
                        <img
                          src={art.author.avatar}
                          alt={art.author?.name || 'Tác giả'}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(art.author?.name || 'T').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-xs text-slate-800 truncate">
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
