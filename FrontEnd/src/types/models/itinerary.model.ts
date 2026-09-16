export type TripRole = 'Owner' | 'Editor' | 'Viewer'
export type TripPrivacy = 0 | 1 | 2
export type TransportType = 'Xe máy' | 'Ô tô' | 'Đi bộ' | 'Taxi' | 'Xe buýt' | 'Tàu hỏa' | 'Máy bay'
export type StopStatus = 'To Do' | 'In Progress' | 'Done'

export interface StopSubtask {
  id: string
  title: string
  completed: boolean
}

export interface TripMember {
  id: number
  name: string
  avatar: string
  email: string
  role: TripRole
  joinedDate?: string
}

export interface ItineraryStop {
  id: string
  placeId?: number
  code?: string
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
  img: string
  lat?: number
  lng?: number
  rating?: number
  status?: StopStatus
  assigneeId?: number
  assigneeName?: string
  assigneeAvatar?: string
  subtasks?: StopSubtask[]
}

export interface ItineraryDayData {
  dayNumber: number
  title: string
  date?: string
  description: string
  stops: ItineraryStop[]
}

export interface DetailedItineraryItem {
  id: number
  title: string
  slug: string
  projectKey?: string
  province: string
  region: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' | 'Tây Nguyên' | 'Tự túc' | 'Khác'
  durationDays: number
  nightsCount: number
  estimatedBudget: number
  budgetTarget?: number
  startDate?: string
  endDate?: string
  privacy: TripPrivacy
  coverImg: string
  authorName: string
  authorAvatar: string
  authorRank: string
  rating: number
  reviewCount: number
  tags: string[]
  description: string
  days: ItineraryDayData[]
  backlogStops?: ItineraryStop[]
  members: TripMember[]
  createdAt: string
  isCustom?: boolean
  isDraft?: boolean
}
