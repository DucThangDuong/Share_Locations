export interface CommentDto {
  id: number
  authorId: number
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
}

export interface BlogDto {
  id: number | string
  title: string
  slug: string
  summary: string
  content?: string
  imageUrl: string
  authorId?: number
  authorName: string
  authorAvatar: string
  publishedAt: string
  readTime: string
  category: string
  commentsCount?: number
  comments?: CommentDto[]
}

export interface BlogItem {
  id: string | number
  title: string
  summary: string
  imageUrl: string
  authorName: string
  authorAvatar: string
  publishedAt: string
  readTime: string
  category: string
}
