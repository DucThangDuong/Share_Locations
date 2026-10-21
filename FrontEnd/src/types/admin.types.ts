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
  | "settings"
  | "admin_profile"
  | "notifications_profile"
  | "audit_logs"
  | "rankings";

export type PlaceDetailTab =
  | "info"
  | "contact"
  | "map"
  | "media"
  | "backlinks"
  | "reviews"
  | "proposals"
  | "reports";

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

export interface AdminAssignmentInfo {
  adminId: number;
  adminName: string;
  role: string | number;
  avatar?: string;
  roleId?: number | string;
}

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
  createdAt?: string;
  updatedAt?: string;
  status: 0 | 1 | 2;
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
  targetImage?: string;
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
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  createdBy?: string;
  status?: "active" | "hidden";
  statusNum?: number;
  placesCount?: number;
}

export interface AdminBlogItem {
  id: number;
  title: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  publishedAt: string;
  views: number;
  viewCount?: number;
  likes: number;
  likeCount?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  createdBy?: string;
  status: "published" | "draft" | "hidden" | "archived";
  coverImg: string;
  summary?: string;
  content?: string;
  readTime?: string;
}

export interface AdminAuditLogItem {
  id: number;
  adminId: number;
  adminName: string;
  adminEmail: string;
  adminAvatar: string | null;
  actorRoleCode: "SystemAdmin" | "CategoryAdmin" | string;
  actionType: string;
  targetTable: string;
  targetId: number;
  targetName: string;
  actionStatus: number;
  actionStatusText: string;
  reason: string;
  ipAddress: string;
  createdAt: string;
}

export interface AdminAuditLogDetail extends AdminAuditLogItem {
  oldDataJSON: string | null;
  newDataJSON: string | null;
  metadataJSON: string | null;
  requestId: string;
  userAgent: string;
}

export interface GetAdminAuditLogsParams {
  page?: number;
  pageSize?: number;
  adminId?: number;
  actionType?: string;
  targetTable?: string;
  targetId?: number;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
}

export interface AdminAuditLogsData {
  items: AdminAuditLogItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

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

export interface ReportReason {
  id: number;
  content: string;
  desc: string;
  category?: string;
}

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

export interface UpdateUserRoleRequest {
  role: "USER" | "CATEGORY_ADMIN" | "SYSTEM_ADMIN" | string;
  categoryIds?: number[];
  provinceIds?: number[];
  regionIds?: number[];
  reason?: string;
}

export interface UpdateUserRoleResponseData {
  userId: number;
  newRole: string;
  roles: string[];
  scopeCategoriesCount?: number;
  scopeProvincesCount?: number;
  scopeRegionsCount?: number;
  message?: string;
}

export interface AdminGeographyRegionItem {
  id: number;
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  orderIndex?: number;
  status?: number;
  statusName?: string;
  totalProvinces?: number;
  activeProvinces?: number;
}

export interface AdminGeographyProvinceItem {
  id: number;
  regionId: number;
  regionName?: string;
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
  displayOrder?: number;
  status?: number;
  statusName?: string;
  placeCount?: number;
  foodCount?: number;
  proposalCount?: number;
  assignedAdminsCount?: number;
}

export interface AdminCatalogPlaceTypeItem {
  id: number;
  name: string;
  slug?: string;
  imageUrl?: string;
  status?: number;
  statusName?: string;
  totalCategories?: number;
  activeCategories?: number;
}

export interface AdminCatalogCategoryItem {
  id: number;
  placeTypeId: number;
  placeTypeName?: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  status?: number;
  statusName?: string;
  placeCount?: number;
  blogCount?: number;
  proposalCount?: number;
  assignedAdminsCount?: number;
}

export interface AdminReportTypeItem {
  id: number;
  code: string;
  name: string;
  targetScope: "PLACE" | "CONTENT" | "ALL" | string;
  targetScopeName?: string;
  isActive: boolean;
  statusName?: string;
  displayOrder?: number;
  totalReportsCount?: number;
}

export interface AdminSystemSettingItem {
  id: number;
  settingKey: string;
  settingName?: string;
  settingValue: string;
  settingGroup: "GENERAL" | "MODERATION" | "SECURITY" | string;
  settingGroupName?: string;
  description?: string;
  updatedAt?: string;
  updatedBy?: number;
  updatedByName?: string;
}

