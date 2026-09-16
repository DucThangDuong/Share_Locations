import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  FileEdit
} from 'lucide-react'
import type { UserBlogItem } from '@/types/models/userProfile.model'

interface UserBlogsSectionProps {
  blogs: UserBlogItem[]
  onDeleteBlog?: (id: number) => Promise<void> | void
}

interface BlogCardProps {
  blog: UserBlogItem
  onEdit: (blog: UserBlogItem) => void
  onDelete?: (id: number) => void
}

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  onEdit,
  onDelete
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDelete) {
      onDelete(blog.id)
    }
  }

  const cover =
    blog.coverImageUrl ||
    blog.coverImg ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop'
  const isDraft = blog.status === 0

  return (
    <div
      onClick={() => onEdit(blog)}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer select-none"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={cover}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isDraft ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                <FileEdit className="w-3 h-3 text-amber-600" />
                <span>Bản nháp</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã xuất bản</span>
              </span>
            )}
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              title="Xóa bài viết"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h4 className="font-bold text-[15px] text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug tracking-tight">
          {blog.title}
        </h4>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    </div>
  )
}

export const UserBlogsSection: React.FC<UserBlogsSectionProps> = ({
  blogs,
  onDeleteBlog
}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const statusFilter: 'all' | 0 | 1 = (() => {
    if (statusParam === 'published' || statusParam === '1') return 1
    if (statusParam === 'draft' || statusParam === '0') return 0
    return 'all'
  })()

  const setStatusFilter = (val: 'all' | 0 | 1) => {
    const newParams = new URLSearchParams(searchParams)
    if (val === 'all') {
      newParams.delete('status')
    } else {
      const statusMap: Record<number, string> = {
        1: 'published',
        0: 'draft'
      }
      newParams.set('status', statusMap[val] || String(val))
    }
    setSearchParams(newParams, { replace: true })
  }

  const publishedCount = blogs.filter((b) => b.status === 1).length
  const draftCount = blogs.filter((b) => b.status === 0).length

  const filteredBlogs = blogs.filter((b) => {
    if (statusFilter === 'all') return true
    return b.status === statusFilter
  })

  const handleOpenCreateDoc = () => {
    navigate('/blog?mode=create')
  }

  const handleOpenEditDoc = (blog: UserBlogItem) => {
    navigate(`/blog?edit=${blog.id}`, { state: { editBlog: blog } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            Tất cả ({blogs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(1)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 1
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            <CheckCircle2 size={13} />
            <span>Đã xuất bản ({publishedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(0)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 0
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            <FileEdit size={13} />
            <span>Bản nháp ({draftCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateDoc}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Viết cẩm nang mới</span>
        </button>
      </div>

      {filteredBlogs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {statusFilter === 0
              ? 'Không có bản nháp nào'
              : statusFilter === 1
                ? 'Chưa có bài viết nào được xuất bản'
                : 'Chưa có bài viết nào'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Chia sẻ trải nghiệm hành trình, kinh nghiệm phượt hoặc lịch trình ăn chơi của bạn cùng cộng đồng LangThang.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateDoc}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Tạo bài viết mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onEdit={handleOpenEditDoc}
              onDelete={onDeleteBlog}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default UserBlogsSection
