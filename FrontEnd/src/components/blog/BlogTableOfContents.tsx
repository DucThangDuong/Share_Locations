import React, { useEffect, useState } from 'react'
import { ListTree } from 'lucide-react'

export interface TocHeadingItem {
  id: string
  level: number
  text: string
}

interface BlogTableOfContentsProps {
  sections?: { id: string; heading: string }[]
  headings?: TocHeadingItem[]
  articleTitle?: string
  activeId?: string
  onScrollToSection: (id: string) => void
}

export const BlogTableOfContents: React.FC<BlogTableOfContentsProps> = ({
  sections = [],
  headings,
  articleTitle,
  activeId: externalActiveId,
  onScrollToSection
}) => {
  const [internalActiveId, setInternalActiveId] = useState<string>('')

  const rawItems: TocHeadingItem[] = headings && headings.length > 0
    ? headings
    : sections.map((sec, i) => ({
      id: sec.id,
      level: 1,
      text: sec.heading.replace(/^\d+\.\s*/, '') || `Mục ${i + 1}`
    }))

  const normalizedTitle = articleTitle?.trim().toLowerCase() || ''
  const items: TocHeadingItem[] = rawItems
    .map((item, index) => {
      if (index === 0 && normalizedTitle) {
        const itemTextNorm = item.text.trim().toLowerCase()
        if (itemTextNorm === normalizedTitle || itemTextNorm.startsWith(normalizedTitle) || normalizedTitle.startsWith(itemTextNorm)) {
          return {
            ...item,
            text: 'Tổng quan & Giới thiệu chung'
          }
        }
      }
      return item
    })

  useEffect(() => {
    if (items.length === 0) return

    const handleScroll = () => {
      const headingElements = items
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[]

      if (headingElements.length === 0) return

      const scrollPosition = window.scrollY + 140

      let currentActiveId = headingElements[0].id
      for (const el of headingElements) {
        if (el.offsetTop <= scrollPosition) {
          currentActiveId = el.id
        } else {
          break
        }
      }

      setInternalActiveId(currentActiveId)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  const activeId = externalActiveId || internalActiveId || (items[0]?.id || '')

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <ListTree size={16} className="text-emerald-700" />
          <span>Mục lục bài viết</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
          {items.length} phần
        </span>
      </div>

      <nav aria-label="Mục lục bài viết" className="space-y-1 max-h-[460px] overflow-y-auto overflow-x-hidden no-scrollbar py-1">
        {items.map((item, i) => {
          const isActive = activeId === item.id
          const isSubheading = item.level >= 3

          return (
            <button
              type="button"
              key={item.id || `toc-${i}`}
              onClick={() => onScrollToSection(item.id)}
              className={`relative w-full text-left py-2 pr-3 transition-all duration-150 flex items-start gap-2.5 cursor-pointer text-xs rounded-xl ${isSubheading ? 'pl-6' : 'pl-3'
                } ${isActive
                  ? 'bg-emerald-50/80 text-emerald-950 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-600 rounded-r-full" />
              )}
              <span
                className={`mt-1.5 shrink-0 rounded-full transition-colors ${isSubheading ? 'w-1 h-1' : 'w-1.5 h-1.5'
                  } ${isActive ? 'bg-emerald-600' : 'bg-slate-300'}`}
              />
              <span className="line-clamp-2 leading-relaxed">
                {item.text}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default BlogTableOfContents
