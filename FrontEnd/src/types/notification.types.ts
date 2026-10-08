export interface NotificationItem {
  id: number;
  userId: number;
  actorUserId?: number | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  title: string;
  content: string;
  type: number; // 1: System, 2: Social, 3: Review, 4: Trip, 5: Proposal, 6: Moderation
  typeName?: string;
  priority: number; // 1: Urgent, 2: Normal, 3: Low
  groupKey?: string | null;
  deduplicationKey?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  referenceId?: number | null;
  targetUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  dataJSON?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagedResult {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

export const NOTIFICATION_TYPE_MAP: Record<
  number,
  { name: string; iconColor: string; bgColor: string }
> = {
  1: { name: 'Hệ thống', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  2: { name: 'Bạn bè & Xã hội', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  3: { name: 'Đánh giá & Bình luận', iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
  4: { name: 'Chuyến đi & Lịch trình', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  5: { name: 'Đề xuất địa điểm', iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  6: { name: 'Kiểm duyệt & Báo cáo', iconColor: 'text-rose-600', bgColor: 'bg-rose-50' },
};
