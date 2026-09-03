export type RegionType = 'north' | 'central' | 'south'

export interface PlaceTypeDto {
  id: number
  name: string
  iconClass?: string | null
}

export interface LookupItemDto {
  id: number
  name: string
}

export interface RegionLookupDto {
  id: number
  name: string
  provinces: LookupItemDto[]
}

export interface PlaceFilterOptionsDto {
  categories: LookupItemDto[]
  regions: RegionLookupDto[]
}

export interface CategoryDto {
  id: number
  placeTypeId: number
  placeTypeName: string
  name: string
  iconClass?: string | null
  placeCount: number
}

export interface PlaceCardDto {
  id: number
  name: string
  categoryName?: string | null
  avgRating: number
  reviewCount: number
  mediaUrls: string[]
}

export interface CollectionDto {
  id: number
  title: string
  description?: string | null
  isFeatured: boolean
  displayOrder: number
  coverUrl?: string | null
  placeCount: number
  places?: PlaceCardDto[] | null
}

export interface PlaceSummaryDto {
  id: number
  name: string
  description?: string | null
  address: string
  provinceId: number
  provinceName: string
  regionId: number
  regionName: string
  categoryId: number
  categoryName: string
  placeTypeId: number
  placeTypeName: string
  minPrice?: number | null
  maxPrice?: number | null
  openingHours?: string | null
  avgRating: number
  reviewCount: number
  thumbnailUrl?: string | null
  mediaUrls?: string[] | null
  status: number
  createdAt: string
}

export interface PlaceFilterParams {
  keyword?: string
  regionId?: number
  provinceId?: number
  categoryId?: number
  placeTypeId?: number
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: string
  page?: number
  pageSize?: number
}

export interface PlaceMediaDto {
  id: number
  mediaUrl: string
  mediaType: 'image' | 'video'
  isCover?: boolean
}

export interface DestinationItem {
  id: string | number
  name: string
  province: string
  region: RegionType | string
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
