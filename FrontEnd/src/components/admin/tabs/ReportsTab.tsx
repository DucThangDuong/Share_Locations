import React from "react";
import type { AdminReportItem } from "@/types/admin.types";

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

const normalizeType = (type: string) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "place" || t === "1" || t === "địa điểm") return "place";
  if (t === "review" || t === "2" || t === "đánh giá") return "review";
  if (t === "comment" || t === "3" || t === "bình luận") return "comment";
  if (t === "blog" || t === "4" || t === "bài viết") return "blog";
  if (t === "photo" || t === "5" || t === "hình ảnh") return "photo";
  if (t === "user" || t === "6" || t === "tài khoản") return "user";
  return t;
};

const getTargetTypeLabel = (type: string) => {
  const norm = normalizeType(type);
  switch (norm) {
    case "place":
      return "Địa điểm";
    case "review":
      return "Đánh giá";
    case "comment":
      return "Bình luận";
    case "blog":
      return "Bài viết";
    case "photo":
      return "Hình ảnh";
    case "user":
      return "Tài khoản";
    default:
      return type || "Đối tượng";
  }
};

interface ReportsTabProps {
  reports: AdminReportItem[];
  reportSubTab: "all" | "urgent" | "assigned_to_me" | "resolved";
  reportTargetTypeFilter: "all" | "place" | "review" | "comment" | "blog" | "photo";
  setReportTargetTypeFilter: (v: "all" | "place" | "review" | "comment" | "blog" | "photo") => void;
  reportPriorityFilter: "all" | "urgent" | "high" | "normal" | "low";
  reportProvinceFilter: string;
  setReportProvinceFilter: (v: string) => void;
  reportSearchText: string;
  setReportSearchText: (v: string) => void;
  selectedReportRowIds: number[];
  setSelectedReportRowIds: React.Dispatch<React.SetStateAction<number[]>>;
  reportCurrentPage: number;
  setReportCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  currentAdminId: number;
  handleToggleSelectRow: (id: number) => void;
  handleBatchAssign: () => void;
  handleBatchDismiss: () => void;
  handleOpenModerationDrawer: (groupKey: string, specificReportId?: number) => void;
  showToast?: (msg: string) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  reportSubTab,
  reportTargetTypeFilter,
  setReportTargetTypeFilter,
  reportPriorityFilter,
  reportProvinceFilter,
  setReportProvinceFilter,
  reportSearchText,
  setReportSearchText,
  selectedReportRowIds: _selectedReportRowIds,
  setSelectedReportRowIds: _setSelectedReportRowIds,
  reportCurrentPage,
  setReportCurrentPage,
  currentAdminId,
  handleToggleSelectRow: _handleToggleSelectRow,
  handleBatchAssign: _handleBatchAssign,
  handleBatchDismiss: _handleBatchDismiss,
  handleOpenModerationDrawer,
}) => {
  const filteredReports = reports.filter((r) => {
    if (reportSubTab === "all") {
      if (r.status !== 0) return false;
    } else if (reportSubTab === "urgent") {
      if (r.status !== 0 || (r.priority !== "urgent" && r.slaStatus !== "breached")) return false;
    } else if (reportSubTab === "assigned_to_me") {
      if (r.status !== 0 || r.assignedToAdminId !== currentAdminId) return false;
    } else if (reportSubTab === "resolved") {
      if (r.status === 0) return false;
    }

    const itemType = normalizeType(r.targetType);
    if (reportTargetTypeFilter !== "all" && itemType !== reportTargetTypeFilter) return false;

    if (reportPriorityFilter !== "all") {
      if (reportPriorityFilter === "urgent" && r.priority !== "urgent" && r.slaStatus !== "breached") return false;
      if (reportPriorityFilter === "high" && r.priority !== "high") return false;
      if (reportPriorityFilter === "normal" && r.priority !== "normal") return false;
      if (reportPriorityFilter === "low" && r.priority !== "low") return false;
    }

    if (reportProvinceFilter !== "all" && !r.province.includes(reportProvinceFilter)) return false;

    if (reportSearchText.trim()) {
      const q = reportSearchText.toLowerCase();
      const matchId = (r.codeId || `#${r.id}`).toLowerCase().includes(q);
      const matchTitle = r.targetTitle.toLowerCase().includes(q);
      const matchReporter = r.reporterName.toLowerCase().includes(q);
      const matchReason = (r.reportReasonCategory || r.reportTypeName).toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchReporter && !matchReason) return false;
    }

    return true;
  });

  const PAGE_SIZE = 7;
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const safePage = Math.min(reportCurrentPage, totalPages);
  const paginatedReports = filteredReports.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Filters Hub */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Tìm theo ID (#REP-xxx), tên quán, người gửi..."
            value={reportSearchText}
            onChange={(e) => {
              setReportSearchText(e.target.value);
              setReportCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 w-64"
          />

          <select
            value={reportTargetTypeFilter}
            onChange={(e) => {
              setReportTargetTypeFilter(e.target.value as any);
              setReportCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="place">Báo cáo địa điểm</option>
            <option value="review">Báo cáo đánh giá</option>
            <option value="comment">Báo cáo bình luận</option>
            <option value="blog">Báo cáo bài viết</option>
          </select>

          <select
            value={reportProvinceFilter}
            onChange={(e) => {
              setReportProvinceFilter(e.target.value);
              setReportCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả tỉnh thành</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Lâm Đồng">Lâm Đồng</option>
            <option value="Quảng Nam">Quảng Nam</option>
            <option value="Khánh Hòa">Khánh Hòa</option>
          </select>
        </div>

        {/* Batch actions */}
        {/* Batch Actions Toolbar removed since checkboxes are disabled */}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4 w-[30%]">Đối tượng bị phản ánh</th>
                <th className="p-3.5">Loại vi phạm</th>
                <th className="p-3.5">Người phản ánh</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReports.map((r) => {
                const groupKey = `${r.targetType}_${r.targetId}`;
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="p-3.5 pl-4 w-[30%]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">{getTargetTypeLabel(r.targetType)}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs line-clamp-2">
                          {r.targetTitle}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5 max-w-xs">
                        <span className="font-bold text-rose-700 text-xs block">
                          {r.reportTypeName}
                        </span>
                        <span className="text-slate-600 text-[11px] line-clamp-1">
                          {r.reasonContent}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 block">{r.reporterName}</span>
                        <span className="text-slate-400 text-[10px]">{formatDateTime(r.submittedAt)}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 0
                          ? "bg-amber-100 text-amber-800"
                          : r.status === 1
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {r.status === 0 ? "Chờ thẩm định" : r.status === 1 ? "Đã giải quyết" : "Đã bác bỏ"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <button
                        onClick={() => handleOpenModerationDrawer(groupKey, r.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                      >
                        Thẩm định →
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    Không có báo cáo vi phạm nào phù hợp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {safePage} / {totalPages} ({filteredReports.length} báo cáo)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setReportCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setReportCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
