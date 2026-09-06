import { useState, useEffect } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { blogService } from '@/services/blogService'
import { BlogFeaturedCard } from '@/components/blog/BlogFeaturedCard'
import { BlogCard } from '@/components/blog/BlogCard'
import { BlogDetailModal } from '@/components/blog/BlogDetailModal'
import type { BlogListItemDto, BlogDetailDto } from '@/types/models/place.model'

const CATEGORIES = ['Tất cả', 'Kinh nghiệm thực tế', 'Tọa độ check-in', 'Mẹo du lịch', 'Văn hóa & Lễ hội']

export const BlogPage = () => {
  const [blogs, setBlogs] = useState<BlogListItemDto[]>([])
  const [featuredPost, setFeaturedPost] = useState<BlogListItemDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeArticle, setActiveArticle] = useState<BlogDetailDto | null>(null)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await blogService.getFeaturedBlog()
        if (res.success && res.data) {
          setFeaturedPost(res.data)
        }
      } catch {
        setFeaturedPost(null)
      }
    }
    fetchFeatured()
  }, [])

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true)
      try {
        const res = await blogService.getBlogs({
          category: selectedCategory !== 'Tất cả' ? selectedCategory : undefined,
          keyword: searchQuery.trim() || undefined
        })
        if (res.success && res.data) {
          setBlogs(res.data)
        }
      } catch {
        setBlogs([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchBlogs, 300)
    return () => clearTimeout(timeoutId)
  }, [selectedCategory, searchQuery])

  const handleOpenArticle = async (post: BlogListItemDto) => {
    try {
      const res = await blogService.getBlogDetail(post.slug || post.id)
      if (res.success && res.data) {
        setActiveArticle(res.data)
      } else {
        setActiveArticle({
          ...post,
          relatedPosts: []
        })
      }
    } catch {
      setActiveArticle({
        ...post,
        relatedPosts: []
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="relative bg-emerald-900 text-white overflow-hidden py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-800/80 border border-emerald-700 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Cẩm Nang & Kinh Nghiệm</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Tạp Chí Du Lịch & Mẹo Bỏ Túi
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Chia sẻ chân thực về những cung đường, góc sống ảo tuyệt đẹp, kinh nghiệm đặt vé và văn hóa bản địa từ cộng đồng phượt thủ.
          </p>

          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài viết, mẹo du lịch, địa phương..."
                className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-sm rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        {featuredPost && selectedCategory === 'Tất cả' && !searchQuery && (
          <BlogFeaturedCard post={featuredPost} onRead={handleOpenArticle} />
        )}

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory === 'Tất cả' ? 'Bài Viết Mới Nhất' : `Chuyên mục: ${selectedCategory}`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg" />
                  <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-md w-full" />
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">Không tìm thấy bài viết nào.</p>
              <p className="text-xs text-gray-400 mt-1">Hãy thử tìm kiếm với từ khóa khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((post) => (
                <BlogCard key={post.id} post={post} onRead={handleOpenArticle} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BlogDetailModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
        onSelectRelated={handleOpenArticle}
      />
    </div>
  )
}
