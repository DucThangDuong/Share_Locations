import type { RegionType } from './place.model'

export interface FoodMediaDto {
  id: number
  mediaUrl: string
  mediaType: 'image' | 'video'
}

export interface FoodDto {
  id: number | string
  name: string
  slug: string
  description: string
  origin: string
  region: RegionType
  imageUrl: string
  priceRange?: string
  mediaList?: FoodMediaDto[]
  provinceId?: number
  provinceName?: string
}

export interface CuisineItem {
  id: string | number
  name: string
  origin: string
  region: RegionType
  imageUrl: string
  description: string
  priceRange?: string
}
