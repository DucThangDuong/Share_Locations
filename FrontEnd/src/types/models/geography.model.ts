export interface ProvinceSummaryDto {
  id: number
  name: string
  imageUrl?: string | null
  featured: boolean
  placeCount: number
}

export interface RegionDto {
  id: number
  name: string
  tagline?: string | null
  description?: string | null
  imageUrl?: string | null
  orderIndex: number
  provinceCount: number
  provinces?: ProvinceSummaryDto[] | null
}

export interface ProvinceDto {
  id: number
  regionId: number
  regionName: string
  name: string
  tagline?: string | null
  description?: string | null
  imageUrl?: string | null
  featured: boolean
  displayOrder: number
  placeCount: number
}
