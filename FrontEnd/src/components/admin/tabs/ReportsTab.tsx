import React from "react";
import type { AdminReportItem } from "@/types/admin.types";
import { ShieldAlert } from "lucide-react";

interface ReportsTabProps {
  reports: AdminReportItem[];
  reportSubTab: "all" | "urgent" | "assigned_to_me" | "resolved";
  setReportSubTab: (v: "all" | "urgent" | "assigned_to_me" | "resolved") => void;
  reportTargetTypeFilter: "all" | "place" | "review" | "comment" | "blog" | "photo";
  setReportTargetTypeFilter: (v: "all" | "place" | "review" | "comment" | "blog" | "photo") => void;
  reportPriorityFilter: "all" | "urgent" | "high" | "normal" | "low";
  setReportPriorityFilter: (v: "all" | "urgent" | "high" | "normal" | "low") => void;
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
  setReportSubTab,
  reportTargetTypeFilter,
  setReportTargetTypeFilter,
  reportPriorityFilter,
  setReportPriorityFilter,
  reportProvinceFilter,
  setReportProvinceFilter,
  reportSearchText,
  setReportSearchText,
  selectedReportRowIds,
  setSelectedReportRowIds,
  reportCurrentPage,
  setReportCurrentPage,
  currentAdminId,
  handleToggleSelectRow,
  handleBatchAssign,
  handleBatchDismiss,
  handleOpenModerationDrawer,
}) => {
  const filteredReports = reports.filter((r) => {
    // SubTab Filter
    if (reportSubTab === "all") {
      if (r.status !== 0) return false;
    } else if (reportSubTab === "urgent") {
      if (r.status !== 0 || (r.priority !== "urgent" && r.slaStatus !== "breached")) return false;
    } else if (reportSubTab === "assigned_to_me") {
      if (r.status !== 0 || r.assignedToAdminId !== currentAdminId) return false;
    } else if (reportSubTab === "resolved") {
      if (r.status === 0) return false;
    }

    // Entity Filter
    if (reportTargetTypeFilter !== "all" && r.targetType !== reportTargetTypeFilter) return false;

    // Priority Filter
    if (reportPriorityFilter !== "all") {
      if (reportPriorityFilter === "urgent" && r.priority !== "urgent" && r.slaStatus !== "breached") return false;
      if (reportPriorityFilter === "high" && r.priority !== "high") return false;
      if (reportPriorityFilter === "normal" && r.priority !== "normal") return false;
      if (reportPriorityFilter === "low" && r.priority !== "low") return false;
    }

    // Location Filter
    if (reportProvinceFilter !== "all" && !r.province.includes(reportProvinceFilter)) return false;

    // Search
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
      {/* Header & Sub-tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-600" size={18} />
            <span>Hàng đợi báo cáo vi phạm</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác minh phản ánh từ cộng đồng, xử lý nội dung sai lệch và bảo vệ quyền lợi người dùng
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl font-medium">
          {(
            [
              { id: "all", label: "Tất cả hàng chờ" },
              { id: "urgent", label: "Khẩn cấp SLA" },
              { id: "assigned_to_me", label: "Của tôi" },
              { id: "resolved", label: "Đã xử lý" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setReportSubTab(tab.id);
                setReportCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${reportSubTab === tab.id
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
            <option value="place">Địa điểm</option>
            <option value="review">Đánh giá</option>
            <option value="comment">Bình luận</option>
            <option value="blog">Bài viết</option>
            <option value="photo">Hình ảnh</option>
          </select>

          <select
            value={reportPriorityFilter}
            onChange={(e) => {
              setReportPriorityFilter(e.target.value as any);
              setReportCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
          >
            <option value="all">Mọi mức độ ưu tiên</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="normal">Bình thường</option>
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
        {selectedReportRowIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="font-bold text-slate-700 text-xs">
              Đã chọn: {selectedReportRowIds.length}
            </span>
            <button
              onClick={handleBatchAssign}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Nhận hàng loạt
            </button>
            <button
              onClick={handleBatchDismiss}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              Bác bỏ hàng loạt
            </button>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedReports.length > 0 &&
                      paginatedReports.every((r) => selectedReportRowIds.includes(r.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReportRowIds(paginatedReports.map((r) => r.id));
                      } else {
                        setSelectedReportRowIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-3.5">Địa điểm bị phản ánh</th>
                <th className="p-3.5">Loại vi phạm </th>
                <th className="p-3.5">Người phản ánh</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReports.map((r) => {
                const isSelected = selectedReportRowIds.includes(r.id);
                const groupKey = `${r.targetType}_${r.targetId}`;
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/60 transition-colors ${isSelected ? "bg-emerald-50/30" : ""
                      }`}
                  >
                    <td className="p-3.5 pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(r.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                          <span>{r.codeId || `#REP-${r.id}`}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700 capitalize">{r.targetType}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs line-clamp-1 max-w-xs">
                          {r.targetTitle}
                        </div>
                        {r.targetContent && (
                          <div className="text-slate-500 italic text-[11px] line-clamp-1">
                            "{r.targetContent}"
                          </div>
                        )}
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
                        <span className="text-slate-400 text-[10px]">{r.submittedAt}</span>
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
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
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
