import React, { useEffect, useState, useMemo } from 'react'
import {
  Heart,
  Bookmark,
  Clock,
  Eye,
  Sparkles,
  Flame,
  ArrowLeft
} from 'lucide-react'
import type { BlogArticleItem } from '@/types/models/blogArticle.model'
import { BlogTableOfContents, type TocHeadingItem } from './BlogTableOfContents'
import { BlogMentionedPlacesWidget } from './BlogMentionedPlacesWidget'

interface BlogReaderViewProps {
  article: BlogArticleItem
  allArticles: BlogArticleItem[]
  likedArticles: Set<number>
  savedArticles: Set<number>
  onBack: () => void
  onToggleLike: (id: number, e?: React.MouseEvent) => void
  onToggleSave: (id: number, e?: React.MouseEvent) => void
  onShare?: (article: BlogArticleItem, e?: React.MouseEvent) => void
  onSelectArticle: (article: BlogArticleItem) => void
  onSelectPlaceByName?: (name: string, province: string) => void
  onNavigateToItinerary?: () => void
}

export const BlogReaderView: React.FC<BlogReaderViewProps> = ({
  article,
  allArticles,
  likedArticles,
  savedArticles,
  onBack,
  onToggleLike,
  onToggleSave,
  onSelectArticle,
  onSelectPlaceByName
}) => {
  const [readProgress, setReadProgress] = useState(0)

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
    if (!article.htmlContent) {
      return { processedHtml: '', extractedHeadings: [] }
    }

    const headings: TocHeadingItem[] = []
    let counter = 0

    const html = article.htmlContent.replace(
      /<(h[1-3])([^>]*)>(.*?)<\/\1>/gi,
      (_, tag, attrs, inner) => {
        const id = `heading-${counter++}`
        const level = parseInt(tag.substring(1), 10)
        const cleanText = inner.replace(/<[^>]+>/g, '').trim()
        if (cleanText) {
          headings.push({ id, level, text: cleanText })
        }
        return `<${tag}${attrs} id="${id}" class="scroll-mt-24">${inner}</${tag}>`
      }
    )

    return { processedHtml: html, extractedHeadings: headings }
  }, [article.htmlContent])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const otherArticles = allArticles.filter((a) => a.id !== article.id)
  const isLiked = likedArticles.has(article.id)
  const isSaved = savedArticles.has(article.id)

  return (
    <div className="bg-white min-h-screen">
      <div
        className="fixed top-0 left-0 h-1 bg-emerald-600 z-50 transition-all duration-100"
        style={{ width: `${readProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại cẩm nang</span>
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-8 min-w-0">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                <span>{article.category}</span>
                <span>•</span>
                <span>{article.publishDate}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {article.title}
              </h1>

              {article.subtitle && (
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                  {article.subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={article.authorAvatar}
                  alt={article.authorName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {article.authorName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {article.authorRole || 'Tác giả chia sẻ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {article.readTimeMinutes} phút đọc
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {article.viewsCount.toLocaleString()} lượt đọc
                </span>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
              <img
                src={article.coverImg}
                alt={article.title}
                className="w-full max-h-[480px] object-cover"
              />
            </div>

            <div className="space-y-8 text-base text-slate-800 leading-relaxed font-normal pt-2">
              {article.htmlContent ? (
                <div
                  className="tiptap-content prose prose-slate max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: processedHtml || article.htmlContent }}
                />
              ) : (
                article.sections.map((sec) => (
                  <section key={sec.id} id={sec.id} className="space-y-4 scroll-mt-20">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3">
                      {sec.heading}
                    </h2>
                    <p className="text-justify text-slate-700 leading-relaxed text-[16px] sm:text-[17px]">
                      {sec.content}
                    </p>

                    {sec.highlightTip && (
                      <div className="p-4 sm:p-5 bg-emerald-50/80 border-l-4 border-emerald-800 rounded-r-2xl text-emerald-950 text-xs sm:text-sm my-4">
                        <span className="font-bold block mb-1 text-emerald-900 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-500" />
                          <span>Kinh nghiệm từ thổ địa:</span>
                        </span>
                        <p className="leading-relaxed">{sec.highlightTip}</p>
                      </div>
                    )}

                    {sec.image && (
                      <figure className="my-6">
                        <img
                          src={sec.image}
                          alt=""
                          className="w-full rounded-2xl object-cover max-h-[440px] shadow-sm border border-slate-200"
                          loading="lazy"
                        />
                        {sec.imageCaption && (
                          <figcaption className="text-center text-xs text-slate-500 mt-2 italic">
                            {sec.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </section>
                ))
              )}
            </div>

            <div className="pt-8 border-t border-slate-200 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={article.authorAvatar}
                  alt={article.authorName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <h4 className="font-bold text-base text-slate-900">
                    {article.authorName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {article.authorRole || 'Thành viên cộng đồng LangThang'}
                  </p>
                  <p className="text-xs text-slate-600 pt-1">
                    Cảm ơn bạn đã đọc bài viết! Hãy lưu lại cẩm nang hoặc chia sẻ cho bạn bè cùng chuyến đi nhé.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={(e) => onToggleLike(article.id, e)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${isLiked
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <Heart
                    size={16}
                    className={isLiked ? 'fill-red-600' : ''}
                  />
                  <span>
                    Thích bài viết ({article.likesCount + (isLiked ? 1 : 0)})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => onToggleSave(article.id, e)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${isSaved
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <Bookmark
                    size={16}
                    className={isSaved ? 'fill-white' : ''}
                  />
                  <span>{isSaved ? 'Đã lưu vào cẩm nang' : 'Lưu vào cẩm nang'}</span>
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            <BlogTableOfContents
              sections={article.sections}
              headings={extractedHeadings}
              onScrollToSection={scrollToSection}
            />

            {article.mentionedPlaces && article.mentionedPlaces.length > 0 && (
              <BlogMentionedPlacesWidget
                places={article.mentionedPlaces}
                onSelectPlaceByName={onSelectPlaceByName}
              />
            )}

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-900">
                <Flame size={15} className="text-amber-500" />
                <span>Bài viết đề xuất</span>
              </div>

              <div className="space-y-3">
                {otherArticles.slice(0, 3).map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="group flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img
                        src={art.coverImg}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800">
                        {art.category}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {art.readTimeMinutes} phút đọc
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default BlogReaderView
