import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flag,
  Eye,
  Share2,
  Calendar,
  Image,
  Check
} from 'lucide-react'
import { ReportModal } from '@/components/report/ReportModal'
import type { BlogDetailDto, BlogListItemDto } from '@/types/models/blogArticle.model'
import { BlogTableOfContents } from './BlogTableOfContents'
import { convertRawContentToHtml, extractHeadingsAndProcessHtml } from '@/utils/contentConverter'
import { navigateToAuthorProfile } from '@/utils/authorNavigation'
import {
  formatEditorialDate,
  formatViewsCount
} from './blogEnhancer'

interface BlogReaderViewProps {
  article: BlogDetailDto
  allArticles?: BlogListItemDto[]
  likedArticles?: Set<number>
  savedArticles?: Set<number>
  onToggleLike?: (id: number, e?: React.MouseEvent) => void
  onToggleSave?: (id: number, e?: React.MouseEvent) => void
  onShare?: (article: BlogDetailDto, e?: React.MouseEvent) => void
  onSelectArticle?: (article: BlogListItemDto) => void
  onSelectPlaceByName?: (name: string, province: string) => void
  onNavigateToItinerary?: () => void
}

export const BlogReaderView: React.FC<BlogReaderViewProps> = ({
  article,
  allArticles = [],
  savedArticles: _savedArticles,
  onToggleSave: _onToggleSave,
  onShare
}) => {
  const navigate = useNavigate()
  const [readProgress, setReadProgress] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const authorName = article.authorName || article.author?.name || 'Tác giả'
  const authorAvatar = article.authorAvatar || article.author?.avatar || null
  const coverImage = article.coverImageUrl || article.coverUrl || article.coverImg
  const summaryText = article.summary || article.excerpt
  const categoryName = article.categoryName || article.category || 'Cẩm nang du lịch'

  const formattedDate = formatEditorialDate(article.publishedAt || article.createdAt)
  const matchedInList = allArticles.find(
    (a) => a.id === article.id || (article.slug && a.slug === article.slug) || a.title === article.title
  )
  const effectiveViews = (article.viewCount || article.views) || (matchedInList?.viewCount || matchedInList?.views) || 0
  const { formatted: formattedViews } = formatViewsCount(effectiveViews)

  const handleNavigateToAuthor = (e?: React.MouseEvent) => {
    navigateToAuthorProfile(navigate, article.author, article, e)
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(article, e)
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2400)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total > 0) {
        const current = window.scrollY
        setReadProgress(Math.min(100, Math.round((current / total) * 100)))
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { processedHtml, extractedHeadings } = useMemo(() => {
    const raw = article.content || ''
    const convertedHtml = convertRawContentToHtml(raw)
    return extractHeadingsAndProcessHtml(convertedHtml)
  }, [article.content])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      <div
        className="fixed top-0 left-0 h-1 bg-emerald-600 z-50 transition-all duration-100"
        style={{ width: `${readProgress}%` }}
      />


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-8 min-w-0">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-100/60">
                <span>Danh mục: {categoryName}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {article.title}
              </h1>

              {summaryText && (
                <div className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal bg-slate-50 p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  {summaryText}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200">
              <div
                onClick={handleNavigateToAuthor}
                className="flex items-center gap-3.5 cursor-pointer group/author transition-opacity hover:opacity-95 w-fit"
                title={`Xem trang cá nhân của ${authorName}`}
              >
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 group-hover/author:ring-2 group-hover/author:ring-emerald-500/50 transition-all shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm group-hover/author:ring-2 group-hover/author:ring-emerald-500/50 transition-all shadow-2xs">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover/author:text-emerald-800 transition-colors">
                    {authorName}
                  </h4>
                  {formattedDate && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 font-medium">
                      <Calendar size={11} className="text-slate-400" />
                      <span>Đăng ngày {formattedDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-xl border border-slate-200/80 mr-1">
                  <Eye size={13} className="text-slate-400" />
                  <span>{formattedViews}</span>
                </div>

                <button
                  type="button"
                  onClick={handleShareClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                  title="Sao chép liên kết chia sẻ"
                >
                  {shareCopied ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-700">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} className="text-slate-500" />
                      <span>Chia sẻ</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200/90 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/60 transition-all cursor-pointer shadow-2xs"
                  title="Báo cáo bài viết"
                >
                  <Flag size={14} className="text-rose-500" />
                  <span>Báo cáo bài viết</span>
                </button>
              </div>
            </div>

            {coverImage ? (
              <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
                <img
                  src={coverImage}
                  alt={article.title}
                  className="w-full max-h-[500px] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.no-img-placeholder')) {
                      const fallback = document.createElement('div')
                      fallback.className = 'no-img-placeholder w-full py-16 flex items-center justify-center bg-slate-50 text-slate-300 select-none'
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 py-16 flex items-center justify-center text-slate-300 select-none">
                <Image size={48} className="text-slate-300" />
              </div>
            )}

            <div className="space-y-8 text-base text-slate-800 leading-relaxed font-normal pt-2">
              {processedHtml && (
                <div
                  className="tiptap-content prose prose-slate max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              )}
            </div>

          </div>

          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            {extractedHeadings && extractedHeadings.length > 0 && (
              <BlogTableOfContents
                headings={extractedHeadings}
                articleTitle={article.title}
                onScrollToSection={scrollToSection}
              />
            )}
          </aside>
        </div>
      </main>

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          initialTarget={{
            targetType: 'blog',
            targetId: article.id,
            targetTitle: article.title,
            targetSubtitle: `Tác giả: ${authorName} • ${categoryName}`,
            targetContent: summaryText || article.content?.slice(0, 200),
            targetAuthor: authorName,
          }}
        />
      )}
    </div>
  )
}

export default BlogReaderView
