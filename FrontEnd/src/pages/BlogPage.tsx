import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import type { BlogListItemDto, BlogDetailDto } from '@/types/models/blogArticle.model'
import { BlogFeedView, BlogReaderView, ArticleEditorView, type EditorOutputData } from '@/components/blog'
import { blogService } from '@/services/blogService'
import { placeService } from '@/services/placeService'
import { useAuth } from '@/context/AuthContext'
import type { LookupItemDto } from '@/types/models/place.model'

interface EditingArticleState {
  id?: number
  title: string
  summary: string
  category: string
  categoryId?: number
  coverImg: string
  content: string
  status?: number
}

export const BlogPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ id?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth()

  const [articles, setArticles] = useState<BlogListItemDto[]>([])
  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [detailedArticle, setDetailedArticle] = useState<BlogDetailDto | null>(null)
  const [articleLoading, setArticleLoading] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'feed' | 'reader' | 'editor'>('feed')
  const [editingArticleData, setEditingArticleData] = useState<EditingArticleState | null>(null)
  const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set())
  const [savedArticles, setSavedArticles] = useState<Set<number>>(new Set())
  const [totalPages, setTotalPages] = useState<number>(1)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2800)
  }

  useEffect(() => {
    let isMounted = true
    placeService.getFilterOptions()
      .then((res) => {
        if (isMounted && res.success && res.data?.categories && res.data.categories.length > 0) {
          const cats = res.data.categories
          setCategories(cats)
          setEditingArticleData((prev) => {
            if (prev && !prev.id && (!prev.category || !prev.categoryId)) {
              return {
                ...prev,
                category: prev.category || cats[0]?.name || '',
                categoryId: prev.categoryId || cats[0]?.id
              }
            }
            return prev
          })
        }
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [])

  const appliedFilters = useMemo(() => {
    const q = searchParams.get('q') || searchParams.get('keyword') || ''
    const categoryIdStr = searchParams.get('category') || searchParams.get('categoryId')
    const categoryId = categoryIdStr ? parseInt(categoryIdStr, 10) : undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const size = Math.max(1, parseInt(searchParams.get('size') || searchParams.get('pageSize') || '9', 10) || 9)

    return {
      search: q,
      categoryId,
      page,
      size
    }
  }, [searchParams])

  const fetchArticles = useCallback(async () => {
    try {
      const res = await blogService.getBlogs({
        keyword: appliedFilters.search.trim() || undefined,
        categoryId: appliedFilters.categoryId,
        page: appliedFilters.page,
        size: appliedFilters.size,
        pageSize: appliedFilters.size
      })
      if (res.success && Array.isArray(res.data)) {
        setArticles(res.data)
        if (res.meta) {
          setTotalPages(res.meta.totalPages || Math.max(1, Math.ceil(res.meta.totalElements / appliedFilters.size)))
        } else {
          setTotalPages(Math.max(1, Math.ceil(res.data.length / appliedFilters.size)))
        }
      } else {
        setArticles([])
        setTotalPages(1)
      }
    } catch {
      setArticles([])
      setTotalPages(1)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    const mode = searchParams.get('mode')
    const editId = searchParams.get('edit')
    const viewId = params.id || searchParams.get('id')

    if (mode === 'create') {
      if (authLoading) return
      if (!isAuthenticated || !currentUser) {
        showToast('Vui lòng đăng nhập để viết cẩm nang du lịch.')
        navigate('/login', { state: { from: '/blog?mode=create' } })
        return
      }
      setEditingArticleData({
        title: '',
        summary: '',
        category: categories[0]?.name || '',
        categoryId: categories[0]?.id,
        coverImg: '',
        content: ''
      })
      setViewMode('editor')
      setDetailedArticle(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (editId) {
      if (authLoading) return
      if (!isAuthenticated || !currentUser) {
        showToast('Vui lòng đăng nhập để chỉnh sửa cẩm nang.')
        navigate('/login', { state: { from: `/blog?edit=${editId}` } })
        return
      }
      const idNum = Number(editId)
      const passedBlog = (location.state as any)?.editBlog
      if (passedBlog && (passedBlog.id === idNum || !idNum)) {
        const matched = categories.find((c) => c.name === passedBlog.categoryName || c.name === passedBlog.category || c.id === passedBlog.categoryId)
        const catName = matched?.name || passedBlog.categoryName || passedBlog.category || categories[0]?.name || ''
        const catId = matched?.id || passedBlog.categoryId || categories[0]?.id
        setEditingArticleData({
          id: passedBlog.id,
          title: passedBlog.title || '',
          summary: passedBlog.excerpt || '',
          category: catName,
          categoryId: catId,
          coverImg: passedBlog.coverImageUrl || '',
          content: passedBlog.contentJSON || passedBlog.content || passedBlog.excerpt || '',
          status: passedBlog.status
        })
        setViewMode('editor')
        setDetailedArticle(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      const found = articles.find((a) => a.id === idNum)
      if (found) {
        const matched = categories.find((c) => c.name === found.category)
        setEditingArticleData({
          id: found.id,
          title: found.title || '',
          summary: found.excerpt || '',
          category: matched?.name || found.category || categories[0]?.name || '',
          categoryId: matched?.id || categories[0]?.id,
          coverImg: found.coverUrl || '',
          content: found.content || found.excerpt || '',
          status: 1
        })
        setViewMode('editor')
        setDetailedArticle(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      blogService.getMyBlogForEdit(editId)
        .then((res) => {
          if (res.success && res.data) {
            const d = res.data
            const matched = categories.find((c) => c.name === d.categoryName || c.id === d.categoryId)
            setEditingArticleData({
              id: d.id,
              title: d.title || '',
              summary: d.excerpt || '',
              category: matched?.name || d.categoryName || categories[0]?.name || '',
              categoryId: matched?.id || d.categoryId || categories[0]?.id,
              coverImg: d.coverImageUrl || '',
              content: d.contentJSON || d.excerpt || '',
              status: d.status
            })
            setViewMode('editor')
            setDetailedArticle(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        })
        .catch(() => {
          blogService.getBlogDetail(editId).then((res) => {
            if (res.success && res.data) {
              const d = res.data
              const matched = categories.find((c) => c.name === d.category)
              setEditingArticleData({
                id: d.id,
                title: d.title || '',
                summary: d.excerpt || '',
                category: matched?.name || d.category || categories[0]?.name || '',
                categoryId: matched?.id || categories[0]?.id,
                coverImg: d.coverUrl || '',
                content: d.content || d.excerpt || '',
                status: 1
              })
              setViewMode('editor')
              setDetailedArticle(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }).catch(() => { })
        })
      return
    }

    if (viewId) {
      setViewMode('reader')
      setArticleLoading(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      blogService.getBlogDetail(viewId)
        .then((res) => {
          if (res.success && res.data) {
            const idNum = Number(viewId)
            const fallbackItem = articles.find((a) => a.id === idNum || (a.slug && a.slug === viewId) || a.title === res.data.title)
            const views = res.data.viewCount || res.data.views || fallbackItem?.viewCount || fallbackItem?.views || 0
            setDetailedArticle({
              ...res.data,
              viewCount: views,
              views: views
            })
          }
        })
        .catch(() => {
          const idNum = Number(viewId)
          const fallback = articles.find((a) => a.id === idNum || (a.slug && a.slug === viewId))
          if (fallback) setDetailedArticle(fallback)
        })
        .finally(() => {
          setArticleLoading(false)
        })
      return
    }

    if (!mode && !editId && !viewId) {
      setViewMode('feed')
      setDetailedArticle(null)
    }
  }, [searchParams, params.id, location.state, articles, categories, isAuthenticated, currentUser, authLoading])

  const handleSearchChange = (q: string) => {
    const p = new URLSearchParams(searchParams)
    if (q.trim()) {
      p.set('q', q.trim())
    } else {
      p.delete('q')
      p.delete('keyword')
    }
    setSearchParams(p)
  }

  const handleClearSearch = () => {
    const p = new URLSearchParams(searchParams)
    p.delete('q')
    p.delete('keyword')
    setSearchParams(p)
  }

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams)
    p.set('page', String(newPage))
    setSearchParams(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    const p = new URLSearchParams(searchParams)
    p.set('size', String(newSize))
    p.set('page', '1')
    setSearchParams(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectCategory = (catId?: number | null) => {
    const p = new URLSearchParams(searchParams)
    if (catId) {
      p.set('category', String(catId))
    } else {
      p.delete('category')
      p.delete('categoryId')
    }
    p.set('page', '1')
    setSearchParams(p)
  }

  const handleResetFilters = () => {
    setSearchParams({})
  }

  const handleOpenArticle = (article: BlogListItemDto) => {
    navigate(`/blog/${article.id}`)
  }

  const handleCreateArticle = () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Vui lòng đăng nhập để viết cẩm nang du lịch.')
      navigate('/login', { state: { from: '/blog?mode=create' } })
      return
    }
    navigate('/blog?mode=create')
  }

  const handleCancelEditor = () => {
    navigate('/blog')
  }

  const handleSaveArticle = async (output: EditorOutputData) => {
    try {
      if (editingArticleData?.id) {
        const res = await blogService.updateBlog(editingArticleData.id, {
          title: output.title,
          categoryId: output.categoryId,
          coverImageUrl: output.coverImg,
          excerpt: output.summary,
          contentJSON: output.contentJSON,
          readTimeMinutes: output.readTimeMinutes,
          status: output.status
        })
        if (res.success) {
          showToast(
            output.status === 2
              ? 'Đã gửi bài viết chờ duyệt!'
              : output.status === 0
                ? 'Đã lưu bản nháp thành công!'
                : 'Cập nhật bài viết thành công!'
          )
          fetchArticles()
          navigate('/blog')
        } else {
          showToast('Lưu thất bại. Vui lòng thử lại.')
        }
      } else {
        const res = await blogService.createBlog({
          title: output.title,
          categoryId: output.categoryId,
          coverImageUrl: output.coverImg,
          excerpt: output.summary,
          contentJSON: output.contentJSON,
          readTimeMinutes: output.readTimeMinutes,
          status: output.status
        })
        if (res.success) {
          showToast(
            output.status === 2
              ? 'Đã gửi bài viết chờ duyệt!'
              : output.status === 0
                ? 'Đã lưu bản nháp thành công!'
                : 'Xuất bản bài viết thành công!'
          )
          fetchArticles()
          navigate('/blog')
        } else {
          showToast('Tạo bài viết thất bại. Vui lòng thử lại.')
        }
      }
    } catch {
      showToast('Có lỗi xảy ra khi lưu bài viết.')
    }
  }

  const handleToggleLike = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!isAuthenticated || !currentUser) {
      showToast('Vui lòng đăng nhập để thích bài viết.')
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    try {
      const res = await blogService.toggleLike(id)
      if (res.success) {
        setLikedArticles((prev) => {
          const next = new Set(prev)
          if (res.data?.isLiked) {
            next.add(id)
          } else {
            next.delete(id)
          }
          return next
        })
      }
    } catch { }
  }

  const handleToggleSave = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!isAuthenticated || !currentUser) {
      showToast('Vui lòng đăng nhập để lưu bài viết.')
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setSavedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        showToast('Đã bỏ lưu bài viết.')
      } else {
        next.add(id)
        showToast('Đã lưu bài viết vào mục yêu thích!')
      }
      return next
    })
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-900 text-white rounded-xl shadow-lg animate-bounce text-xs font-bold">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {viewMode === 'editor' && (
        <ArticleEditorView
          key={editingArticleData?.id || 'new'}
          articleId={editingArticleData?.id}
          initialTitle={editingArticleData?.title || ''}
          initialSummary={editingArticleData?.summary || ''}
          initialCategory={editingArticleData?.category || categories[0]?.name || ''}
          initialCategoryId={editingArticleData?.categoryId || categories[0]?.id}
          initialCoverImg={editingArticleData?.coverImg || ''}
          initialContent={editingArticleData?.content || ''}
          initialStatus={editingArticleData?.status}
          availableCategories={categories}
          onSave={handleSaveArticle}
          onSaveDraft={handleSaveArticle}
          onPublish={handleSaveArticle}
          onCancel={handleCancelEditor}
        />
      )}

      {viewMode === 'reader' && (
        <div>
          {articleLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!articleLoading && detailedArticle && (
            <BlogReaderView
              article={detailedArticle}
              allArticles={articles}
              likedArticles={likedArticles}
              savedArticles={savedArticles}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onSelectArticle={(art) => navigate(`/blog/${art.id}`)}
              onSelectPlaceByName={(name) => navigate(`/explore?q=${encodeURIComponent(name)}`)}
              onNavigateToItinerary={() => navigate('/itinerary')}
            />
          )}
          {!articleLoading && !detailedArticle && (
            <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto my-12 p-8">
              <h3 className="text-base font-bold text-slate-800">
                Không tìm thấy nội dung bài viết
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Bài viết có thể đã bị xóa hoặc không còn khả dụng.
              </p>
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="mt-4 px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'feed' && (
        <BlogFeedView
          articles={articles}
          categories={categories}
          selectedCategoryId={appliedFilters.categoryId}
          searchQuery={appliedFilters.search}
          currentPage={appliedFilters.page}
          pageSize={appliedFilters.size}
          totalPages={totalPages}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onSelectCategory={handleSelectCategory}
          onResetFilters={handleResetFilters}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onOpenArticle={handleOpenArticle}
          onCreateArticle={handleCreateArticle}
        />
      )}
    </div>
  )
}

export default BlogPage
