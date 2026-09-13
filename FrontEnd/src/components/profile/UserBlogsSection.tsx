import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  X
} from 'lucide-react'
import type { UserBlogItem } from '@/types/models/userProfile.model'
import type { CreateBlogRequest } from '@/services/blogService'

interface UserBlogsSectionProps {
  blogs: UserBlogItem[]
  onAddBlog?: (newBlog: CreateBlogRequest) => Promise<void> | void
  onDeleteBlog?: (id: number) => Promise<void> | void
}

interface BlogCardProps {
  blog: UserBlogItem
  onPreview: (blog: UserBlogItem) => void
  onDelete?: (id: number) => void
  renderStatusBadge: (status: 0 | 1) => React.ReactNode
}

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  onPreview,
  onDelete,
  renderStatusBadge
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDelete) {
      onDelete(blog.id)
    }
  }

  const cover = blog.coverImageUrl || blog.coverImg || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop'
  const categoryName = blog.categoryName || blog.category || 'Cẩm nang du lịch'
  const views = blog.viewCount ?? blog.viewsCount ?? 0

  return (
    <div
      onClick={() => onPreview(blog)}
      className="group flex flex-col cursor-pointer select-none transition-all duration-300"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
        <img
          src={cover}
          alt={blog.title}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
      </div>

      <div className="pt-3 flex flex-col space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-indigo-900 transition-colors line-clamp-2 leading-snug tracking-tight flex-1">
            {blog.title}
          </h4>
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              title="Xóa bài viết"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {renderStatusBadge(blog.status)}
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {categoryName}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>

          {blog.status === 1 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <Eye className="w-3 h-3 text-slate-400" />
              <span>{views} xem</span>
            </span>
          )}
        </div>

        {blog.excerpt && (
          <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
            {blog.excerpt}
          </p>
        )}
      </div>
    </div>
  )
}

export const UserBlogsSection: React.FC<UserBlogsSectionProps> = ({
  blogs,
  onAddBlog,
  onDeleteBlog
}) => {
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

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<UserBlogItem | null>(null)

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<number>(1)
  const [coverImg, setCoverImg] = useState(
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop'
  )
  const [excerpt, setExcerpt] = useState('')
  const [isDraft, setIsDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredBlogs = blogs.filter((b) => {
    if (statusFilter === 'all') return true
    return b.status === statusFilter
  })

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !excerpt.trim()) return

    setIsSubmitting(true)
    try {
      if (onAddBlog) {
        await onAddBlog({
          title: title.trim(),
          categoryId,
          coverImageUrl: coverImg,
          excerpt: excerpt.trim(),
          contentJSON: JSON.stringify({ summary: excerpt.trim() }),
          readTimeMinutes: Math.max(1, Math.ceil(excerpt.length / 200)),
          status: isDraft ? 0 : 1
        })
      }

      setTitle('')
      setExcerpt('')
      setIsDraft(false)
      setIsWriteModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (status: 0 | 1) => {
    switch (status) {
      case 1:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Đã xuất bản</span>
          </span>
        )
      case 0:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1 shrink-0">
            <FileText className="w-3 h-3 text-slate-500" />
            <span>Bản nháp</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Bài viết Blog của tôi ({blogs.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các bài viết chia sẻ cẩm nang, kinh nghiệm du lịch và bản nháp cá nhân.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Viết bài blog mới</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          Tất cả ({blogs.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(1)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 1
            ? 'bg-emerald-800 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          <CheckCircle2 size={12} />
          <span>Đã xuất bản ({blogs.filter((b) => b.status === 1).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(0)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 0
            ? 'bg-slate-800 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
        >
          <FileText size={12} />
          <span>Bản nháp ({blogs.filter((b) => b.status === 0).length})</span>
        </button>
      </div>

      {filteredBlogs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Không có bài viết nào
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Chia sẻ câu chuyện hành trình, lịch trình ăn chơi hoặc bí kíp du lịch của bạn cùng cộng đồng LangThang.
          </p>
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Viết bài blog đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onPreview={(b) => setPreviewArticle(b)}
              onDelete={onDeleteBlog}
              renderStatusBadge={renderStatusBadge}
            />
          ))}
        </div>
      )}

      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Viết bài blog / cẩm nang mới</span>
              </h3>
              <button type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề bài viết <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kinh nghiệm phượt xe máy đèo Mã Pí Lèng..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên mục</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-700 cursor-pointer"
                  >
                    <option value={1}>Cẩm nang du lịch</option>
                    <option value={2}>Gợi ý ẩm thực</option>
                    <option value={3}>Ẩm thực đường phố</option>
                    <option value={4}>Kinh nghiệm phượt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh bìa (URL)</label>
                  <input
                    type="url"
                    value={coverImg}
                    onChange={(e) => setCoverImg(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đoạn tóm tắt mở đầu <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Chia sẻ ngắn gọn nội dung và điểm thú vị của bài viết..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-700"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                    className="rounded text-indigo-700 focus:ring-indigo-700"
                  />
                  <span>Lưu dạng Bản nháp</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWriteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : isDraft ? 'Lưu bản nháp' : 'Xuất bản bài viết'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {previewArticle.categoryName || previewArticle.category || 'Cẩm nang'}
                </span>
                {renderStatusBadge(previewArticle.status)}
              </div>
              <button type="button"
                onClick={() => setPreviewArticle(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square sm:aspect-16/9 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={previewArticle.coverImageUrl || previewArticle.coverImg || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop'}
                alt={previewArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {previewArticle.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              {previewArticle.excerpt}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button type="button"
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 cursor-pointer"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
