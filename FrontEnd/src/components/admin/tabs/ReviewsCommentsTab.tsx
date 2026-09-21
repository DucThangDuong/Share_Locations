import React, { useState } from "react";
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
  BookOpen,
} from "lucide-react";
import type { PlaceReviewItem, PlaceCommentItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";

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
}) => {
  const [searchText, setSearchText] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Selected item for Details Modal
  const [selectedReview, setSelectedReview] = useState<PlaceReviewItem | null>(null);
  const [selectedComment, setSelectedComment] = useState<PlaceCommentItem | null>(null);

  // Active dropdown menu state for row action
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  const reportedReviewsCount = reviewsList.filter((r) => r.reportCount > 0).length;

  // Filter Reviews
  const filteredReviews = reviewsList.filter((rev) => {
    if (revReportFilter === "reported" && rev.reportCount === 0) return false;
    if (statusFilter !== "all" && rev.status !== statusFilter) return false;
    if (ratingFilter !== "all") {
      if (ratingFilter === "reported") {
        if (rev.reportCount === 0) return false;
      } else {
        const targetRating = parseInt(ratingFilter, 10);
        if (Math.round(rev.rating) !== targetRating) return false;
      }
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matchUser = (rev.userName || "").toLowerCase().includes(q);
      const matchContent = (rev.content || "").toLowerCase().includes(q);
      const matchPlace = (rev.placeName || "").toLowerCase().includes(q);
      if (!matchUser && !matchContent && !matchPlace) return false;
    }
    return true;
  });

  // Filter Comments
  const filteredComments = commentsList.filter((comm) => {
    if (statusFilter !== "all" && comm.status !== statusFilter) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matchUser = (comm.authorName || comm.userName || "").toLowerCase().includes(q);
      const matchContent = (comm.content || "").toLowerCase().includes(q);
      const matchPlace = (comm.placeName || "").toLowerCase().includes(q);
      if (!matchUser && !matchContent && !matchPlace) return false;
    }
    return true;
  });

  // Pagination calculation
  const totalItems = revComTab === "reviews" ? filteredReviews.length : filteredComments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const displayedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const displayedComments = filteredComments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleHideReview = async (reviewId: number) => {
    const review = reviewsList.find((item) => item.id === reviewId);
    if (!review) return;
    await adminService.updateReviewStatus(reviewId, review.status === "active" ? "hidden" : "active");
    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextStatus = r.status === "active" ? "hidden" : "active";
          addAuditLog(
            nextStatus === "hidden" ? "Tạm ẩn đánh giá" : "Hiện lại đánh giá",
            `Đánh giá #${r.id}`,
            `Cập nhật trạng thái đánh giá tại ${r.placeName}`,
            "hide"
          );
          showToast(`Đã ${nextStatus === "hidden" ? "tạm ẩn" : "khôi phục"} đánh giá.`);
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
    setOpenActionMenuId(null);
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đánh giá này vĩnh viễn?")) return;
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
  };

  const handleToggleHideComment = async (commentId: number) => {
    const comment = commentsList.find((item) => item.id === commentId);
    if (!comment) return;
    await adminService.updateCommentStatus(commentId, comment.status === "active" ? "hidden" : "active");
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextStatus = c.status === "active" ? "hidden" : "active";
          addAuditLog(
            nextStatus === "hidden" ? "Tạm ẩn bình luận" : "Hiện lại bình luận",
            `Bình luận #${c.id}`,
            "Cập nhật trạng thái bình luận",
            "hide"
          );
          showToast(`Đã ${nextStatus === "hidden" ? "tạm ẩn" : "khôi phục"} bình luận.`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
    setOpenActionMenuId(null);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này vĩnh viễn?")) return;
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
  };

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
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      {/* Top Header & Sub-tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl font-medium">
            <button
              onClick={() => {
                setRevComTab("reviews");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                revComTab === "reviews"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Đánh giá địa điểm ({reviewsList.length})
              {reportedReviewsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {reportedReviewsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRevComTab("comments");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                revComTab === "comments"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bình luận bài viết ({commentsList.length})
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
                placeholder="Tìm kiếm nội dung, người dùng, địa điểm..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {revComTab === "reviews" && (
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setRevReportFilter(e.target.value === "reported" ? "reported" : "all");
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Tất cả số sao</option>
                <option value="5">5 sao (★★★★★)</option>
                <option value="4">4 sao (★★★★☆)</option>
                <option value="3">3 sao (★★★☆☆)</option>
                <option value="2">2 sao (★★☆☆☆)</option>
                <option value="1">1 sao (★☆☆☆☆)</option>
                <option value="reported">Có báo cáo vi phạm</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang công khai</option>
              <option value="hidden">Đang tạm ẩn</option>
            </select>
          </div>
        </div>

        {/* Table Layout - Exact layout matching the requested screenshot */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-5 min-w-[320px]">
                  {revComTab === "reviews" ? "Review" : "Bình luận"}
                </th>
                <th className="p-3.5 min-w-[200px]">
                  {revComTab === "reviews" ? "Địa điểm" : "Bài viết / Địa điểm"}
                </th>
                {revComTab === "reviews" && (
                  <th className="p-3.5 min-w-[140px]">Rating</th>
                )}
                <th className="p-3.5 text-center min-w-[110px]">Chi tiết</th>
                <th className="p-3.5 text-center pr-5 min-w-[80px]">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revComTab === "reviews" ? (
                displayedReviews.map((rev) => {
                  const placeImg =
                    (rev as any).placeCoverImg ||
                    (rev.images && rev.images[0]) ||
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop";

                  return (
                    <tr
                      key={rev.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        rev.reportCount > 0 ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Review Column (User Avatar + Name + Date + Snippet) */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              rev.userAvatar ||
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"
                            }
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {rev.userName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {rev.createdAt}
                              </span>
                              {rev.reportCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                                  <ShieldAlert size={10} />
                                  <span>{rev.reportCount} phản ánh</span>
                                </span>
                              )}
                              {rev.status === "hidden" && (
                                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                  Đang ẩn
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1 max-w-lg font-normal">
                              {rev.content}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Product / Place Column */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={placeImg}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                              {rev.placeName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {rev.province || "Đà Nẵng"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rating Column */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {rev.rating.toFixed(1)}
                          </span>
                          {renderStars(rev.rating)}
                        </div>
                      </td>

                      {/* Details Column ("View Details" Button) */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedReview(rev)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>

                      {/* Action Column ("..." Menu) */}
                      <td className="p-3.5 pr-5 text-center relative">
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
                            <div className="absolute right-5 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-30 animate-in fade-in zoom-in-95 text-left">
                              <button
                                type="button"
                                onClick={() => handleToggleHideReview(rev.id)}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                {rev.status === "hidden" ? (
                                  <>
                                    <Eye size={13} className="text-emerald-600" />
                                    <span>Hiện lại đánh giá</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={13} className="text-slate-500" />
                                    <span>Tạm ẩn đánh giá</span>
                                  </>
                                )}
                              </button>

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
                displayedComments.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Comment User & Content */}
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            comm.authorAvatar ||
                            comm.userAvatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
                          }
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {comm.authorName || comm.userName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {comm.createdAt}
                            </span>
                            {comm.status === "hidden" && (
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                Đang ẩn
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1 max-w-lg font-normal">
                            {comm.content}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Target Blog / Article */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
                          <BookOpen size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                            {comm.placeName || "Cẩm nang du lịch Miền Trung"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Blog bài viết #{comm.blogId || 1}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Details Column */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedComment(comm)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>

                    {/* Action Column */}
                    <td className="p-3.5 pr-5 text-center relative">
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
                          <div className="absolute right-5 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-30 animate-in fade-in zoom-in-95 text-left">
                            <button
                              type="button"
                              onClick={() => handleToggleHideComment(comm.id)}
                              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                            >
                              {comm.status === "hidden" ? (
                                <>
                                  <Eye size={13} className="text-emerald-600" />
                                  <span>Hiện lại bình luận</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff size={13} className="text-slate-500" />
                                  <span>Tạm ẩn bình luận</span>
                                </>
                              )}
                            </button>

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
                ))
              )}
            </tbody>
          </table>

          {totalItems === 0 && (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy dữ liệu phù hợp với điều kiện tìm kiếm.
            </div>
          )}
        </div>

        {/* Pagination Controls Matching Screenshot */}
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "border border-transparent hover:border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
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

      {/* View Details Modal for Review */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
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

            {/* User & Place Meta */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedReview.userAvatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"
                  }
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  alt=""
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedReview.userName}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} />
                    <span>Đăng ngày: {selectedReview.createdAt}</span>
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
              </div>
            </div>

            {/* Review Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Nội dung đánh giá:</label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs">
                {selectedReview.content}
              </div>
            </div>

            {/* Report alert if any */}
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

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteReview(selectedReview.id)}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
                <span>Xóa vĩnh viễn</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleHideReview(selectedReview.id);
                    setSelectedReview((prev) =>
                      prev ? { ...prev, status: prev.status === "active" ? "hidden" : "active" } : null
                    );
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  {selectedReview.status === "hidden" ? "Khôi phục hiển thị" : "Tạm ẩn đánh giá"}
                </button>

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

      {/* View Details Modal for Comment */}
      {selectedComment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
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
              <img
                src={
                  selectedComment.authorAvatar ||
                  selectedComment.userAvatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
                }
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                alt=""
              />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedComment.authorName || selectedComment.userName}
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} />
                  <span>Đăng ngày: {selectedComment.createdAt}</span>
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
                <button
                  type="button"
                  onClick={() => {
                    handleToggleHideComment(selectedComment.id);
                    setSelectedComment((prev) =>
                      prev ? { ...prev, status: prev.status === "active" ? "hidden" : "active" } : null
                    );
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  {selectedComment.status === "hidden" ? "Khôi phục hiển thị" : "Tạm ẩn bình luận"}
                </button>

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
