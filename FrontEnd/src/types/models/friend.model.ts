export interface FriendItemDto {
  id: number
  name: string
  avatar?: string | null
  coverUrl?: string | null
  email?: string | null
  bio?: string | null
  rankLevel?: string | null
  reputationScore?: number
  mutualFriendsCount: number
  tripsCount: number
  status: string
  requestedAt?: string | null
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
  avatarUrl?: string | null
  coverUrl?: string | null
  city?: string
  bio?: string
  rankLevel?: string | null
  reputationScore?: number
  mutualFriendsCount: number
  status: FriendshipStatus
  connectedDate?: string
}
