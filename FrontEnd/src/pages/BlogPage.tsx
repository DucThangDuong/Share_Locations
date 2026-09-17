import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import type { BlogListItemDto, BlogDetailDto } from '@/types/models/blogArticle.model'
import { BlogFeedView, BlogReaderView, ArticleEditorView, type EditorOutputData } from '@/components/blog'
import { blogService } from '@/services/blogService'
import { placeService } from '@/services/placeService'
import type { LookupItemDto, RegionLookupDto } from '@/types/models/place.model'

interface EditingArticleState {
  id?: number
  title: string
  summary: string
  category: string
  categoryId?: number
  coverImg: string
  content: string
}

export const BlogPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()

  const [articles, setArticles] = useState<BlogListItemDto[]>([])
  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [regions, setRegions] = useState<RegionLookupDto[]>([])
  const [detailedArticle, setDetailedArticle] = useState<BlogDetailDto | null>(null)
  const [articleLoading, setArticleLoading] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'feed' | 'reader' | 'editor'>('feed')
  const [editingArticleData, setEditingArticleData] = useState<EditingArticleState | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set())
  const [savedArticles, setSavedArticles] = useState<Set<number>>(new Set())
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2800)
  }

  useEffect(() => {
    let isMounted = true
    placeService.getFilterOptions()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          if (res.data.categories) setCategories(res.data.categories)
          if (res.data.regions) setRegions(res.data.regions)
        }
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [])

  const fetchArticles = useCallback(async () => {
    try {
      const res = await blogService.getBlogs({
        keyword: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: 1,
        pageSize: 50
      })
      if (res.success && Array.isArray(res.data)) {
        setArticles(res.data)
      } else {
        setArticles([])
      }
    } catch {
      setArticles([])
    }
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    const mode = searchParams.get('mode')
    const editId = searchParams.get('edit')
    const viewId = params.id || searchParams.get('id')

    if (mode === 'create') {
      setEditingArticleData({
        title: '',
        summary: '',
        category: categories[0]?.name || 'Di tích lịch sử - Văn hóa',
        categoryId: categories[0]?.id || 1,
        coverImg: '',
        content: ''
      })
      setViewMode('editor')
      setDetailedArticle(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (editId) {
      const idNum = Number(editId)
      const passedBlog = (location.state as any)?.editBlog
      if (passedBlog && (passedBlog.id === idNum || !idNum)) {
        const catName = passedBlog.categoryName || passedBlog.category || 'Di tích lịch sử - Văn hóa'
        setEditingArticleData({
          id: passedBlog.id,
          title: passedBlog.title || '',
          summary: passedBlog.excerpt || '',
          category: catName,
          categoryId: passedBlog.categoryId || 1,
          coverImg: passedBlog.coverImageUrl || '',
          content: passedBlog.contentJSON || passedBlog.content || passedBlog.excerpt || ''
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
          category: matched?.name || found.category,
          categoryId: matched?.id || 1,
          coverImg: found.coverUrl || '',
          content: found.content || found.excerpt || ''
        })
        setViewMode('editor')
        setDetailedArticle(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      blogService.getBlogDetail(editId).then((res) => {
        if (res.success && res.data) {
          const d = res.data
          const matched = categories.find((c) => c.name === d.category)
          setEditingArticleData({
            id: d.id,
            title: d.title || '',
            summary: d.excerpt || '',
            category: matched?.name || d.category || 'Di tích lịch sử - Văn hóa',
            categoryId: matched?.id || 1,
            coverImg: d.coverUrl || '',
            content: d.content || d.excerpt || ''
          })
          setViewMode('editor')
          setDetailedArticle(null)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }).catch(() => { })
      return
    }

    if (viewId) {
      setViewMode('reader')
      setArticleLoading(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      blogService.getBlogDetail(viewId)
        .then((res) => {
          if (res.success && res.data) {
            setDetailedArticle(res.data)
          }
        })
        .catch(() => {
          const idNum = Number(viewId)
          const fallback = articles.find((a) => a.id === idNum)
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
  }, [searchParams, params.id, location.state, articles, categories])

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (selectedCategory && art.category !== selectedCategory) {
        return false
      }
      if (selectedProvince) {
        const text = `${art.title} ${art.excerpt || ''} ${art.content || ''}`.toLowerCase()
        if (!text.includes(selectedProvince.toLowerCase())) {
          return false
        }
      } else if (selectedRegion) {
        const found = regions.find((r) => r.name === selectedRegion)
        const provNames = found ? found.provinces.map((p) => p.name.toLowerCase()) : []
        const text = `${art.title} ${art.excerpt || ''} ${art.content || ''} ${art.category || ''}`.toLowerCase()
        const matchRegion = text.includes(selectedRegion.toLowerCase()) || provNames.some((p) => text.includes(p))
        if (!matchRegion) return false
      }
      return true
    })
  }, [articles, selectedCategory, selectedProvince, selectedRegion, regions])

  const handleOpenArticle = (article: BlogListItemDto) => {
    navigate(`/blog/${article.id}`)
  }

  const handleCreateArticle = () => {
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
          showToast('Cập nhật bài viết thành công!')
          fetchArticles()
          navigate('/blog')
        } else {
          showToast('Cập nhật thất bại. Vui lòng thử lại.')
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
          showToast('Xuất bản bài viết thành công!')
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

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedRegion(null)
    setSelectedProvince(null)
    setSelectedCategory(null)
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
          initialCategory={editingArticleData?.category || 'Di tích lịch sử - Văn hóa'}
          initialCategoryId={editingArticleData?.categoryId}
          initialCoverImg={editingArticleData?.coverImg || ''}
          initialContent={editingArticleData?.content || ''}
          availableCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
          onSave={handleSaveArticle}
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
                Quay lại danh sách cẩm nang
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'feed' && (
        <BlogFeedView
          articles={filteredArticles}
          categories={categories}
          regions={regions}
          searchQuery={searchQuery}
          selectedRegion={selectedRegion}
          selectedProvince={selectedProvince}
          selectedCategory={selectedCategory}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          onSelectRegion={setSelectedRegion}
          onSelectProvince={setSelectedProvince}
          onSelectCategory={setSelectedCategory}
          onResetFilters={handleResetFilters}
          onOpenArticle={handleOpenArticle}
          onCreateArticle={handleCreateArticle}
        />
      )}
    </div>
  )
}

export default BlogPage
