export interface FriendItemDto {
  id: number
  name: string
  avatar?: string
  coverUrl?: string
  email?: string
  bio?: string
  rankLevel?: string
  reputationScore?: number
  mutualFriendsCount: number
  tripsCount: number
  status: string
  requestedAt?: string
}

export interface FriendsResponseDto {
  friends: FriendItemDto[]
  pendingRequestsReceived: FriendItemDto[]
  pendingRequestsSent: FriendItemDto[]
}

export interface RespondFriendRequestDto {
  action: 'accept' | 'reject'
}

export type FriendshipStatus =
  | 'accepted'
  | 'pending_incoming'
  | 'pending_outgoing'
  | 'pending_sent'
  | 'pending_received'
  | 'suggestion'
  | 'none'
  | 'blocked'
  | 'self'

export interface FriendUser {
  id: number
  fullName: string
  email: string
  avatarUrl: string
  coverUrl?: string
  rankLevel?: string
  reputationScore?: number
  city: string
  bio: string
  mutualFriendsCount: number
  commonPlacesCount?: number
  status: FriendshipStatus
  connectedDate?: string
  blockedDate?: string
}

