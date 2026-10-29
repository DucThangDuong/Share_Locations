import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Star,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  ShieldAlert,
  X,
  Calendar,
  MessageSquare,
  AlertTriangle,
  User,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import type { PlaceReviewItem, PlaceCommentItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import { CustomSelect } from "@/components/common/CustomSelect";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

interface ReviewsCommentsTabProps {
  revComTab: "reviews" | "comments";
  setRevComTab: (tab: "reviews" | "comments") => void;
  reviewsList: PlaceReviewItem[];
  setReviewsList: React.Dispatch<React.SetStateAction<PlaceReviewItem[]>>;
  commentsList: PlaceCommentItem[];
  setCommentsList: React.Dispatch<React.SetStateAction<PlaceCommentItem[]>>;
  revReportFilter: string;
  setRevReportFilter: (v: string) => void;
  addAuditLog: (
    action: string,
    targetName: string,
    details: string,
    type: "approve" | "reject" | "resolve" | "hide"
  ) => void;
  showToast: (msg: string) => void;
  onSortChange?: (field?: string, order?: "asc" | "desc") => void;
}

export const ReviewsCommentsTab: React.FC<ReviewsCommentsTabProps> = ({
  revComTab,
  setRevComTab,
  reviewsList,
  setReviewsList,
  commentsList,
  setCommentsList,
  revReportFilter,
  setRevReportFilter,
  addAuditLog,
  showToast,
  onSortChange,
}) => {
  const location = useLocation();

  const [searchText, setSearchText] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const [selectedReview, setSelectedReview] = useState<PlaceReviewItem | null>(null);
  const [selectedComment, setSelectedComment] = useState<PlaceCommentItem | null>(null);

  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Tự động nhận diện tab Nghi vấn hoặc Trạng thái từ URL query (ví dụ ?status=pending)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status")?.toLowerCase();
    if (statusParam === "pending" || statusParam === "suspicious") {
      setStatusFilter("pending");
      setCurrentPage(1);
    } else if (statusParam === "active") {
      setStatusFilter("active");
      setCurrentPage(1);
    } else if (statusParam === "hidden") {
      setStatusFilter("hidden");
      setCurrentPage(1);
    }
  }, [location.search]);

  // Danh sách đã lọc theo từ khóa / số sao (trước khi lọc theo tab trạng thái)
  const baseFilteredReviews = useMemo(
    () =>
      reviewsList.filter((rev) => {
        if (revReportFilter === "reported" && rev.reportCount === 0) return false;
        if (ratingFilter !== "all") {
          if (ratingFilter === "reported") {
            if (rev.reportCount === 0) return false;
          } else {
            const targetRating = parseInt(ratingFilter, 10);
            if (Math.round(rev.rating) !== targetRating) return false;
          }
        }
        if (searchText.trim()) {
          const q = searchText.trim().toLowerCase();
          const matchUser = (rev.userName || "").toLowerCase().includes(q);
          const matchContent = (rev.content || "").toLowerCase().includes(q);
          const matchPlace = (rev.placeName || "").toLowerCase().includes(q);
          if (!matchUser && !matchContent && !matchPlace) return false;
        }
        return true;
      }),
    [reviewsList, revReportFilter, ratingFilter, searchText]
  );

  const baseFilteredComments = useMemo(
    () =>
      commentsList.filter((comm) => {
        if (searchText.trim()) {
          const q = searchText.trim().toLowerCase();
          const matchUser = (comm.authorName || comm.userName || "").toLowerCase().includes(q);
          const matchContent = (comm.content || "").toLowerCase().includes(q);
          const matchPlace = (comm.placeName || "").toLowerCase().includes(q);
          if (!matchUser && !matchContent && !matchPlace) return false;
        }
        return true;
      }),
    [commentsList, searchText]
  );

  // Bộ đếm trạng thái đánh giá (cập nhật động theo bộ lọc tìm kiếm / số sao)
  const pendingReviewsCount = useMemo(
    () => baseFilteredReviews.filter((r) => r.status === "pending").length,
    [baseFilteredReviews]
  );
  const activeReviewsCount = useMemo(
    () => baseFilteredReviews.filter((r) => r.status === "active").length,
    [baseFilteredReviews]
  );
  const hiddenReviewsCount = useMemo(
    () => baseFilteredReviews.filter((r) => r.status === "hidden").length,
    [baseFilteredReviews]
  );
  const reportedReviewsCount = useMemo(
    () => baseFilteredReviews.filter((r) => r.reportCount > 0).length,
    [baseFilteredReviews]
  );

  // Bộ đếm trạng thái bình luận (cập nhật động theo bộ lọc tìm kiếm)
  const activeCommentsCount = useMemo(
    () => baseFilteredComments.filter((c) => c.status === "active").length,
    [baseFilteredComments]
  );
  const hiddenCommentsCount = useMemo(
    () => baseFilteredComments.filter((c) => c.status === "hidden").length,
    [baseFilteredComments]
  );

  const filteredReviews = useMemo(
    () =>
      statusFilter === "all"
        ? baseFilteredReviews
        : baseFilteredReviews.filter((rev) => rev.status === statusFilter),
    [baseFilteredReviews, statusFilter]
  );

  const filteredComments = useMemo(
    () =>
      statusFilter === "all"
        ? baseFilteredComments
        : baseFilteredComments.filter((comm) => comm.status === statusFilter),
    [baseFilteredComments, statusFilter]
  );

  type SortField = "rating" | "createdAt" | "placeName" | null;
  type SortOrder = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: "rating" | "createdAt" | "placeName") => {
    let nextOrder: SortOrder = "desc";
    let nextField: SortField = field;
    if (sortField === field) {
      if (sortOrder === "desc") {
        nextOrder = "asc";
      } else {
        nextField = null;
      }
    } else {
      nextOrder = field === "rating" ? "desc" : "desc";
    }
    setSortField(nextField);
    setSortOrder(nextOrder);
    onSortChange?.(nextField || undefined, nextField ? nextOrder : undefined);
  };

  const renderSortIcon = (field: "rating" | "createdAt" | "placeName") => {
    if (sortField !== field) {
      return (
        <ArrowUpDown
          size={12}
          className="text-slate-300 group-hover:text-slate-500 transition-colors"
        />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-emerald-700" />
    ) : (
      <ArrowDown size={12} className="text-emerald-700" />
    );
  };

  const sortedReviews = useMemo(() => {
    if (!sortField) return filteredReviews;
    return [...filteredReviews].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === "createdAt") {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (sortField === "rating") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortField === "placeName") {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredReviews, sortField, sortOrder]);

  const sortedComments = useMemo(() => {
    if (!sortField) return filteredComments;
    return [...filteredComments].sort((a, b) => {
      let valA: any = a[sortField as keyof PlaceCommentItem];
      let valB: any = b[sortField as keyof PlaceCommentItem];
      if (sortField === "createdAt") {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (sortField === "placeName") {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredComments, sortField, sortOrder]);

  const totalItems = revComTab === "reviews" ? sortedReviews.length : sortedComments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginationItems = useMemo((): (number | string)[] => {
    const total = Math.max(1, totalPages);
    const current = Math.max(1, currentPage);

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-r", total];
    }
    if (current >= total - 3) {
      return [1, "ellipsis-l", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "ellipsis-l", current - 1, current, current + 1, "ellipsis-r", total];
  }, [totalPages, currentPage]);

  const displayedReviews = sortedReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const displayedComments = sortedComments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Xử lý duyệt và công khai bài đánh giá
  const handleApproveReview = async (reviewId: number) => {
    try {
      await adminService.updateReviewStatus(reviewId, "active");
      setReviewsList((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            addAuditLog(
              "Duyệt công khai đánh giá",
              `Đánh giá #${r.id}`,
              `Xác nhận đánh giá hợp lệ tại ${r.placeName}`,
              "approve"
            );
            return { ...r, status: "active", hiddenReason: null };
          }
          return r;
        })
      );
      showToast("Đã duyệt và công khai bài đánh giá thành công.");
      setSelectedReview((prev) =>
        prev && prev.id === reviewId ? { ...prev, status: "active", hiddenReason: null } : prev
      );
      setOpenActionMenuId(null);
    } catch {
      showToast("Có lỗi xảy ra khi cập nhật trạng thái.");
    }
  };

  // Xử lý tạm ẩn hoặc mở lại bài đánh giá
  const handleToggleHideReview = async (reviewId: number) => {
    const review = reviewsList.find((item) => item.id === reviewId);
    if (!review) return;
    const nextStatus = review.status === "hidden" ? "active" : "hidden";
    try {
      await adminService.updateReviewStatus(reviewId, nextStatus);
      setReviewsList((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            addAuditLog(
              nextStatus === "hidden" ? "Tạm ẩn đánh giá" : "Công khai đánh giá",
              `Đánh giá #${r.id}`,
              `Cập nhật trạng thái đánh giá tại ${r.placeName}`,
              "hide"
            );
            return {
              ...r,
              status: nextStatus,
              hiddenReason: nextStatus === "active" ? null : (r.hiddenReason || "Tạm ẩn bởi quản trị viên"),
            };
          }
          return r;
        })
      );
      showToast(`Đã ${nextStatus === "hidden" ? "tạm ẩn" : "công khai"} đánh giá.`);
      setSelectedReview((prev) =>
        prev && prev.id === reviewId
          ? {
            ...prev,
            status: nextStatus,
            hiddenReason: nextStatus === "active" ? null : (prev.hiddenReason || "Tạm ẩn bởi quản trị viên"),
          }
          : prev
      );
      setOpenActionMenuId(null);
    } catch {
      showToast("Có lỗi xảy ra khi cập nhật trạng thái.");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đánh giá này vĩnh viễn?")) return;
    try {
      await adminService.deleteReview(reviewId);
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      addAuditLog(
        "Xóa đánh giá vĩnh viễn",
        `Đánh giá #${reviewId}`,
        "Xóa theo yêu cầu kiểm duyệt",
        "hide"
      );
      showToast("Đã xóa đánh giá vĩnh viễn.");
      setSelectedReview(null);
      setOpenActionMenuId(null);
    } catch {
      showToast("Có lỗi xảy ra khi xóa đánh giá.");
    }
  };

  // Xử lý tạm ẩn hoặc mở lại bình luận
  const handleToggleHideComment = async (commentId: number) => {
    const comment = commentsList.find((item) => item.id === commentId);
    if (!comment) return;
    const nextStatus = comment.status === "hidden" ? "active" : "hidden";
    try {
      await adminService.updateCommentStatus(commentId, nextStatus);
      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            addAuditLog(
              nextStatus === "hidden" ? "Tạm ẩn bình luận" : "Công khai bình luận",
              `Bình luận #${c.id}`,
              "Cập nhật trạng thái bình luận",
              "hide"
            );
            return { ...c, status: nextStatus };
          }
          return c;
        })
      );
      showToast(`Đã ${nextStatus === "hidden" ? "tạm ẩn" : "công khai"} bình luận.`);
      setSelectedComment((prev) =>
        prev && prev.id === commentId ? { ...prev, status: nextStatus } : prev
      );
      setOpenActionMenuId(null);
    } catch {
      showToast("Có lỗi xảy ra khi cập nhật bình luận.");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này vĩnh viễn?")) return;
    try {
      await adminService.deleteComment(commentId);
      setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
      addAuditLog(
        "Xóa bình luận vĩnh viễn",
        `Bình luận #${commentId}`,
        "Xóa theo yêu cầu kiểm duyệt",
        "hide"
      );
      showToast("Đã xóa bình luận vĩnh viễn.");
      setSelectedComment(null);
      setOpenActionMenuId(null);
    } catch {
      showToast("Có lỗi xảy ra khi xóa bình luận.");
    }
  };

  const handleResetFilters = () => {
    setSearchText("");
    setRatingFilter("all");
    setStatusFilter("all");
    setRevReportFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchText.trim() !== "" ||
    ratingFilter !== "all" ||
    statusFilter !== "all" ||
    revReportFilter !== "all";

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={13}
            className={
              star <= rounded
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-xs font-sans">
      {/* Khối bộ lọc chính & phân loại */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Hàng 1: Tabs Đánh giá / Bình luận và Khung tìm kiếm + Lọc sao */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl font-medium">
            <button
              onClick={() => {
                setRevComTab("reviews");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${revComTab === "reviews"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Đánh giá địa điểm ({baseFilteredReviews.length})
              {reportedReviewsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {reportedReviewsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRevComTab("comments");
                if (statusFilter === "pending") {
                  setStatusFilter("all");
                }
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${revComTab === "comments"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Bình luận ({baseFilteredComments.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm theo nội dung, người dùng, địa điểm..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {revComTab === "reviews" && (
              <CustomSelect
                value={ratingFilter}
                onChange={(val) => {
                  setRatingFilter(val);
                  setRevReportFilter(val === "reported" ? "reported" : "all");
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "Tất cả số sao" },
                  { value: "5", label: "5 sao (★★★★★)" },
                  { value: "4", label: "4 sao (★★★★☆)" },
                  { value: "3", label: "3 sao (★★★☆☆)" },
                  { value: "2", label: "2 sao (★★☆☆☆)" },
                  { value: "1", label: "1 sao (★☆☆☆☆)" },
                  { value: "reported", label: "Có phản ánh vi phạm" },
                ]}
                size="sm"
                className="min-w-[140px]"
              />
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Hàng 2: Thanh Tab Trạng thái (Status Filter Tabs) với Counter Badges nổi bật */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${statusFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${statusFilter === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
                }`}
            >
              {revComTab === "reviews" ? baseFilteredReviews.length : baseFilteredComments.length}
            </span>
          </button>

          {revComTab === "reviews" && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                : "text-amber-800 hover:bg-amber-50 border border-amber-200/80 bg-amber-50/50"
                }`}
            >
              <AlertTriangle
                size={13}
                className={statusFilter === "pending" ? "text-white" : "text-amber-600"}
              />
              <span>Nghi vấn</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusFilter === "pending" ? "bg-amber-600 text-white" : "bg-amber-200 text-amber-900"
                  }`}
              >
                {pendingReviewsCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setStatusFilter("active");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
              }`}
          >
            <CheckCircle2
              size={13}
              className={statusFilter === "active" ? "text-white" : "text-emerald-600"}
            />
            <span>Công khai</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${statusFilter === "active" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
                }`}
            >
              {revComTab === "reviews" ? activeReviewsCount : activeCommentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("hidden");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${statusFilter === "hidden"
              ? "bg-slate-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <EyeOff
              size={13}
              className={statusFilter === "hidden" ? "text-white" : "text-slate-400"}
            />
            <span>Tạm ẩn</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${statusFilter === "hidden" ? "bg-slate-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
            >
              {revComTab === "reviews" ? hiddenReviewsCount : hiddenCommentsCount}
            </span>
          </button>
        </div>

        {/* Bảng dữ liệu chuẩn hóa Table Header 100% IN HOA Tiếng Việt */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white min-h-[380px] pb-16">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-5 min-w-[280px]">
                  {revComTab === "reviews" ? "NGƯỜI ĐÁNH GIÁ & NỘI DUNG" : "NGƯỜI BÌNH LUẬN & NỘI DUNG"}
                </th>
                <th className="p-3.5 min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => handleSort("placeName")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo địa điểm / bài viết"
                  >
                    <span>{revComTab === "reviews" ? "ĐỊA ĐIỂM" : "BÀI VIẾT / ĐỊA ĐIỂM"}</span>
                    {renderSortIcon("placeName")}
                  </button>
                </th>
                {revComTab === "reviews" && (
                  <th className="p-3.5 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => handleSort("rating")}
                      className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                      title="Sắp xếp theo số sao đánh giá"
                    >
                      <span>ĐIỂM SỐ</span>
                      {renderSortIcon("rating")}
                    </button>
                  </th>
                )}
                <th className="p-3.5 min-w-[140px]">TRẠNG THÁI</th>
                <th className="p-3.5 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => handleSort("createdAt")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo thời gian"
                  >
                    <span>THỜI GIAN</span>
                    {renderSortIcon("createdAt")}
                  </button>
                </th>
                <th className="p-3.5 text-right pr-5 min-w-[100px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revComTab === "reviews" ? (
                displayedReviews.map((rev, revIdx) => {
                  const placeImg =
                    (rev as any).placeCoverImg ||
                    (rev as any).placeThumbnail ||
                    (rev as any).coverImg ||
                    (rev.images && rev.images[0]) ||
                    "";
                  const isHidden = rev.status === "hidden";
                  const isPending = rev.status === "pending";
                  const isNearBottom = revIdx >= displayedReviews.length - 2 && displayedReviews.length >= 3;

                  return (
                    <tr
                      key={rev.id}
                      className={`hover:bg-slate-50/60 transition-colors ${isPending ? "bg-amber-50/30" : rev.reportCount > 0 ? "bg-rose-50/20" : ""
                        }`}
                    >
                      <td className="p-3.5 pl-5">
                        <div className="flex items-start gap-3">
                          {rev.userAvatar ? (
                            <img
                              src={rev.userAvatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                              <User size={16} />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {rev.userName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {formatDateTime(rev.createdAt)}
                              </span>
                              {rev.reportCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                                  <ShieldAlert size={10} />
                                  <span>{rev.reportCount} phản ánh</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 max-w-lg font-normal leading-relaxed">
                              {rev.content}
                            </p>
                            {rev.images && rev.images.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  <ImageIcon size={10} className="text-slate-500" />
                                  <span>{rev.images.length} ảnh thực tế</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  {rev.images.slice(0, 3).map((imgUrl, idx) => (
                                    <img
                                      key={idx}
                                      src={imgUrl}
                                      alt=""
                                      className="w-5 h-5 rounded object-cover border border-slate-200"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {placeImg ? (
                            <img
                              src={placeImg}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <MapPin size={15} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                              {rev.placeName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {rev.province || "Toàn quốc"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {rev.rating.toFixed(1)}
                          </span>
                          {renderStars(rev.rating)}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isPending ? (
                            <>
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                                title="Đánh giá có dấu hiệu nghi vấn cần thẩm định"
                              >
                                <AlertTriangle size={12} className="text-amber-600" />
                                <span>Nghi vấn</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleApproveReview(rev.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                                title="Duyệt bài đánh giá này để công khai ngay"
                              >
                                <CheckCircle2 size={12} />
                                <span>Duyệt</span>
                              </button>
                            </>
                          ) : isHidden ? (
                            <button
                              type="button"
                              onClick={() => handleToggleHideReview(rev.id)}
                              className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                              title="Bấm để công khai đánh giá"
                            >
                              Tạm ẩn
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleHideReview(rev.id)}
                              className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer bg-[#e6fcf5] text-[#087f5b] border-[#63e6be] hover:bg-[#d3f9ec]"
                              title="Bấm để tạm ẩn đánh giá"
                            >
                              Công khai
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(rev.createdAt) || "20/10/2026"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 pr-5 text-right relative">
                        <div className="inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId((prev) => (prev === rev.id ? null : rev.id))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Tác vụ"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {openActionMenuId === rev.id && (
                            <div
                              className={`absolute right-5 ${isNearBottom ? "bottom-8" : "top-full mt-1"
                                } w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-30 animate-in fade-in zoom-in-95 text-left`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReview(rev);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <Eye size={13} className="text-emerald-700" />
                                <span>Xem chi tiết</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveReview(rev.id)}
                                    className="w-full px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Duyệt đánh giá</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleHideReview(rev.id)}
                                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <EyeOff size={13} className="text-slate-500" />
                                    <span>Tạm ẩn đánh giá</span>
                                  </button>
                                </>
                              )}

                              {isHidden && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveReview(rev.id)}
                                  className="w-full px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  <span>Công khai đánh giá</span>
                                </button>
                              )}

                              {rev.status === "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleHideReview(rev.id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <EyeOff size={13} className="text-slate-500" />
                                  <span>Tạm ẩn đánh giá</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id)}
                                className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Xóa vĩnh viễn</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                displayedComments.map((comm, commIdx) => {
                  const isHidden = comm.status === "hidden";
                  const isNearBottom = commIdx >= displayedComments.length - 2 && displayedComments.length >= 3;

                  return (
                    <tr
                      key={comm.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="flex items-start gap-3">
                          {comm.authorAvatar || comm.userAvatar ? (
                            <img
                              src={comm.authorAvatar || comm.userAvatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                              <User size={16} />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {comm.authorName || comm.userName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {formatDateTime(comm.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 max-w-lg font-normal leading-relaxed">
                              {comm.content}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                              {comm.placeName || "Cẩm nang du lịch"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isHidden ? (
                            <button
                              type="button"
                              onClick={() => handleToggleHideComment(comm.id)}
                              className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                              title="Bấm để công khai bình luận"
                            >
                              Tạm ẩn
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleHideComment(comm.id)}
                              className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer bg-[#e6fcf5] text-[#087f5b] border-[#63e6be] hover:bg-[#d3f9ec]"
                              title="Bấm để tạm ẩn bình luận"
                            >
                              Công khai
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(comm.createdAt) || "20/10/2026"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 pr-5 text-right relative">
                        <div className="inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId((prev) => (prev === comm.id ? null : comm.id))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Tác vụ"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {openActionMenuId === comm.id && (
                            <div
                              className={`absolute right-5 ${isNearBottom ? "bottom-8" : "top-full mt-1"
                                } w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-30 animate-in fade-in zoom-in-95 text-left`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComment(comm);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <Eye size={13} className="text-emerald-700" />
                                <span>Xem chi tiết</span>
                              </button>

                              {isHidden ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleHideComment(comm.id)}
                                  className="w-full px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  <span>Công khai bình luận</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleHideComment(comm.id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <EyeOff size={13} className="text-slate-500" />
                                  <span>Tạm ẩn bình luận</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comm.id)}
                                className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Xóa vĩnh viễn</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {totalItems === 0 && (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy dữ liệu phù hợp với điều kiện tìm kiếm.
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-2 select-none">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>

            {paginationItems.map((item, idx) => {
              if (typeof item === "string") {
                return (
                  <span
                    key={`${item}-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-xs"
                  >
                    ...
                  </span>
                );
              }

              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "border border-transparent hover:border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Chi tiết đánh giá địa điểm (Đầy đủ Cảnh báo AI, Ảnh thực tế, Footer nút hành động) */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">Chi tiết đánh giá địa điểm</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                {selectedReview.userAvatar ? (
                  <img
                    src={selectedReview.userAvatar}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <User size={20} />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedReview.userName}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} />
                    <span>Đăng ngày: {formatDateTime(selectedReview.createdAt)}</span>
                  </div>
                  {selectedReview.visitDate && (
                    <div className="text-[11px] text-slate-500">
                      Thời điểm ghé thăm: <strong>{selectedReview.visitDate}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-sm font-extrabold text-amber-900">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span>{selectedReview.rating}.0 / 5.0</span>
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">
                  {selectedReview.placeName}
                </div>
                <div className="mt-1">
                  {selectedReview.status === "pending" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      <AlertTriangle size={10} />
                      Nghi vấn kiểm duyệt
                    </span>
                  ) : selectedReview.status === "hidden" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                      Đang tạm ẩn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Đang công khai
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(selectedReview.status === "pending" || selectedReview.hiddenReason) && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>Cảnh báo nghi vấn kiểm duyệt từ AI</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    {selectedReview.hiddenReason ||
                      "Nghi vấn lệch sao hoặc nội dung có dấu hiệu bất thường cần quản trị viên kiểm tra thủ công."}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Nội dung đánh giá:</label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs">
                {selectedReview.content}
              </div>
            </div>

            {/* Hình ảnh thực tế đính kèm */}
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-slate-500" />
                  <span>Hình ảnh thực tế đính kèm ({selectedReview.images.length}):</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {selectedReview.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:shadow-md transition-all block"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                        Xem ảnh ↗
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedReview.reportCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Đánh giá này có {selectedReview.reportCount} lượt báo cáo vi phạm
                  </div>
                  {selectedReview.reportReason && (
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      Lý do: {selectedReview.reportReason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer nút hành động đầy đủ */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteReview(selectedReview.id)}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
                <span>Xóa vĩnh viễn</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedReview.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleHideReview(selectedReview.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <EyeOff size={14} />
                      <span>Tạm ẩn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveReview(selectedReview.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      <span>Duyệt công khai</span>
                    </button>
                  </>
                ) : selectedReview.status === "hidden" ? (
                  <button
                    type="button"
                    onClick={() => handleApproveReview(selectedReview.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    <span>Công khai đánh giá</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleHideReview(selectedReview.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <EyeOff size={14} />
                    <span>Tạm ẩn đánh giá</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedComment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">Chi tiết bình luận bài viết</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComment(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              {selectedComment.authorAvatar || selectedComment.userAvatar ? (
                <img
                  src={selectedComment.authorAvatar || selectedComment.userAvatar}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  alt=""
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <User size={20} />
                </div>
              )}
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedComment.authorName || selectedComment.userName}
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} />
                  <span>Đăng ngày: {formatDateTime(selectedComment.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Nội dung bình luận:</label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs">
                {selectedComment.content}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteComment(selectedComment.id)}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
                <span>Xóa vĩnh viễn</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedComment.status === "hidden" ? (
                  <button
                    type="button"
                    onClick={() => handleToggleHideComment(selectedComment.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    <span>Công khai bình luận</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleHideComment(selectedComment.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <EyeOff size={14} />
                    <span>Tạm ẩn bình luận</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedComment(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsCommentsTab;