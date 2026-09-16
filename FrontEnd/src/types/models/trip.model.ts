export interface UserTripSummaryDto {
  id: number
  title: string
  description?: string
  coverImageUrl?: string
  province?: string
  region?: string
  startDate?: string
  endDate?: string
  durationDays: number
  nightsCount: number
  estimatedBudget?: number
  privacy: number
  status: number
  userRole: string
  membersCount: number
  totalStopsCount: number
  createdAt: string
}

export interface CreateTripStopDto {
  placeId: number
  visitOrder: number
  startTime?: string
  endTime?: string
  estimatedCost?: number
  transportMode?: string
  note?: string
}

export interface CreateTripDayDto {
  dayNumber: number
  dayTitle?: string
  stops?: CreateTripStopDto[]
}

export interface CreateTripRequestDto {
  title: string
  description?: string
  coverImageUrl?: string
  startDate?: string
  endDate?: string
  privacy?: number
  sourceTripId?: number
  days?: CreateTripDayDto[]
}

export interface CreateTripResponseDto {
  id: number
  title: string
  slug: string
  durationDays: number
  nightsCount: number
  estimatedBudget?: number
  createdAt: string
}

export interface TripMemberDetailDto {
  userId: number
  fullName: string
  avatarUrl?: string
  email?: string
  role: string
}

export interface TripPlaceDetailDto {
  id: number
  placeId: number
  name: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
  visitOrder: number
  startTime?: string
  endTime?: string
  estimatedCost?: number
  transportMode?: string
  note?: string
  imageUrl?: string
}

export interface TripDayDetailDto {
  id: number
  dayNumber: number
  dayTitle?: string
  date?: string
  stops: TripPlaceDetailDto[]
}

export interface TripDetailDto {
  id: number
  title: string
  description?: string
  coverImageUrl?: string
  province?: string
  region?: string
  startDate?: string
  endDate?: string
  durationDays: number
  nightsCount: number
  estimatedBudget?: number
  budgetTarget?: number
  privacy: number
  status: number
  currentUserRole?: string
  members: TripMemberDetailDto[]
  days: TripDayDetailDto[]
}

export interface UpdateTripRequestDto {
  title?: string
  description?: string
  coverImageUrl?: string
  startDate?: string
  endDate?: string
  privacy?: number
  budgetTarget?: number
}

export interface AddTripPlaceRequestDto {
  placeId: number
  visitOrder: number
  startTime?: string
  endTime?: string
  estimatedCost?: number
  transportMode?: string
  note?: string
}

export interface UpdateTripPlaceRequestDto {
  visitOrder: number
  startTime?: string
  endTime?: string
  estimatedCost?: number
  transportMode?: string
  note?: string
}

export interface InviteTripMemberRequestDto {
  email: string
  role: string
}

export interface PublicTripSummaryDto {
  id: number
  title: string
  province?: string
  durationDays: number
  nightsCount: number
  coverImageUrl?: string
}
