export interface MentionedPlace {
  name: string
  category: string
  province: string
  rating: number
  price: string
}

export interface BlogArticleSection {
  id: string
  heading: string
  content: string
  highlightTip?: string
  image?: string
  imageCaption?: string
}

export interface BlogArticleItem {
  id: number
  slug: string
  categoryId: number
  title: string
  subtitle: string
  excerpt: string
  category: 'Ẩm thực' | 'Kinh nghiệm' | 'Khám phá' | 'Lịch trình' | 'Văn hóa'
  coverImg: string
  authorName: string
  authorRole: string
  authorAvatar: string
  publishDate: string
  readTime: string
  readTimeMinutes: number
  viewsCount: number
  likesCount: number
  isFeatured?: boolean
  contentJSON?: string
  htmlContent?: string
  sections: BlogArticleSection[]
  mentionedPlaces?: MentionedPlace[]
}

export interface BlogReportType {
  id: number
  code: string
  label: string
  desc: string
}
