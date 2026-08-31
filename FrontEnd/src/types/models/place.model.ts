export type RegionType = 'north' | 'central' | 'south'

export interface PlaceMediaDto {
  id: number
  mediaUrl: string
  mediaType: 'image' | 'video'
  isCover?: boolean
}

export interface PlaceDto {
  id: number | string
  title: string
  slug: string
  description: string
  address: string
  provinceId?: number
  provinceName?: string
  region: RegionType
  categoryId?: number
  categoryName?: string
  rating: number
  reviewCount: number
  thumbnailUrl: string
  mediaList?: PlaceMediaDto[]
  isFeatured?: boolean
  createdAt?: string
}

export interface DestinationItem {
  id: string | number
  name: string
  province: string
  region: RegionType
  regionName: string
  imageUrl: string
  tag?: string
  description?: string
  placeCount?: number
  views?: number
}

export interface SavedPlaceItem {
  id: string | number
  title: string
  location: string
  imageUrl: string
  savedAt: string
}

export interface SuggestedPlaceItem {
  id: string | number
  title: string
  location: string
  imageUrl: string
  suggestedBy: string
}
