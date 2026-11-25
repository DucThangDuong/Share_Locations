export interface NotificationItem {
  id: number;
  userId: number;
  actorUserId?: number | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  title: string;
  content: string;
  type: number;
  typeName?: string;
  priority: number;
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
  4: { name: 'Chuyến đi', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  5: { name: 'Đề xuất địa điểm', iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  6: { name: 'Kiểm duyệt & Báo cáo', iconColor: 'text-rose-600', bgColor: 'bg-rose-50' },
};

const VALID_NOTIFICATION_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/(explore|diadiem)$/,
  /^\/(places|dia-diem)\/[^/]+$/,
  /^\/map$/,
  /^\/(itinerary|my-trips|itineraries|hanh-trinh|trips|trip|chuyen-di)(\/[^/]+)?$/,
  /^\/(blog|cam-nang)(\/[^/]+)?$/,
  /^\/(regions|mien)(\/[^/]+)?$/,
  /^\/(provinces|province|tinh-thanh)(\/[^/]+)?$/,
  /^\/tinh\/[^/]+$/,
  /^\/(rankings|bang-xep-hang|bxh|leaderboard)$/,
  /^\/(propose-place|de-xuat|de-xuat-dia-diem)$/,
  /^\/(profile|trang-ca-nhan)(\/[^/]+)?$/,
  /^\/(user|users|u)\/[^/]+$/,
  /^\/(settings|cai-dat)$/,
  /^\/chat$/,
  /^\/(directions|chi-duong)$/,
  /^\/admin(\/.*)?$/
];

function isValidAppRoute(url: string): boolean {
  const pathOnly = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return VALID_NOTIFICATION_ROUTE_PATTERNS.some((pattern) => pattern.test(pathOnly));
}

function getFallbackNotificationUrl(item?: Partial<NotificationItem>): string | null {
  if (!item) return null;
  const entityType = item.entityType?.toUpperCase();
  const entityId = item.entityId ?? item.referenceId;

  if (entityType === 'PLACE' && entityId) {
    return `/places/${entityId}`;
  }
  if (entityType === 'TRIP') {
    return entityId ? `/itinerary/${entityId}` : '/itinerary';
  }
  if (entityType === 'CHAT_ROOM') {
    return entityId ? `/chat?conversation=${entityId}` : '/chat';
  }
  if (entityType === 'BLOG') {
    return entityId ? `/blog/${entityId}` : '/blog';
  }
  if (entityType === 'PROPOSAL') {
    return '/profile?tab=proposals';
  }
  if (entityType === 'REVIEW') {
    return '/profile?tab=reviews';
  }
  if (entityType === 'USER') {
    return entityId ? `/profile/${entityId}` : item.actorUserId ? `/profile/${item.actorUserId}` : '/profile';
  }

  switch (item.type) {
    case 1:
      return '/explore';
    case 2:
      return item.actorUserId ? `/profile/${item.actorUserId}` : '/profile';
    case 3:
      return '/profile?tab=reviews';
    case 4:
      return entityId ? `/itinerary/${entityId}` : '/itinerary';
    case 5:
      return '/profile?tab=proposals';
    case 6:
      return '/settings';
    default:
      return null;
  }
}

export function normalizeNotificationUrl(
  url?: string | null,
  item?: Partial<NotificationItem>
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return getFallbackNotificationUrl(item);
  }

  let normalized = trimmed;

  if (/^\/reviews?(\/|$|[?#])/i.test(normalized)) {
    return '/profile?tab=reviews';
  }
  if (/^\/account(\/|$|[?#])/i.test(normalized)) {
    return '/settings';
  }
  if (/^\/chat\?room=(\d+)/i.test(normalized)) {
    normalized = normalized.replace(/^\/chat\?room=/i, '/chat?conversation=');
  } else if (/^\/trips\//i.test(normalized)) {
    normalized = normalized.replace(/^\/trips\//i, '/itinerary/');
  } else if (/^\/trip\//i.test(normalized)) {
    normalized = normalized.replace(/^\/trip\//i, '/itinerary/');
  } else if (/^\/blogs\//i.test(normalized)) {
    normalized = normalized.replace(/^\/blogs\//i, '/blog/');
  } else if (/^\/blogs(\?|$|#)/i.test(normalized)) {
    normalized = normalized.replace(/^\/blogs/i, '/blog');
  } else if (/^\/proposals?(\/|$|[?#])/i.test(normalized)) {
    return '/profile?tab=proposals';
  } else if (/^\/friends(\/|$|[?#])/i.test(normalized)) {
    return item?.actorUserId ? `/profile/${item.actorUserId}` : '/profile';
  } else if (/^\/place\//i.test(normalized)) {
    normalized = normalized.replace(/^\/place\//i, '/places/');
  } else if (/^\/places(\?|$|#)/i.test(normalized)) {
    normalized = normalized.replace(/^\/places/i, '/explore');
  } else if (/^\/comments?(\/|$|[?#])/i.test(normalized)) {
    return '/profile?tab=reviews';
  } else if (/^\/visit-logs?(\/|$|[?#])/i.test(normalized)) {
    return '/profile?tab=visit_logs';
  }

  if (isValidAppRoute(normalized)) {
    return normalized;
  }

  return getFallbackNotificationUrl(item);
}
