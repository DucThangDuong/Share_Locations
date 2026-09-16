import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import type { BlogArticleItem } from '@/types/models/blogArticle.model'
import { BlogFeedView, BlogReaderView, ArticleEditorView, type EditorOutputData } from '@/components/blog'
import { useAuth } from '@/context/AuthContext'
import { blogService } from '@/services/blogService'
import type { BlogListItemDto } from '@/types/models/place.model'

type CategoryOption = 'Ẩm thực' | 'Kinh nghiệm' | 'Khám phá' | 'Lịch trình' | 'Văn hóa'

const normalizeCategory = (cat?: string | number): CategoryOption => {
  if (!cat) return 'Khám phá'
  if (typeof cat === 'number') {
    const idMap: Record<number, CategoryOption> = {
      1: 'Khám phá',
      2: 'Ẩm thực',
      3: 'Ẩm thực',
      4: 'Kinh nghiệm'
    }
    return idMap[cat] || 'Khám phá'
  }
  const str = String(cat).toLowerCase()
  if (str.includes('ẩm thực') || str.includes('ăn')) return 'Ẩm thực'
  if (str.includes('kinh nghiệm') || str.includes('mẹo') || str.includes('phượt')) return 'Kinh nghiệm'
  if (str.includes('lịch trình') || str.includes('tour')) return 'Lịch trình'
  if (str.includes('văn hóa') || str.includes('lịch sử')) return 'Văn hóa'
  return 'Khám phá'
}

const categoryToId = (cat?: string): number => {
  switch (cat) {
    case 'Ẩm thực':
      return 2
    case 'Kinh nghiệm':
      return 4
    case 'Lịch trình':
      return 1
    case 'Văn hóa':
      return 1
    case 'Khám phá':
    default:
      return 1
  }
}

interface EditingArticleState {
  id?: number
  title: string
  summary: string
  category: CategoryOption
  coverImg: string
  content: string
}

export const BlogPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  const [articles, setArticles] = useState<BlogArticleItem[]>([])
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'feed' | 'reader' | 'editor'>('feed')
  const [editingArticleData, setEditingArticleData] = useState<EditingArticleState | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set())
  const [savedArticles, setSavedArticles] = useState<Set<number>>(new Set([1]))
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2800)
  }

  const mapBlogDtoToArticle = (dto: BlogListItemDto): BlogArticleItem => ({
    id: dto.id,
    slug: dto.slug,
    categoryId: 1,
    title: dto.title,
    subtitle: dto.excerpt || dto.title,
    excerpt: dto.excerpt || dto.title,
    category: (dto.category as BlogArticleItem['category']) || 'Ẩm thực',
    coverImg: dto.coverUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop',
    authorName: dto.author?.name || 'Tác giả',
    authorRole: dto.author?.role || 'Blogger',
    authorAvatar: dto.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    publishDate: dto.publishedAt ? new Date(dto.publishedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
    readTime: dto.readTime || '5 phút đọc',
    readTimeMinutes: 5,
    viewsCount: 120,
    likesCount: 15,
    isFeatured: dto.featured,
    contentJSON: dto.content,
    htmlContent: dto.content,
    sections: [
      {
        id: `sec-${dto.id}-1`,
        heading: dto.title,
        content: dto.excerpt || dto.content
      }
    ]
  })

  const fetchArticles = useCallback(async () => {
    try {
      const res = await blogService.getBlogs({
        keyword: searchQuery || undefined,
        page: 1,
        pageSize: 30
      })
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(mapBlogDtoToArticle)
        setArticles(mapped)
      } else {
        setArticles([])
      }
    } catch {
      setArticles([])
    }
  }, [searchQuery])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    const mode = searchParams.get('mode')
    const editId = searchParams.get('edit')
    const viewId = searchParams.get('id')

    if (mode === 'create') {
      setEditingArticleData({
        title: '',
        summary: '',
        category: 'Khám phá',
        coverImg: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=600&fit=crop&auto=format',
        content: ''
      })
      setViewMode('editor')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (editId) {
      const idNum = Number(editId)
      const passedBlog = (location.state as any)?.editBlog
      if (passedBlog && (passedBlog.id === idNum || !idNum)) {
        setEditingArticleData({
          id: passedBlog.id,
          title: passedBlog.title || '',
          summary: passedBlog.excerpt || passedBlog.subtitle || '',
          category: normalizeCategory(passedBlog.categoryName || passedBlog.category || passedBlog.categoryId),
          coverImg: passedBlog.coverImageUrl || passedBlog.coverImg || '',
          content: passedBlog.contentJSON || passedBlog.content || passedBlog.htmlContent || passedBlog.excerpt || ''
        })
        setViewMode('editor')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      const found = articles.find((a) => a.id === idNum)
      if (found) {
        setEditingArticleData({
          id: found.id,
          title: found.title || '',
          summary: found.excerpt || found.subtitle || '',
          category: normalizeCategory(found.category),
          coverImg: found.coverImg || '',
          content: found.contentJSON || found.htmlContent || found.excerpt || ''
        })
        setViewMode('editor')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      blogService.getBlogDetail(editId).then((res) => {
        if (res.success && res.data) {
          const d = res.data
          setEditingArticleData({
            id: d.id,
            title: d.title || '',
            summary: d.excerpt || '',
            category: normalizeCategory(d.category),
            coverImg: d.coverUrl || '',
            content: d.content || d.excerpt || ''
          })
          setViewMode('editor')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }).catch(() => { })
      return
    }

    if (viewId) {
      const idNum = Number(viewId)
      setSelectedArticleId(idNum)
      setViewMode('reader')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (!mode && !editId && !viewId) {
      if (viewMode === 'editor') {
        setViewMode('feed')
      }
    }
  }, [searchParams, location.state, articles])

  const selectedArticle =
    articles.find((a) => a.id === selectedArticleId) || articles[0]

  const handleOpenArticle = (article: BlogArticleItem) => {
    setSelectedArticleId(article.id)
    setViewMode('reader')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToFeed = () => {
    setEditingArticleData(null)
    setSearchParams({})
    setViewMode('feed')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleLike = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await blogService.toggleLike(id)
      if (res.success && res.data) {
        if (res.data.isLiked) {
          setLikedArticles((prev) => new Set(prev).add(id))
          showToast('Đã thích bài viết!')
        } else {
          setLikedArticles((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          showToast('Đã bỏ thích bài viết.')
        }
        return
      }
    } catch {
    }

    setLikedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        showToast('Đã bỏ thích bài viết.')
      } else {
        next.add(id)
        showToast('Đã thích bài viết!')
      }
      return next
    })
  }

  const toggleSave = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSavedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        showToast('Đã bỏ lưu bài viết khỏi bộ sưu tập.')
      } else {
        next.add(id)
        showToast('Đã lưu bài viết vào cẩm nang!')
      }
      return next
    })
  }

  const handleShare = (_article: BlogArticleItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('Đã sao chép liên kết bài viết!')
    } else {
      showToast('Đã sẵn sàng chia sẻ bài viết!')
    }
  }

  const handleSelectPlaceByName = (name: string) => {
    navigate(`/explore?q=${encodeURIComponent(name)}`)
  }

  const handlePublishArticle = async (data: EditorOutputData) => {
    const catId = categoryToId(data.category)
    const contentStr = typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
    const readTimeEst = Math.max(1, Math.ceil((data.summary?.length || 500) / 200))

    try {
      if (editingArticleData?.id) {
        await blogService.updateBlog(editingArticleData.id, {
          title: data.title,
          categoryId: catId,
          coverImageUrl: data.coverImg,
          excerpt: data.summary || data.title,
          contentJSON: contentStr,
          readTimeMinutes: readTimeEst,
          status: 1
        })
        showToast('Đã cập nhật và xuất bản bài viết thành công!')
      } else {
        await blogService.createBlog({
          title: data.title,
          categoryId: catId,
          coverImageUrl: data.coverImg,
          excerpt: data.summary || data.title,
          contentJSON: contentStr,
          readTimeMinutes: readTimeEst,
          status: 1
        })
        showToast('Đã xuất bản cẩm nang du lịch thành công!')
      }
    } catch {
      showToast('Đã lưu cẩm nang thành công!')
    }

    await fetchArticles()
    setEditingArticleData(null)
    setSearchParams({})
    setViewMode('feed')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveDraftArticle = async (data: EditorOutputData) => {
    const catId = categoryToId(data.category)
    const contentStr = typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
    const readTimeEst = Math.max(1, Math.ceil((data.summary?.length || 500) / 200))

    try {
      if (editingArticleData?.id) {
        await blogService.updateBlog(editingArticleData.id, {
          title: data.title,
          categoryId: catId,
          coverImageUrl: data.coverImg,
          excerpt: data.summary || data.title,
          contentJSON: contentStr,
          readTimeMinutes: readTimeEst,
          status: 0
        })
        showToast(`Đã lưu bản nháp "${data.title}"`)
      } else {
        await blogService.createBlog({
          title: data.title,
          categoryId: catId,
          coverImageUrl: data.coverImg,
          excerpt: data.summary || data.title,
          contentJSON: contentStr,
          readTimeMinutes: readTimeEst,
          status: 0
        })
        showToast(`Đã lưu bản nháp "${data.title}"`)
      }
    } catch {
      showToast(`Đã lưu bản nháp "${data.title}"`)
    }

    await fetchArticles()
    setEditingArticleData(null)
    navigate('/profile?tab=blogs')
  }

  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.toLowerCase().trim()
    return (
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q) ||
      a.authorName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased pb-24 font-sans">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {viewMode === 'feed' ? (
        <BlogFeedView
          articles={filteredArticles}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          onOpenArticle={handleOpenArticle}
          onCreateArticle={() => {
            navigate('/blog?mode=create')
          }}
        />
      ) : viewMode === 'editor' ? (
        <ArticleEditorView
          initialTitle={editingArticleData?.title || ''}
          initialSummary={editingArticleData?.summary || ''}
          initialCategory={editingArticleData?.category || 'Khám phá'}
          initialCoverImg={editingArticleData?.coverImg || undefined}
          initialContent={editingArticleData?.content || ''}
          draftId={editingArticleData?.id ? String(editingArticleData.id) : undefined}
          authorName={user?.fullName || 'Tác giả'}
          authorAvatar={user?.avatarUrl}
          onBack={handleBackToFeed}
          onPublish={handlePublishArticle}
          onSaveDraft={handleSaveDraftArticle}
          onToast={showToast}
        />
      ) : (
        <BlogReaderView
          article={selectedArticle}
          allArticles={articles}
          likedArticles={likedArticles}
          savedArticles={savedArticles}
          onBack={handleBackToFeed}
          onToggleLike={toggleLike}
          onToggleSave={toggleSave}
          onShare={handleShare}
          onSelectArticle={handleOpenArticle}
          onSelectPlaceByName={handleSelectPlaceByName}
          onNavigateToItinerary={() => navigate('/itinerary')}
        />
      )}
    </div>
  )
}

export default BlogPage
