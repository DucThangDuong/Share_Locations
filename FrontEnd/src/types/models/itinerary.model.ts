export interface ItineraryAuthorDto {
  name: string
  avatar?: string | null
}

export interface ItineraryStopDto {
  time: string
  activity: string
  location: string
  placeName?: string | null
  note?: string | null
  description?: string | null
  costEstimate?: string | null
  tips?: string | null
}

export interface ItineraryDayDto {
  dayNumber: number
  title: string
  stops: ItineraryStopDto[]
}

export interface ItineraryDto {
  id: number
  title: string
  destination: string
  region: string
  duration: string
  daysCount: number
  style: string
  estimatedCost: string
  coverUrl?: string | null
  author: ItineraryAuthorDto
  overview?: string | null
  isSaved: boolean
  days: ItineraryDayDto[]
}

export interface SaveItineraryResponseDto {
  saved: boolean
  itineraryId: number
}

export interface ItineraryFilterParams {
  duration?: string
  region?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export type TripRole = 'Owner' | 'Editor' | 'Viewer'
export type TripPrivacy = 0 | 1 | 2
export type TransportType = 'Xe máy' | 'Ô tô' | 'Đi bộ' | 'Taxi' | 'Xe buýt' | 'Tàu hỏa' | 'Máy bay'

export interface ItineraryStop {
  id: string
  placeId?: number
  time: string
  startTime: string
  endTime: string
  name: string
  category: string
  area?: string
  address?: string
  note: string
  costEstimate: number
  duration: string
  transportMode: TransportType
  visitOrder: number
  img?: string
  lat?: number
  lng?: number
  rating?: number
}

export interface ItineraryDayData {
  dayNumber: number
  title: string
  date?: string
  description: string
  stops: ItineraryStop[]
}

export interface TripMember {
  id: number
  name: string
  avatar?: string | null
  email?: string
  role: TripRole
}

export interface DetailedItineraryItem {
  id: number
  title: string
  slug: string
  province: string
  region: string
  durationDays: number
  nightsCount: number
  estimatedBudget: number
  budgetTarget?: number
  startDate?: string
  endDate?: string
  privacy: TripPrivacy
  coverImg?: string
  authorName: string
  authorAvatar?: string | null
  tags?: string[]
  description: string
  days: ItineraryDayData[]
  backlogStops?: ItineraryStop[]
  members?: TripMember[]
  createdAt: string
  isSaved?: boolean
}

