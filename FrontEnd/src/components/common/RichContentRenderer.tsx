import React from 'react'

interface RichContentRendererProps {
  content?: string | null
  className?: string
}

export const extractPlainText = (rawContent?: string | null): string => {
  if (!rawContent) return ''
  const trimmed = rawContent.trim()
  if (trimmed.startsWith('{"ops":') || trimmed.startsWith('{"ops" :')) {
    try {
      const delta = JSON.parse(trimmed)
      if (Array.isArray(delta.ops)) {
        return delta.ops
          .map((op: { insert?: unknown }) => (typeof op.insert === 'string' ? op.insert : ''))
          .join('')
          .replace(/\n+/g, ' ')
          .trim()
      }
    } catch {
    }
  }

  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return trimmed
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, className = '' }) => {
  if (!content) return null
  const trimmed = content.trim()

  if (trimmed.startsWith('{"ops":') || trimmed.startsWith('{"ops" :')) {
    try {
      const delta = JSON.parse(trimmed)
      if (Array.isArray(delta.ops)) {
        const elements: React.ReactNode[] = []
        let currentTextNodes: React.ReactNode[] = []
        let keyIdx = 0

        const flushParagraph = () => {
          if (currentTextNodes.length > 0) {
            elements.push(
              <p key={`p-${keyIdx++}`} className="leading-relaxed text-slate-700 my-2">
                {currentTextNodes}
              </p>
            )
            currentTextNodes = []
          }
        }

        delta.ops.forEach((op: { insert?: unknown; attributes?: Record<string, unknown> }, opIdx: number) => {
          if (!op.insert) return

          if (typeof op.insert === 'object' && (op.insert as { image?: string }).image) {
            flushParagraph()
            elements.push(
              <div key={`img-${opIdx}`} className="my-4 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs">
                <img
                  src={(op.insert as { image: string }).image}
                  alt="Ảnh bài viết"
                  className="w-full max-h-[500px] object-cover"
                  loading="lazy"
                />
              </div>
            )
            return
          }

          if (typeof op.insert === 'string') {
            const text = op.insert
            const attrs = op.attributes || {}

            if (attrs.header) {
              flushParagraph()
              const headerLevel = Number(attrs.header)
              const cleanText = text.replace(/\n+$/, '')
              if (cleanText) {
                if (headerLevel === 1) {
                  elements.push(
                    <h2 key={`h1-${opIdx}`} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 tracking-tight border-b border-slate-100 pb-2">
                      {cleanText}
                    </h2>
                  )
                } else if (headerLevel === 2) {
                  elements.push(
                    <h3 key={`h2-${opIdx}`} className="text-lg sm:text-xl font-extrabold text-slate-900 mt-5 mb-2 tracking-tight">
                      {cleanText}
                    </h3>
                  )
                } else {
                  elements.push(
                    <h4 key={`h3-${opIdx}`} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2">
                      {cleanText}
                    </h4>
                  )
                }
              }
              return
            }

            if (attrs.blockquote) {
              flushParagraph()
              const cleanText = text.replace(/\n+$/, '')
              if (cleanText) {
                elements.push(
                  <blockquote key={`bq-${opIdx}`} className="border-l-4 border-emerald-500 bg-emerald-50/50 pl-4 py-2 italic text-slate-700 my-4 rounded-r-lg font-serif">
                    {cleanText}
                  </blockquote>
                )
              }
              return
            }

            const lines = text.split('\n')
            lines.forEach((line, lineIdx) => {
              if (lineIdx > 0) {
                flushParagraph()
              }

              if (line) {
                let formattedNode: React.ReactNode = line

                if (attrs.bold) {
                  formattedNode = <strong key={`b-${opIdx}-${lineIdx}`} className="font-bold text-slate-900">{formattedNode}</strong>
                }
                if (attrs.italic) {
                  formattedNode = <em key={`i-${opIdx}-${lineIdx}`} className="italic">{formattedNode}</em>
                }
                if (attrs.underline) {
                  formattedNode = <u key={`u-${opIdx}-${lineIdx}`} className="underline">{formattedNode}</u>
                }
                if (attrs.strike) {
                  formattedNode = <s key={`s-${opIdx}-${lineIdx}`} className="line-through">{formattedNode}</s>
                }
                if (attrs.link && typeof attrs.link === 'string') {
                  formattedNode = (
                    <a
                      key={`a-${opIdx}-${lineIdx}`}
                      href={attrs.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-semibold hover:text-emerald-800"
                    >
                      {formattedNode}
                    </a>
                  )
                }

                currentTextNodes.push(
                  <React.Fragment key={`frag-${opIdx}-${lineIdx}`}>
                    {formattedNode}
                  </React.Fragment>
                )
              }
            })
          }
        })

        flushParagraph()

        return (
          <div className={`rich-text-document space-y-2 text-slate-800 text-sm sm:text-base leading-relaxed ${className}`}>
            {elements}
          </div>
        )
      }
    } catch {
    }
  }

  if (trimmed.startsWith('<') && trimmed.includes('</')) {
    return (
      <div
        className={`rich-text-html prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    )
  }

  return (
    <div className={`whitespace-pre-line text-slate-800 text-sm sm:text-base leading-relaxed space-y-3 ${className}`}>
      {trimmed}
    </div>
  )
}
