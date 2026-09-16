import React from 'react'
import { ListTree } from 'lucide-react'
import type { BlogArticleSection } from '@/types/models/blogArticle.model'

export interface TocHeadingItem {
  id: string
  level: number
  text: string
}

interface BlogTableOfContentsProps {
  sections?: BlogArticleSection[]
  headings?: TocHeadingItem[]
  onScrollToSection: (id: string) => void
}

export const BlogTableOfContents: React.FC<BlogTableOfContentsProps> = ({
  sections = [],
  headings,
  onScrollToSection
}) => {
  const items: TocHeadingItem[] = headings && headings.length > 0
    ? headings
    : sections.map((sec, i) => ({
        id: sec.id,
        level: 1,
        text: sec.heading.replace(/^\d+\.\s*/, '') || `Mục ${i + 1}`
      }))

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
        <ListTree size={16} className="text-emerald-800" />
        <span>Mục lục bài viết ({items.length})</span>
      </div>
      <nav className="space-y-1 text-xs max-h-[420px] overflow-y-auto no-scrollbar">
        {items.map((item, i) => (
          <button
            type="button"
            key={item.id || `toc-${i}`}
            onClick={() => onScrollToSection(item.id)}
            className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-start gap-2 cursor-pointer ${
              item.level === 1
                ? 'font-bold text-slate-900 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-950'
                : item.level === 2
                ? 'pl-4 text-slate-700 hover:bg-slate-100 font-medium'
                : 'pl-6 text-slate-500 text-[11px] hover:bg-slate-100'
            }`}
          >
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 mt-0.5 ${
              item.level === 1
                ? 'bg-emerald-800 text-white'
                : item.level === 2
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              H{item.level}
            </span>
            <span className="line-clamp-2 leading-snug">{item.text}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default BlogTableOfContents

