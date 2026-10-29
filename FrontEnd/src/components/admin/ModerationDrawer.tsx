import React from "react";
import type { GroupedReport, AdminReportItem } from "@/types/admin.types";
import { X, Image, ExternalLink, Globe, MapPin } from "lucide-react";
import { CustomSelect } from "@/components/common/CustomSelect";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const raw = String(dateStr).trim();
    const utcStr = raw.endsWith("Z") || raw.includes("+") || (raw.includes("-") && raw.indexOf("-", 10) !== -1) ? raw : `${raw}Z`;
    const d = new Date(utcStr);
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

const formatResolutionAction = (actionStr?: string) => {
  if (!actionStr) return "Đã xử lý vi phạm";
  const map: Record<string, string> = {
    update_info: "Cập nhật lại thông tin địa điểm (Giá, Giờ, Địa chỉ)",
    mark_closed: "Đánh dấu tạm ngừng hoạt động / Đã đóng cửa",
    hide_target: "Ẩn đối tượng vi phạm khỏi hệ thống",
    hide_content: "Ẩn nội dung vi phạm",
    verified_keep: "Đã xác minh thông tin & Giữ nguyên hiển thị",
    warn_user: "Gửi cảnh cáo đến người đăng",
    ban_user: "Khóa tài khoản vi phạm",
    delete_permanently: "Xóa vĩnh viễn khỏi hệ thống",
    NO_VIOLATION: "Bác bỏ - Nội dung hợp lệ",
    INSUFFICIENT_EVIDENCE: "Bác bỏ - Thiếu bằng chứng",
    SPAM_ABUSE: "Bác bỏ - Báo cáo spam / quấy rối",
    OTHER: "Bác bỏ - Lý do khác",
  };
  const parts = actionStr.split(",").map((s) => s.trim()).filter(Boolean);
  const labels = parts.map((p) => map[p] || p);
  return labels.length > 0 ? labels.join(" • ") : "Đã xử lý";
};

interface ModerationDrawerProps {
  activeReportGroup: GroupedReport | null;
  selectedReportInDrawer: AdminReportItem | null;
  setSelectedReportIdInDrawer: (id: number) => void;
  drawerDecisionTab: "accept" | "dismiss";
  setDrawerDecisionTab: (tab: "accept" | "dismiss") => void;
  drawerActionTaken: string;
  setDrawerActionTaken: (action: string) => void;
  drawerResolutionNote: string;
  setDrawerResolutionNote: (note: string) => void;
  drawerDismissReason: string;
  setDrawerDismissReason: (reason: string) => void;
  drawerAutoCloseDuplicates?: boolean;
  setDrawerAutoCloseDuplicates?: (v: boolean) => void;
  drawerAutoNotifyReporters?: boolean;
  setDrawerAutoNotifyReporters?: (v: boolean) => void;
  drawerAutoRecalculateRating?: boolean;
  setDrawerAutoRecalculateRating?: (v: boolean) => void;
  handleConfirmDrawerResolution: () => void;
  handleAssignToMe?: (groupKey: string) => void;
  onClose: () => void;
  onNavigateToTarget?: (targetType: string, targetId: number) => void;
}

export const ModerationDrawer: React.FC<ModerationDrawerProps> = ({
  activeReportGroup,
  selectedReportInDrawer,
  setSelectedReportIdInDrawer,
  drawerDecisionTab,
  setDrawerDecisionTab,
  drawerActionTaken,
  setDrawerActionTaken,
  drawerResolutionNote,
  setDrawerResolutionNote,
  drawerDismissReason,
  setDrawerDismissReason,
  handleConfirmDrawerResolution,
  onClose,
  onNavigateToTarget,
}) => {
  if (!activeReportGroup) return null;

  const currentReport = selectedReportInDrawer || activeReportGroup.reportsList[0];

  const effectiveStatus = currentReport?.status ?? activeReportGroup.status;
  const isAlreadyHandled =
    effectiveStatus === 1 ||
    effectiveStatus === 2 ||
    activeReportGroup.status === 1 ||
    activeReportGroup.status === 2;

  const targetType = activeReportGroup.targetType || "";
  const isPlace = targetType === "place";
  const isReviewOrComment = targetType === "review" || targetType === "comment";
  const isBlog = targetType === "blog";

  React.useEffect(() => {
    if (!activeReportGroup) return;
    if (isPlace) {
      const placeActions = ["update_info", "mark_closed", "hide_target", "verified_keep"];
      if (!drawerActionTaken || !placeActions.includes(drawerActionTaken)) {
        setDrawerActionTaken("update_info");
      }
    } else {
      if (!drawerActionTaken || ["update_info", "mark_closed", "verified_keep"].includes(drawerActionTaken)) {
        setDrawerActionTaken("hide_target");
      }
    }
  }, [activeReportGroup?.targetType]);

  const selectedActions = React.useMemo(() => {
    if (!drawerActionTaken) return [];
    return drawerActionTaken.split(",").map((a) => a.trim()).filter(Boolean);
  }, [drawerActionTaken]);

  const toggleAction = (key: string) => {
    let next: string[];
    if (selectedActions.includes(key)) {
      next = selectedActions.filter((a) => a !== key);
    } else {
      next = [...selectedActions, key];
    }
    setDrawerActionTaken(next.join(","));
  };

  const hasAtLeastOneAction =
    drawerDecisionTab === "dismiss" ||
    (isPlace
      ? ["update_info", "mark_closed", "hide_target", "verified_keep"].includes(drawerActionTaken)
      : selectedActions.length > 0);

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="font-mono text-slate-500">#{activeReportGroup.targetId}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-semibold">
                  {targetType === "place" && "Địa điểm"}
                  {targetType === "review" && "Đánh giá"}
                  {targetType === "blog" && "Cẩm nang"}
                  {targetType === "photo" && "Hình ảnh"}
                  {targetType === "comment" && "Bình luận"}
                </span>
                {onNavigateToTarget && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => onNavigateToTarget(targetType, activeReportGroup.targetId)}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
                      title="Chuyển đến màn hình quản trị đối tượng này trong Admin"
                    >
                      <ExternalLink size={11} />
                      <span>Quản lý trong Admin</span>
                    </button>
                  </>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {activeReportGroup.targetTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Cột trái: Nội dung đối tượng và các phản ánh */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Nội dung đối tượng bị phản ánh
                </span>
                <div className="flex items-center gap-2">
                  {onNavigateToTarget && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTarget(targetType, activeReportGroup.targetId)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                      title="Mở quản lý đối tượng này trong Admin"
                    >
                      <ExternalLink size={10} />
                      <span>
                        {targetType === "place" && "Quản lý địa điểm"}
                        {targetType === "review" && "Quản lý đánh giá"}
                        {targetType === "comment" && "Quản lý bình luận"}
                        {targetType === "blog" && "Quản lý cẩm nang"}
                        {!["place", "review", "comment", "blog"].includes(targetType) && "Quản trị đối tượng"}
                      </span>
                    </button>
                  )}
                  {activeReportGroup.targetRating && (
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                      ★ {activeReportGroup.targetRating}.0
                    </span>
                  )}
                </div>
              </div>

              {/* Thông tin đối tượng / Địa điểm liên quan */}
              {(activeReportGroup.placeName || activeReportGroup.placeSubtitle || isPlace) && (
                <div className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {(activeReportGroup.placeImage || activeReportGroup.targetImage) ? (
                      <img
                        src={activeReportGroup.placeImage || activeReportGroup.targetImage}
                        alt={activeReportGroup.placeName || activeReportGroup.targetTitle}
                        className="w-12 h-12 rounded-lg object-cover border border-emerald-200 shrink-0 shadow-2xs"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          {isPlace ? "Thông tin địa điểm hiện tại" : "Địa điểm liên quan"}
                        </span>
                        {activeReportGroup.category && (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                            {activeReportGroup.category}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate mt-0.5">
                        {isPlace
                          ? activeReportGroup.targetTitle
                          : (activeReportGroup.placeName || activeReportGroup.targetSubtitle)}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                        <MapPin size={11} className="text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {activeReportGroup.placeSubtitle || activeReportGroup.targetSubtitle || activeReportGroup.province || "Chưa có địa chỉ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigateToTarget?.("place", activeReportGroup.placeId || activeReportGroup.targetId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                      title={isPlace ? "Mở trang chỉnh sửa địa điểm trong Admin" : "Xem địa điểm này trong Admin"}
                    >
                      <ExternalLink size={12} />
                      <span>{isPlace ? "Chỉnh sửa địa điểm" : "Xem địa điểm"}</span>
                    </button>
                    {(activeReportGroup.placeId || activeReportGroup.targetId) && (
                      <a
                        href={`/places/${activeReportGroup.placeId || activeReportGroup.targetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px] transition-colors cursor-pointer"
                        title="Xem địa điểm trên web (mở tab mới)"
                      >
                        <Globe size={12} className="text-slate-500" />
                        <span className="hidden sm:inline">Web</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {activeReportGroup.targetImage ? (
                <img
                  src={activeReportGroup.targetImage}
                  alt={activeReportGroup.targetTitle}
                  className="w-full max-h-48 rounded-lg object-cover border border-slate-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.no-img-placeholder')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'no-img-placeholder w-full h-32 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 select-none';
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (targetType === 'blog' || targetType === 'place') ? (
                <div className="w-full h-32 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 select-none">
                  <Image size={32} className="text-slate-300" />
                </div>
              ) : null}

              {activeReportGroup.targetContent ? (
                <blockquote className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 italic leading-relaxed">
                  "{activeReportGroup.targetContent}"
                </blockquote>
              ) : (
                <div className="text-slate-600">
                  <p className="font-medium text-slate-900">{activeReportGroup.targetTitle}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeReportGroup.targetSubtitle}</p>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">
                  Phản ánh từ cộng đồng ({activeReportGroup.reportsCount})
                </h4>
              </div>

              <div className="space-y-2">
                {activeReportGroup.reportsList.map((rep) => {
                  const isSelected = (currentReport && currentReport.id === rep.id);
                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReportIdInDrawer(rep.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200/80 bg-white hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {rep.reporterAvatar && (
                            <img
                              src={rep.reporterAvatar}
                              alt={rep.reporterName}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-bold text-slate-900">{rep.reporterName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDateTime(rep.submittedAt)}
                        </span>
                      </div>
                      <p className="text-rose-700 font-semibold text-xs">
                        {rep.reportTypeName || rep.reasonContent || "Vi phạm quy định"}
                      </p>
                      {(() => {
                        const detailText = rep.reasonContent || rep.description;
                        const isDuplicate =
                          detailText &&
                          rep.reportTypeName &&
                          detailText.trim().toLowerCase() === rep.reportTypeName.trim().toLowerCase();
                        if (!detailText || isDuplicate) return null;
                        return (
                          <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">
                            "{detailText}"
                          </p>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cột phải: Thao tác giải quyết / Quyết định */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-4">
            {isAlreadyHandled ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border ${effectiveStatus === 1
                    ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                    : "bg-slate-100/90 border-slate-200 text-slate-900"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${effectiveStatus === 1
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-600 text-white"
                        }`}
                    >
                      {effectiveStatus === 1 ? "✓ Đã giải quyết" : "✕ Đã bác bỏ"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Hồ sơ đã đóng
                    </span>
                  </div>
                  <h3 className="font-bold text-sm">
                    {effectiveStatus === 1
                      ? "Đã xác nhận vi phạm và thực thi xử lý"
                      : "Báo cáo phản ánh đã bị bác bỏ"}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Báo cáo này đã được quản trị viên thẩm định và xử lý hoàn tất.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hành động xử lý đã thực thi
                    </span>
                    <span className="font-semibold text-slate-800 text-xs mt-1 block">
                      {formatResolutionAction(currentReport?.resolutionAction)}
                    </span>
                  </div>

                  {currentReport?.resolutionNote && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Ghi chú / Căn cứ kết luận
                      </span>
                      <p className="text-slate-700 text-xs mt-1 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                        "{currentReport.resolutionNote}"
                      </p>
                    </div>
                  )}

                  {currentReport?.assignedToAdminName && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Quản trị viên thẩm định
                      </span>
                      <span className="font-semibold text-slate-800 text-xs mt-1 block">
                        {currentReport.assignedToAdminName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <span>
                    Hồ sơ đã được lưu trữ vào nhật ký kiểm toán. Các chức năng thực thi đã bị khóa để đảm bảo tính toàn vẹn dữ liệu.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDrawerDecisionTab("accept")}
                    className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${drawerDecisionTab === "accept"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Xác nhận vi phạm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerDecisionTab("dismiss")}
                    className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${drawerDecisionTab === "dismiss"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Bác bỏ báo cáo
                  </button>
                </div>

                {drawerDecisionTab === "accept" ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="font-bold text-slate-800 block mb-2">
                        Hành động xử lý thực thi:
                      </label>

                      {/* Phân loại hành động linh hoạt theo loại đối tượng */}
                      {isPlace ? (
                        <div className="space-y-2">
                          {/* 1. Cập nhật lại thông tin */}
                          <label
                            className={`block p-3 rounded-xl border transition-all cursor-pointer ${drawerActionTaken === "update_info"
                              ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="place_resolution_action"
                                value="update_info"
                                checked={drawerActionTaken === "update_info"}
                                onChange={() => setDrawerActionTaken("update_info")}
                                className="w-4 h-4 mt-0.5 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-900 font-bold text-xs">
                                    Cập nhật lại thông tin địa điểm
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                    Khuyên dùng
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                  Phản ánh đúng về sai giá, giờ mở cửa, địa chỉ hoặc số điện thoại. Giữ hiển thị địa điểm và cập nhật thông tin chuẩn xác.
                                </span>
                                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                                  <span className="text-[10px] text-emerald-800 font-medium">
                                    Chỉnh sửa ngay:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigateToTarget?.("place", activeReportGroup.targetId);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <ExternalLink size={11} />
                                    <span>Mở form sửa Giá / Giờ</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </label>

                          {/* 2. Đánh dấu tạm ngừng hoạt động / Đã đóng cửa */}
                          <label
                            className={`block p-3 rounded-xl border transition-all cursor-pointer ${drawerActionTaken === "mark_closed"
                              ? "border-amber-600 bg-amber-50/50 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="place_resolution_action"
                                value="mark_closed"
                                checked={drawerActionTaken === "mark_closed"}
                                onChange={() => setDrawerActionTaken("mark_closed")}
                                className="w-4 h-4 mt-0.5 text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-900 font-bold text-xs block">
                                  Đánh dấu "Tạm ngừng hoạt động / Đã đóng cửa"
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                  Địa điểm đã dừng kinh doanh hoặc tạm đóng cửa sửa chữa. Tạm ẩn trên bản đồ để tránh người dùng đến nhầm.
                                </span>
                              </div>
                            </div>
                          </label>

                          {/* 3. Tạm ẩn địa điểm khỏi hệ thống */}
                          <label
                            className={`block p-3 rounded-xl border transition-all cursor-pointer ${drawerActionTaken === "hide_target"
                              ? "border-rose-600 bg-rose-50/50 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="place_resolution_action"
                                value="hide_target"
                                checked={drawerActionTaken === "hide_target"}
                                onChange={() => setDrawerActionTaken("hide_target")}
                                className="w-4 h-4 mt-0.5 text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-900 font-bold text-xs block">
                                  Tạm ẩn địa điểm khỏi hệ thống
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                  Chỉ dùng khi địa điểm giả mạo, trùng lặp hoặc vi phạm nghiêm trọng quy chuẩn nền tảng.
                                </span>
                              </div>
                            </div>
                          </label>

                          {/* 4. Đã xác minh thông tin & Giữ nguyên hiển thị */}
                          <label
                            className={`block p-3 rounded-xl border transition-all cursor-pointer ${drawerActionTaken === "verified_keep"
                              ? "border-blue-600 bg-blue-50/50 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="place_resolution_action"
                                value="verified_keep"
                                checked={drawerActionTaken === "verified_keep"}
                                onChange={() => setDrawerActionTaken("verified_keep")}
                                className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-900 font-bold text-xs block">
                                  Đã xác minh thông tin & Giữ nguyên hiển thị
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                  Đã đối soát thực tế, thông tin vẫn hợp lệ hoặc đã xử lý riêng với chủ cơ sở, không cần thay đổi trạng thái địa điểm.
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      ) : isReviewOrComment ? (
                        <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
                          {/* Checkbox 1: Ẩn bình luận / đánh giá vi phạm */}
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedActions.includes("hide_target")}
                              onChange={() => toggleAction("hide_target")}
                              className="w-4 h-4 mt-0.5 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 font-bold text-xs block">
                                Ẩn {targetType === "review" ? "đánh giá" : "bình luận"} vi phạm
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                Gỡ nội dung khỏi trang hiển thị công khai và tự động tính lại điểm trung bình địa điểm.
                              </span>
                            </div>
                          </label>

                          <div className="border-t border-slate-100 my-1.5" />

                          {/* Checkbox 2: Cảnh cáo tài khoản người đăng */}
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedActions.includes("warn_user")}
                              onChange={() => toggleAction("warn_user")}
                              className="w-4 h-4 mt-0.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 font-bold text-xs block">
                                Gửi cảnh cáo đến người đăng
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                Gửi thông báo cảnh cáo vi phạm quy chuẩn cộng đồng đến hộp thư thông báo của tài khoản này.
                              </span>
                            </div>
                          </label>

                          <div className="border-t border-slate-100 my-1.5" />

                          {/* Checkbox 3: Khóa tài khoản người đăng */}
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedActions.includes("ban_user")}
                              onChange={() => toggleAction("ban_user")}
                              className="w-4 h-4 mt-0.5 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 font-bold text-xs block text-rose-700">
                                Khóa tài khoản người đăng vi phạm
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                Đình chỉ quyền truy cập của tài khoản do có hành vi spam, xúc phạm hoặc cố tình vi phạm nhiều lần.
                              </span>
                            </div>
                          </label>
                        </div>
                      ) : isBlog ? (
                        <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
                          {/* Checkbox 1: Tạm ẩn bài viết / cẩm nang */}
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedActions.includes("hide_target")}
                              onChange={() => toggleAction("hide_target")}
                              className="w-4 h-4 mt-0.5 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 font-bold text-xs block">
                                Tạm ẩn bài viết cẩm nang vi phạm
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                Chuyển bài viết sang trạng thái lưu trữ/ẩn trên hệ thống, không hiển thị trong danh sách cẩm nang công khai.
                              </span>
                            </div>
                          </label>

                          <div className="border-t border-slate-100 my-1.5" />

                          {/* Checkbox 2: Cảnh cáo tác giả bài viết */}
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedActions.includes("warn_user")}
                              onChange={() => toggleAction("warn_user")}
                              className="w-4 h-4 mt-0.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 font-bold text-xs block">
                                Gửi cảnh cáo tác giả bài viết
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                Gửi thông báo yêu cầu tác giả chỉnh sửa nội dung hoặc tuân thủ bản quyền/quy chuẩn nền tảng.
                              </span>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedActions.includes("hide_target")}
                              onChange={() => toggleAction("hide_target")}
                              className="w-4 h-4 mt-0.5 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 font-bold text-xs block">
                                Ẩn đối tượng vi phạm
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                                Gỡ bỏ nội dung khỏi hệ thống.
                              </span>
                            </div>
                          </label>
                        </div>
                      )}

                      {!hasAtLeastOneAction && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">
                          * Bắt buộc phải chọn ít nhất 1 hành động xử lý để thi hành.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">
                        Ghi chú kết luận kiểm duyệt:
                      </label>
                      <textarea
                        rows={3}
                        value={drawerResolutionNote}
                        onChange={(e) => setDrawerResolutionNote(e.target.value)}
                        placeholder="Nêu rõ lý do hoặc bằng chứng vi phạm..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <CustomSelect
                        label="Lý do bác bỏ phản ánh:"
                        value={drawerDismissReason}
                        onChange={(val) => setDrawerDismissReason(val)}
                        options={[
                          {
                            value: "NO_VIOLATION",
                            label: "Nội dung hợp lệ, không vi phạm điều khoản",
                          },
                          {
                            value: "INSUFFICIENT_EVIDENCE",
                            label: "Không đủ bằng chứng xác thực",
                          },
                          {
                            value: "SPAM_ABUSE",
                            label: "Báo cáo sai mục đích hoặc quấy rối",
                          },
                          { value: "OTHER", label: "Lý do nghiệp vụ khác" },
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">
                        Giải trình bác bỏ:
                      </label>
                      <textarea
                        rows={4}
                        value={drawerResolutionNote}
                        onChange={(e) => setDrawerResolutionNote(e.target.value)}
                        placeholder="Ghi chú chi tiết lý do bác bỏ để lưu hồ sơ kiểm toán..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              {isAlreadyHandled ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer text-xs"
                >
                  Đóng cửa sổ chi tiết
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!hasAtLeastOneAction}
                  onClick={handleConfirmDrawerResolution}
                  className={`w-full py-2.5 rounded-xl font-bold text-white transition-all shadow-md ${!hasAtLeastOneAction
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : drawerDecisionTab === "accept"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 cursor-pointer"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer"
                    }`}
                >
                  {drawerDecisionTab === "accept"
                    ? "Xác nhận & Thi hành xử lý"
                    : "Hoàn tất bác bỏ phản ánh"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDrawer;
