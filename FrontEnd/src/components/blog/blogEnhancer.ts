import type { BlogDetailDto, MentionedPlaceDto } from '@/types/models/blogArticle.model'

export function calculateReadTime(content?: string | null, excerpt?: string | null): string {
  const combined = `${content || ''} ${excerpt || ''}`.trim()
  const wordCount = combined ? combined.split(/\s+/).length : 0
  const minutes = Math.max(1, Math.ceil(wordCount / 160))
  return `${minutes} phút đọc`
}

export function formatEditorialDate(dateString?: string | null): string {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  } catch {}
  return String(dateString)
}

export function formatViewsCount(count?: number | null): { raw: number; formatted: string } {
  const raw = typeof count === 'number' && !isNaN(count) ? Math.max(0, count) : 0
  const formatted = raw >= 1000 ? `${(raw / 1000).toFixed(1).replace('.0', '')}K` : `${raw}`
  return { raw, formatted }
}

export function formatLikesCount(count?: number | null): number {
  return typeof count === 'number' && !isNaN(count) ? Math.max(0, count) : 0
}

export function getMentionedPlacesForArticle(article: BlogDetailDto): MentionedPlaceDto[] {
  return article.mentionedPlaces || []
}
