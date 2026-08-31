export interface ReviewMediaDto {
  id: number
  mediaUrl: string
  mediaType: 'image' | 'video'
}

export interface ReviewDto {
  id: number
  placeId: number | string
  authorId: number
  authorName: string
  authorAvatar?: string
  rating: number
  content: string
  createdAt: string
  mediaList?: ReviewMediaDto[]
  likeCount?: number
}
