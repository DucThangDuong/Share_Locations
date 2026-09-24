import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen,
  Search,
  X,
  Plus,
  Calendar,
  Trash2,
  Loader2,
  Edit3,
  Eye,
  Clock,
  Tag
} from 'lucide-react'
import { blogService } from '@/services/blogService'
import type { UserBlogItemDto } from '@/types/models/blogArticle.model'
import type { PagedResultDto } from '@/types/models/userProfile.model'

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
  const [blogs, setBlogs] = useState<UserBlogItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await blogService.getMyBlogs({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        pageSize: 50
      })
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setBlogs(res.data)
        } else if (Array.isArray((res.data as PagedResultDto<UserBlogItemDto>).items)) {
          setBlogs((res.data as PagedResultDto<UserBlogItemDto>).items)
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
  }, [statusFilter])

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
        setBlogs((prev) => prev.filter((b) => b.id !== id))
        onToast?.('Đã xóa bài viết.')
      }
    } catch {
      onToast?.('Có lỗi xảy ra khi xóa bài viết.')
    }
  }

  const handleEditBlog = (e: React.MouseEvent, blog: UserBlogItemDto) => {
    e.stopPropagation()
    e.preventDefault()
    onClose?.()
    navigate(`/blog?edit=${blog.id}`, { state: { editBlog: blog } })
  }

  const handleSelectBlog = (blog: UserBlogItemDto) => {
    onClose?.()
    if (blog.status === 0 || blog.status === 2) {
      // Bản nháp (0) hoặc Chờ duyệt (2) -> mở trong editor (trạng thái 2 sẽ tự động khóa chỉ cho xem)
      navigate(`/blog?edit=${blog.id}`, { state: { editBlog: blog } })
    } else {
      // Đã xuất bản (1) -> mở trong reader
      navigate(`/blog/${blog.id}`)
    }
  }

  const filteredBlogs = useMemo(() => {
    if (!searchQuery.trim()) return blogs
    const q = searchQuery.toLowerCase().trim()
    return blogs.filter((b) =>
      b.title?.toLowerCase().includes(q) ||
      b.excerpt?.toLowerCase().includes(q) ||
      b.categoryName?.toLowerCase().includes(q)
    )
  }, [blogs, searchQuery])

  const filterTabs: Array<{ id: BlogStatusFilter; label: string }> = [
    { id: 'all', label: 'Tất cả' },
    { id: 1, label: 'Đã xuất bản' },
    { id: 2, label: 'Chờ duyệt' },
    { id: 0, label: 'Bản nháp' }
  ]

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top filter tabs and action */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {statusFilter === tab.id && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-100">
                    {blogs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Link
            to="/blog?mode=create"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus size={14} />
            <span>Viết bài mới</span>
          </Link>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, tóm tắt, danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-emerald-800" />
            <span className="text-xs">Đang tải danh sách bài viết...</span>
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
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-800 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs inline-flex items-center gap-1.5"
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
                onClick={() => handleSelectBlog(b)}
                className="group relative flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs bg-white"
              >
                {b.coverImageUrl ? (
                  <img
                    src={b.coverImageUrl}
                    alt={b.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/80"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0 pr-14">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        b.status === 1
                          ? 'bg-emerald-50 text-emerald-900'
                          : b.status === 2
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.status === 1 ? 'Đã xuất bản' : b.status === 2 ? 'Chờ duyệt' : 'Bản nháp'}
                    </span>
                    {b.categoryName && (
                      <span className="text-[10px] text-slate-500 truncate">
                        • {b.categoryName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                    {b.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>{new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
                    {b.status === 1 && (
                      <span className="flex items-center gap-0.5">
                        <Eye size={10} />
                        {b.viewCount || 0}
                      </span>
                    )}
                  </p>
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleEditBlog(e, b)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title={b.status === 2 ? "Xem bài viết đang chờ duyệt" : "Chỉnh sửa bài viết"}
                  >
                    {b.status === 2 ? <Eye size={13} className="text-amber-700" /> : <Edit3 size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteBlog(e, b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa bài viết"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredBlogs.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelectBlog(b)}
                className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                  {b.coverImageUrl ? (
                    <img
                      src={b.coverImageUrl}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-300">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs ${
                        b.status === 1
                          ? 'bg-emerald-700 text-white'
                          : b.status === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-white'
                      }`}
                    >
                      {b.status === 1 ? 'Đã xuất bản' : b.status === 2 ? 'Chờ duyệt' : 'Bản nháp'}
                    </span>
                    {b.categoryName && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-black/50 text-white backdrop-blur-xs flex items-center gap-1">
                        <Tag size={11} />
                        {b.categoryName}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleEditBlog(e, b)}
                      className="p-2 rounded-full bg-slate-900/60 hover:bg-emerald-700 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                      title={b.status === 2 ? "Xem bài viết đang chờ duyệt" : "Chỉnh sửa bài viết"}
                    >
                      {b.status === 2 ? <Eye size={13} /> : <Edit3 size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBlog(e, b.id)}
                      className="p-2 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                      title="Xóa bài viết"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                      {b.title}
                    </h4>
                    {b.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {b.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
                      </span>
                      {b.readTimeMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{b.readTimeMinutes} phút đọc</span>
                        </span>
                      )}
                      {b.status === 1 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Eye size={12} />
                          <span>{b.viewCount || 0}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-800 font-bold group-hover:underline text-[11px]">
                      {b.status === 0 ? 'Sửa nháp →' : b.status === 2 ? 'Xem chờ duyệt →' : 'Xem bài →'}
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

