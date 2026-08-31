export interface RegionDto {
  id: number
  name: string
  code: 'north' | 'central' | 'south' | string
  description?: string
}

export interface ProvinceDto {
  id: number
  name: string
  code: string
  regionId: number
  regionName?: string
  imageUrl?: string
  placeCount?: number
}
