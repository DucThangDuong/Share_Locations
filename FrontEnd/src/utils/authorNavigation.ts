import type { NavigateFunction } from 'react-router-dom'
import { friendService } from '@/services/friendService'
import type { BlogAuthorDto, BlogListItemDto } from '@/types/models/blogArticle.model'

export const resolveAuthorId = (
  author?: BlogAuthorDto | null,
  article?: Partial<BlogListItemDto> | null
): number | string | null => {
  if (!author && !article) return null

  const candidate =
    author?.id ||
    author?.userId ||
    author?.authorId ||
    (author as any)?.user_id ||
    (author as any)?.accountId ||
    (article as any)?.authorId ||
    (article as any)?.userId ||
    (article as any)?.createdById ||
    (article as any)?.author_id ||
    (article as any)?.user_id ||
    (article as any)?.user?.id ||
    (article as any)?.author?.id ||
    (article as any)?.author?.userId

  if (candidate && !isNaN(Number(candidate)) && Number(candidate) > 0) {
    return Number(candidate)
  }
  if (candidate) {
    return candidate
  }
  return null
}

export const navigateToAuthorProfile = async (
  navigate: NavigateFunction,
  author?: BlogAuthorDto | null,
  article?: Partial<BlogListItemDto> | null,
  e?: React.MouseEvent
): Promise<void> => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  const directId = resolveAuthorId(author, article)
  const authorName = author?.name || (article as any)?.authorName || ''
  const authorAvatar = author?.avatar || (article as any)?.authorAvatar || null

  if (directId) {
    navigate(`/profile/${directId}`, {
      state: { authorName, authorAvatar }
    })
    return
  }

  if (authorName.trim()) {
    try {
      const res = await friendService.searchUsers(authorName.trim())
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const found =
          res.data.find(
            (u) => u.name?.trim().toLowerCase() === authorName.trim().toLowerCase()
          ) || res.data[0]

        if (found && found.id) {
          navigate(`/profile/${found.id}`, {
            state: {
              authorName: found.name,
              authorAvatar: found.avatar || authorAvatar
            }
          })
          return
        }
      }
    } catch {
      // search fallback
    }

    navigate(`/profile?name=${encodeURIComponent(authorName.trim())}`, {
      state: {
        authorName,
        authorAvatar,
        authorRole: author?.role
      }
    })
    return
  }

  navigate('/profile')
}
