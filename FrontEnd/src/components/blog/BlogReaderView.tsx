import React, { useEffect, useState, useMemo } from 'react'
import {
  Clock,
  BookOpen,
  Flag
} from 'lucide-react'
import { ReportModal } from '@/components/report/ReportModal'
import type { BlogDetailDto, BlogListItemDto } from '@/types/models/blogArticle.model'
import { BlogTableOfContents } from './BlogTableOfContents'
import { convertRawContentToHtml, extractHeadingsAndProcessHtml } from '@/utils/contentConverter'

interface BlogReaderViewProps {
  article: BlogDetailDto
  allArticles: BlogListItemDto[]
  likedArticles: Set<number>
  savedArticles: Set<number>
  onToggleLike: (id: number, e?: React.MouseEvent) => void
  onToggleSave: (id: number, e?: React.MouseEvent) => void
  onShare?: (article: BlogDetailDto, e?: React.MouseEvent) => void
  onSelectArticle: (article: BlogListItemDto) => void
  onSelectPlaceByName?: (name: string, province: string) => void
  onNavigateToItinerary?: () => void
}

export const BlogReaderView: React.FC<BlogReaderViewProps> = ({
  article
}) => {
  const [readProgress, setReadProgress] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

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
    <div className="bg-white min-h-screen">
      <div
        className="fixed top-0 left-0 h-1 bg-emerald-600 z-50 transition-all duration-100"
        style={{ width: `${readProgress}%` }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-8 min-w-0">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                <span>{article.category || 'Cẩm nang du lịch'}</span>
                {article.publishedAt && (
                  <>
                    <span>•</span>
                    <span>{article.publishedAt}</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                  {article.excerpt}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200">
              <div className="flex items-center gap-3">
                {article.author?.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {(article.author?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {article.author?.name || 'Tác giả'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {article.author?.role || 'Tác giả chia sẻ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {article.readTime || '5 phút đọc'}
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Báo cáo bài viết vi phạm"
                >
                  <Flag size={13} />
                  <span>Báo cáo</span>
                </button>
              </div>
            </div>

            {article.coverUrl ? (
              <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
                <img
                  src={article.coverUrl}
                  alt={article.title}
                  className="w-full max-h-[480px] object-cover"
                />
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-900/10 to-teal-900/20 py-16 flex items-center justify-center text-emerald-800">
                <BookOpen size={48} />
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

            <div className="pt-8 border-t border-slate-200 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                {article.author?.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                    {(article.author?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <h4 className="font-bold text-base text-slate-900">
                    {article.author?.name || 'Tác giả'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {article.author?.role || 'Thành viên cộng đồng LangThang'}
                  </p>
                  <p className="text-xs text-slate-600 pt-1">
                    Cảm ơn bạn đã đọc bài viết! Hãy lưu lại cẩm nang hoặc chia sẻ cho bạn bè cùng chuyến đi nhé.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            {extractedHeadings && extractedHeadings.length > 0 && (
              <BlogTableOfContents
                headings={extractedHeadings}
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
            targetSubtitle: `Tác giả: ${article.author?.name || 'Ẩn danh'} • ${article.category || 'Cẩm nang'}`,
            targetContent: article.excerpt || article.content?.slice(0, 200),
            targetAuthor: article.author?.name,
          }}
        />
      )}
    </div>
  )
}

export default BlogReaderView
