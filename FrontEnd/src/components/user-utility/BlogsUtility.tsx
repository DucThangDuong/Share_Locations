import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen,
  Search,
  X,
  Plus,
  Calendar,
  Trash2,
  Loader2
} from 'lucide-react'
import { userService } from '@/services/userService'
import { blogService } from '@/services/blogService'
import type { UserBlogItem, PagedResultDto } from '@/types/models/userProfile.model'

interface BlogsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
  onToast?: (msg: string) => void
}

type BlogStatusFilter = 'all' | 0 | 1 | 2

export const BlogsUtility: React.FC<BlogsUtilityProps> = ({
  isDrawer = false,
  onClose,
  onToast
}) => {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState<UserBlogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getMyBlogs({ pageSize: 50 })
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setBlogs(res.data)
        } else if (Array.isArray((res.data as PagedResultDto<UserBlogItem>).items)) {
          setBlogs((res.data as PagedResultDto<UserBlogItem>).items)
        } else {
          setBlogs([])
        }
      } else {
        setBlogs([])
      }
    } catch {
      setBlogs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  const handleDeleteBlog = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return
    try {
      const res = await blogService.deleteBlog(id)
      if (res.success) {
        setBlogs((prev) => prev.filter((b) => b.id !== id))
        onToast?.('Đã xóa bài viết.')
      } else {
        // Fallback optimistic removal
        setBlogs((prev) => prev.filter((b) => b.id !== id))
        onToast?.('Đã xóa bài viết.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi xóa bài viết.')
    }
  }

  const handleSelectBlog = (id: number) => {
    onClose?.()
    navigate(`/blog/${id}`)
  }

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          b.title?.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [blogs, statusFilter, searchQuery])

  const filterTabs: Array<{ id: BlogStatusFilter; label: string; count: number }> = [
    { id: 'all', label: 'Tất cả', count: blogs.length },
    { id: 1, label: 'Đã xuất bản', count: blogs.filter((b) => b.status === 1).length },
    { id: 2, label: 'Chờ duyệt', count: blogs.filter((b) => b.status === 2).length },
    { id: 0, label: 'Bản nháp', count: blogs.filter((b) => b.status === 0).length }
  ]

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top filter tabs and action */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={String(tab.id)}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === tab.id
                ? 'bg-violet-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.id ? 'bg-violet-900 text-violet-100' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isDrawer && (
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <Link
            to="/blog?mode=create"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-800 hover:bg-violet-900 text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus size={14} />
            <span>Viết bài</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-violet-800" />
            <span className="text-xs">Đang tải bài viết...</span>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <BookOpen size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có bài viết nào</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Chia sẻ những cẩm nang bỏ túi, kinh nghiệm phượt và bài viết truyền cảm hứng cho cộng đồng.
            </p>
            <Link
              to="/blog?mode=create"
              onClick={onClose}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-violet-800 rounded-xl hover:bg-violet-900 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Viết bài đầu tiên</span>
            </Link>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Layout */
          <div className="space-y-2.5">
            {filteredBlogs.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelectBlog(b.id)}
                className="group relative flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs bg-white"
              >
                {b.coverImageUrl ? (
                  <img
                    src={b.coverImageUrl}
                    alt={b.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/80"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-violet-50 text-violet-800 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${b.status === 1
                        ? 'bg-emerald-50 text-emerald-900'
                        : b.status === 2
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {b.status === 1 ? 'Đã xuất bản' : b.status === 2 ? 'Chờ duyệt' : 'Bản nháp'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-violet-800 transition-colors">
                    {b.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteBlog(e, b.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa bài viết"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredBlogs.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelectBlog(b.id)}
                className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-violet-300 transition-all overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                  {b.coverImageUrl ? (
                    <img
                      src={b.coverImageUrl}
                      alt={b.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-violet-50 text-violet-300">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs ${b.status === 1
                        ? 'bg-emerald-600 text-white'
                        : b.status === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-white'
                        }`}
                    >
                      {b.status === 1 ? 'Đã xuất bản' : b.status === 2 ? 'Chờ duyệt' : 'Bản nháp'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteBlog(e, b.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                    title="Xóa bài viết"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-violet-800 transition-colors line-clamp-2">
                      {b.title}
                    </h4>
                    {b.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {b.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                    <span className="text-violet-800 font-bold group-hover:underline text-[11px]">
                      Đọc tiếp →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogsUtility
