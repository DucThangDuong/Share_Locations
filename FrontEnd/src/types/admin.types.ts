export type AdminMainTab =
  | "dashboard"
  | "users"
  | "places"
  | "proposals"
  | "reviews_comments"
  | "reports"
  | "foods"
  | "collections"
  | "provinces"
  | "blogs"
  | "categories"
  | "notifications_profile"
  | "audit_logs";

// Sub-tabs inside PLACE DETAIL FORM & HUB
export type PlaceDetailTab =
  | "info"
  | "contact"
  | "map"
  | "media"
  | "backlinks"
  | "reviews"
  | "proposals"
  | "reports";

// Place Media Item
export interface PlaceMediaItem {
  id: number;
  url: string;
  type: "image" | "video" | "360";
  isCover: boolean;
  isVerified: boolean;
  status: "active" | "hidden";
  uploadedBy: string;
  uploadedAt: string;
}

// Review Item
export interface PlaceReviewItem {
  id: number;
  placeId: number;
  placeName: string;
  category: string;
  province: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
  status: "active" | "hidden";
  reportCount: number;
  reportReason?: string;
  visitDate: string;
}

// Comment Item
export interface PlaceCommentItem {
  id: number;
  reviewId?: number;
  blogId?: number;
  placeId?: number;
  placeName?: string;
  category?: string;
  authorName?: string;
  userName?: string;
  authorAvatar?: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  status: "active" | "hidden";
  reportCount: number;
  reportReason?: string;
  parentId?: number;
  replyToName?: string;
}

// Admin Assignment Info
export interface AdminAssignmentInfo {
  adminId: number;
  adminName: string;
  role: string | number;
  avatar?: string;
  roleId?: number | string;
}

// Admin Proposal Item
export interface AdminProposalItem {
  id: number;
  type?: "new_place" | "update_info" | "correction" | string;
  placeName: string;
  coverImg?: string;
  address?: string;
  categoryName?: string;
  category?: string;
  provinceName?: string;
  province?: string;
  proposerName?: string;
  proposedBy?: string;
  proposerAvatar?: string;
  userAvatar?: string;
  submittedAt: string;
  status: 0 | 1 | 2; // 0: Pending, 1: Approved, 2: Rejected
  adminNotes?: string | null;
  adminNote?: string | null;
  rejectionReason?: string | null;
  rejectReason?: string | null;
  note?: string | null;
  proposer?: {
    id?: number;
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  placeData?: {
    name?: string;
    categoryId?: number;
    categoryName?: string;
    provinceId?: number;
    provinceName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    website?: string;
    openingHours?: string;
    minPrice?: number;
    maxPrice?: number;
    isFree?: boolean;
    description?: string;
    coverImg?: string;
    images?: string[];
    mediaUrls?: string[];
  };
  proposedData?: {
    name?: string;
    address?: string;
    hours?: string;
    phone?: string;
    description?: string;
    imageUrl?: string;
    coverImg?: string;
    images?: string[];
    mediaUrls?: string[];
    category?: string;
    price?: string;
  };
}

// Admin Report Item
export type ReportTypeCode =
  | "SPAM"
  | "WRONG_INFO"
  | "CLOSED"
  | "INAPPROPRIATE"
  | "DEFAMATION"
  | "COPYRIGHT"
  | "OTHER";

export interface AdminReportItem {
  id: number;
  codeId: string;
  targetType: "place" | "review" | "comment" | "blog" | "photo";
  targetId: number;
  targetTitle: string;
  targetSubtitle?: string;
  targetContent?: string;
  targetRating?: number;
  targetAuthor?: string;
  reporterName: string;
  reporterAvatar?: string;
  reportTypeCode?: ReportTypeCode | string;
  reportTypeName: string;
  reportReasonCategory?: string;
  reasonContent: string;
  description: string;
  evidenceUrl?: string;
  submittedAt: string;
  priority: "urgent" | "high" | "normal" | "low";
  slaStatus: "normal" | "warning" | "breached";
  status: 0 | 1 | 2; 
  assignedToAdminId?: number;
  assignedToAdminName?: string;
  resolutionAction?: string;
  resolutionNote?: string;
  province: string;
  category: string;
}

// Grouped Report Type for Moderation Drawer
export interface GroupedReport {
  groupKey: string;
  targetType: "place" | "review" | "comment" | "blog" | "photo";
  targetId: number;
  targetTitle: string;
  targetSubtitle?: string;
  targetImage?: string;
  targetContent?: string;
  targetRating?: number;
  province: string;
  category: string;
  reportsCount: number;
  reportsList: AdminReportItem[];
  highestPriority: "urgent" | "high" | "normal" | "low";
  latestReportTime: string;
  assignedAdminId?: number;
  assignedAdminName?: string;
  hasUnresolvedUrgent: boolean;
  status: 0 | 1 | 2;
}

// Food & Specialities
export interface AdminFoodItem {
  id: number;
  name: string;
  province: string;
  provinceId?: number;
  coverImg: string;
  imageUrl?: string;
  desc: string;
  description?: string;
  historyInfo?: string;
  priceRange?: string;
  specialtyType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: "active" | "hidden";
  statusNum?: number; // 1: Active (Công khai), 3: Hidden (Tạm ẩn)
  placesCount?: number;
}

// Blog Item for Admin
export interface AdminBlogItem {
  id: number;
  title: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  publishedAt: string;
  views: number;
  likes: number;
  status: "published" | "draft" | "hidden" | "archived";
  coverImg: string;
  summary?: string;
  content?: string;
  readTime?: string;
}

// Audit Log Item
export interface AdminAuditLog {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  targetType: string;
  targetName: string;
  details: string;
  timestamp: string;
  type: "approve" | "reject" | "edit" | "hide" | "create" | "resolve" | "delete";
}

// Report Reason
export interface ReportReason {
  id: number;
  content: string;
  desc: string;
  category?: string;
}

// Report Target Info (for universal ReportModal)
export type ReportTargetType = "place" | "review" | "comment" | "blog" | "photo" | "user";

export interface ReportTargetInfo {
  targetType: ReportTargetType;
  targetId?: number;
  targetTitle: string;
  targetSubtitle?: string;
  targetContent?: string;
  targetAuthor?: string;
  targetRating?: number;
  targetImage?: string;
  province?: string;
  category?: string;
}

// ── ADMIN USER MANAGEMENT TYPES ──
export interface AdminUserCategoryScope {
  categoryId: number;
  categoryName: string;
}

export interface AdminUserProvinceScope {
  provinceId: number;
  provinceName: string;
}

export interface AdminUserRegionScope {
  regionId: number;
  regionName: string;
}

export interface AdminUserItem {
  id?: number;
  userId: number;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | "BANNED" | number | string;
  statusName?: string;
  createdAt: string;
  lastLoginAt?: string | null;
  roles: string[];
  categoryAdminsCount?: number;
  systemAdminsCount?: number;
  regularUsersCount?: number;
  categoryScopes?: AdminUserCategoryScope[];
  provinceScopes?: AdminUserProvinceScope[];
  regionScopes?: AdminUserRegionScope[];
  managedCategories?: AdminUserCategoryScope[];
  managedProvinces?: AdminUserProvinceScope[];
  managedRegions?: AdminUserRegionScope[];
}

export interface AdminUsersMeta {
  page: number;
  size: number;
  pageSize?: number;
  totalElements: number;
  totalCount?: number;
  totalPages: number;
  categoryAdminsCount?: number;
  systemAdminsCount?: number;
  regularUsersCount?: number;
}

export interface AdminUsersQueryParams {
  role?: "USER" | "CATEGORY_ADMIN" | "SYSTEM_ADMIN" | string;
  categoryId?: number;
  provinceId?: number;
  regionId?: number;
  placeId?: number;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminUserDetail {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  status: number | string;
  rankLevel?: string;
  reputationScore?: number;
  createdAt?: string;
  lastLoginAt?: string;
  roles: string[];
  categoryScopes?: AdminUserCategoryScope[];
  provinceScopes?: AdminUserProvinceScope[];
  regionScopes?: AdminUserRegionScope[];
  statistics?: {
    totalApprovedPlaces?: number;
    totalModeratedReviews?: number;
    totalHandledReports?: number;
  };
}

export interface AdminUserActivities {
  reviews?: Array<{
    id: number;
    placeId?: number;
    placeName: string;
    category?: string;
    province?: string;
    rating: number;
    content: string;
    createdAt?: string;
    likes?: number;
    status?: string | number;
  }>;
  blogs?: Array<{
    id: number;
    title: string;
    category?: string;
    views?: number;
    likes?: number;
    publishedAt?: string;
    readTime?: string;
    status?: string | number;
  }>;
  trips?: Array<{
    id: number;
    title: string;
    duration?: string;
    placesCount?: number;
    likes?: number;
    createdAt?: string;
    status?: string | number;
  }>;
  proposals?: Array<{
    id: number;
    placeName: string;
    category?: string;
    province?: string;
    submittedAt?: string;
    status?: number | string;
    badgeColor?: string;
  }>;
}

export interface AdminUserAccessHistoryItem {
  id?: number | string;
  logId?: string;
  action: string;
  targetType?: string;
  targetId?: number;
  target?: string;
  targetName?: string;
  category?: string;
  province?: string;
  time?: string;
  timestamp?: string;
  result?: string;
  ip?: string;
  ipAddress?: string;
}

export interface UpdateAdminUserScopesRequest {
  categoryIds: number[];
  provinceIds: number[];
  regionIds?: number[];
  note?: string;
}

