// 11 TABS THEO ĐÚNG ĐẶC TẢ HỆ THỐNG
export type AdminMainTab =
  | "dashboard"             // 1. Tổng quan (Dashboard)
  | "places"                // 2. Địa điểm (Places, PlaceMedia)
  | "proposals"             // 3. Đề xuất đóng góp (Proposals)
  | "reviews_comments"      // 4. Đánh giá & Bình luận (Reviews, Comments)
  | "reports"               // 5. Báo cáo vi phạm (PlaceReports, ReviewReports, CommentReports, BlogReports)
  | "foods"                 // 6. Ẩm thực & Đặc sản (Foods, FoodPlaces, FoodProvinces)
  | "collections"           // 7. Bộ sưu tập (Collections, CollectionPlaces)
  | "provinces"             // 8. Tỉnh/Thành trong vùng (Provinces, Regions)
  | "blogs"                 // 9. Blog & Cẩm nang (Blogs)
  | "categories"            // 10. Danh mục (chỉ xem: PlaceTypes, Categories)
  | "notifications_profile" // 11. Thông báo & Hồ sơ cá nhân (Notifications, UserProfiles)
  | "audit_logs";           // Nhật ký kiểm toán

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
  role: string;
  avatar?: string;
}

// Admin Proposal Item
export interface AdminProposalItem {
  id: number;
  type: "new_place" | "update_info" | "correction";
  placeName: string;
  proposedBy: string;
  userAvatar?: string;
  category: string;
  province: string;
  submittedAt: string;
  status: 0 | 1 | 2; // 0: Pending, 1: Approved, 2: Rejected
  proposedData: {
    name?: string;
    address?: string;
    hours?: string;
    phone?: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    price?: string;
  };
  note?: string;
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
  status: 0 | 1 | 2; // 0: Pending, 1: Resolved, 2: Dismissed
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
  coverImg: string;
  imageUrl?: string;
  desc: string;
  description?: string;
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
  status: "published" | "draft" | "hidden";
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
export type ReportTargetType = "place" | "review" | "comment" | "blog" | "photo";

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
