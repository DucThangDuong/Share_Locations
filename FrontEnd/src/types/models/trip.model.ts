export interface TripPlaceDto {
  id: number
  placeId: number | string
  placeTitle: string
  dayNumber: number
  orderIndex: number
  notes?: string
}

export interface TripDayDto {
  dayNumber: number
  title?: string
  places: TripPlaceDto[]
}

export interface TripDto {
  id: number | string
  title: string
  destination: string
  duration: string
  placesCount: number
  imageUrl: string
  description: string
  authorId?: number
  authorName: string
  authorAvatar?: string
  updatedAt: string
  isPublic?: boolean
  days?: TripDayDto[]
}

export interface ItineraryItem {
  id: string | number
  title: string
  destination: string
  duration: string
  placesCount: number
  imageUrl: string
  description: string
  author: string
  updatedAt: string
}
