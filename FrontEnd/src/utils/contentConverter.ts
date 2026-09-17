export interface TocHeadingItem {
  id: string
  level: number
  text: string
}

export function convertDeltaToHtml(deltaObj: { ops?: Array<{ insert?: unknown; attributes?: Record<string, unknown> }> }): string {
  if (!deltaObj || !Array.isArray(deltaObj.ops)) return ''

  let html = ''
  let currentInlineHtml = ''

  const flushInlineAsParagraph = () => {
    if (currentInlineHtml.trim().length > 0) {
      html += `<p class="leading-relaxed text-slate-700 my-3 text-base sm:text-lg">${currentInlineHtml}</p>`
      currentInlineHtml = ''
    }
  }

  for (let i = 0; i < deltaObj.ops.length; i++) {
    const op = deltaObj.ops[i]
    if (!op || op.insert === undefined) continue

    if (typeof op.insert === 'object' && op.insert !== null) {
      flushInlineAsParagraph()
      const insertObj = op.insert as { image?: string; [key: string]: unknown }
      if (insertObj.image) {
        html += `<figure class="my-6"><img src="${insertObj.image}" alt="Ảnh minh họa" class="w-full rounded-2xl object-cover max-h-[500px] shadow-sm border border-slate-200" loading="lazy" /></figure>`
      }
      continue
    }

    if (typeof op.insert === 'string') {
      const text = op.insert
      const attrs = op.attributes || {}

      if (attrs.header) {
        flushInlineAsParagraph()
        const level = Math.min(3, Math.max(1, Number(attrs.header)))
        const cleanText = text.replace(/\n+$/, '').trim()
        if (cleanText) {
          const tag = `h${level + 1}`
          html += `<${tag} class="font-bold text-slate-900 mt-8 mb-3 tracking-tight ${level === 1 ? 'text-2xl sm:text-3xl' : level === 2 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}">${cleanText}</${tag}>`
        }
        continue
      }

      if (attrs.blockquote) {
        flushInlineAsParagraph()
        const cleanText = text.replace(/\n+$/, '').trim()
        if (cleanText) {
          html += `<blockquote class="border-l-4 border-emerald-600 bg-emerald-50/60 pl-4 py-2 italic text-slate-700 my-4 rounded-r-xl">${cleanText}</blockquote>`
        }
        continue
      }

      const parts = text.split('\n')
      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        const part = parts[pIdx]

        if (pIdx > 0) {
          flushInlineAsParagraph()
        }

        if (part) {
          let formatted = part
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

          if (attrs.bold) formatted = `<strong>${formatted}</strong>`
          if (attrs.italic) formatted = `<em>${formatted}</em>`
          if (attrs.underline) formatted = `<u>${formatted}</u>`
          if (attrs.strike) formatted = `<s>${formatted}</s>`
          if (attrs.link && typeof attrs.link === 'string') {
            formatted = `<a href="${attrs.link}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-semibold hover:text-emerald-800">${formatted}</a>`
          }

          if (attrs.bold && /^\d+\.\s+/.test(part.trim()) && parts.length > 1) {
            flushInlineAsParagraph()
            html += `<h3 class="font-bold text-slate-900 text-xl sm:text-2xl mt-6 mb-2 tracking-tight">${formatted}</h3>`
            continue
          }

          currentInlineHtml += formatted
        }
      }
    }
  }

  flushInlineAsParagraph()
  return html
}

export function convertTiptapJsonToHtml(node: Record<string, unknown>): string {
  if (!node) return ''

  if (node.type === 'text') {
    let text = String(node.text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (Array.isArray(node.marks)) {
      node.marks.forEach((mark: { type?: string; attrs?: Record<string, unknown> }) => {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        if (mark.type === 'italic') text = `<em>${text}</em>`
        if (mark.type === 'underline') text = `<u>${text}</u>`
        if (mark.type === 'strike') text = `<s>${text}</s>`
        if (mark.type === 'link' && mark.attrs?.href) {
          text = `<a href="${mark.attrs.href}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-semibold">${text}</a>`
        }
        if (mark.type === 'highlight') {
          text = `<mark class="bg-amber-100 text-amber-900 px-1 rounded">${text}</mark>`
        }
      })
    }
    return text
  }

  const childrenHtml = Array.isArray(node.content)
    ? (node.content as Record<string, unknown>[]).map(convertTiptapJsonToHtml).join('')
    : ''

  switch (node.type) {
    case 'doc':
      return childrenHtml
    case 'paragraph':
      return childrenHtml.trim()
        ? `<p class="leading-relaxed text-slate-700 my-3 text-base sm:text-lg">${childrenHtml}</p>`
        : ''
    case 'heading': {
      const level = Math.min(4, Math.max(1, Number((node.attrs as { level?: number })?.level || 2)))
      const tag = `h${level}`
      return `<${tag} class="font-bold text-slate-900 mt-8 mb-3 tracking-tight ${level === 1 ? 'text-2xl sm:text-3xl' : level === 2 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}">${childrenHtml}</${tag}>`
    }
    case 'blockquote':
      return `<blockquote class="border-l-4 border-emerald-600 bg-emerald-50/60 pl-4 py-2 italic text-slate-700 my-4 rounded-r-xl">${childrenHtml}</blockquote>`
    case 'bulletList':
      return `<ul class="list-disc list-inside space-y-1 my-3 text-slate-700">${childrenHtml}</ul>`
    case 'orderedList':
      return `<ol class="list-decimal list-inside space-y-1 my-3 text-slate-700">${childrenHtml}</ol>`
    case 'listItem':
      return `<li>${childrenHtml}</li>`
    case 'image': {
      const src = (node.attrs as { src?: string })?.src || ''
      const alt = (node.attrs as { alt?: string })?.alt || 'Ảnh bài viết'
      return `<figure class="my-6"><img src="${src}" alt="${alt}" class="w-full rounded-2xl object-cover max-h-[500px] shadow-sm border border-slate-200" loading="lazy" /></figure>`
    }
    default:
      return childrenHtml
  }
}

export function convertRawContentToHtml(content?: string | object | null): string {
  if (!content) return ''

  if (typeof content === 'object') {
    if ('ops' in content && Array.isArray((content as { ops: unknown[] }).ops)) {
      return convertDeltaToHtml(content as { ops: Array<{ insert?: unknown; attributes?: Record<string, unknown> }> })
    }
    if ('type' in content && (content as { type: string }).type === 'doc') {
      return convertTiptapJsonToHtml(content as Record<string, unknown>)
    }
    return ''
  }

  if (typeof content === 'string') {
    const trimmed = content.trim()

    if (trimmed.startsWith('{"ops"') || trimmed.startsWith('{"ops":') || trimmed.startsWith('{"ops" :')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && Array.isArray(parsed.ops)) {
          return convertDeltaToHtml(parsed)
        }
      } catch {}
    }

    if (trimmed.startsWith('{"type":"doc"') || trimmed.startsWith('{"type": "doc"')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && parsed.type === 'doc') {
          return convertTiptapJsonToHtml(parsed)
        }
      } catch {}
    }

    if (trimmed.startsWith('<') && trimmed.includes('</')) {
      return trimmed
    }

    return trimmed
      .split(/\n\s*\n/)
      .map((block) => `<p class="leading-relaxed text-slate-700 my-3 text-base sm:text-lg">${block.replace(/\n/g, '<br/>')}</p>`)
      .join('')
  }

  return ''
}

export function extractHeadingsAndProcessHtml(html: string): { processedHtml: string; extractedHeadings: TocHeadingItem[] } {
  if (!html) return { processedHtml: '', extractedHeadings: [] }

  const headings: TocHeadingItem[] = []
  let counter = 0

  const processedHtml = html.replace(
    /<(h[1-4])([^>]*)>(.*?)<\/\1>/gi,
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

  return { processedHtml, extractedHeadings: headings }
}
