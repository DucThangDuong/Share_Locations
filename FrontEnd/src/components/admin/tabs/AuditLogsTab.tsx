import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  Search,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Shield,
  FileText,
  AlertCircle,
  X,
  Copy,
  Check,
  Terminal,
  Layers,
  ArrowRight,
} from "lucide-react";
import type {
  AdminAuditLogItem,
  AdminAuditLogDetail,
  GetAdminAuditLogsParams,
} from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import { CustomSelect } from "@/components/common/CustomSelect";

interface ActionMeta {
  label: string;
  category: string;
  color: "emerald" | "rose" | "amber" | "sky" | "purple" | "slate";
}

const ACTION_TYPE_MAP: Record<string, ActionMeta> = {
  // Người dùng & Phân quyền
  ASSIGN_SCOPES: { label: "Phân quyền quản lý", category: "Users", color: "purple" },
  ACTIVATE_USER: { label: "Mở khóa tài khoản", category: "Users", color: "emerald" },
  LOCK_USER: { label: "Khóa tài khoản", category: "Users", color: "rose" },

  // Đề xuất đóng góp
  APPROVE_PROPOSAL: { label: "Phê duyệt đề xuất", category: "Proposals", color: "emerald" },
  REJECT_PROPOSAL: { label: "Từ chối đề xuất", category: "Proposals", color: "rose" },

  // Báo cáo vi phạm
  RESOLVE_REPORT: { label: "Xử lý báo cáo", category: "Reports", color: "amber" },
  RESOLVE_REPORT_GROUP: { label: "Xử lý cụm báo cáo", category: "Reports", color: "amber" },

  // Đánh giá & Bình luận
  UPDATE_REVIEW_STATUS: { label: "Đổi trạng thái đánh giá", category: "Reviews", color: "sky" },
  DELETE_REVIEW: { label: "Xóa đánh giá", category: "Reviews", color: "rose" },
  UPDATE_COMMENT_STATUS: { label: "Đổi trạng thái bình luận", category: "Comments", color: "sky" },
  DELETE_COMMENT: { label: "Xóa bình luận", category: "Comments", color: "rose" },

  // Quản lý địa điểm
  CREATE_PLACE: { label: "Tạo mới địa điểm", category: "Places", color: "emerald" },
  UPDATE_PLACE: { label: "Cập nhật địa điểm", category: "Places", color: "sky" },
  UPDATE_PLACE_STATUS: { label: "Đổi trạng thái địa điểm", category: "Places", color: "amber" },
  DELETE_PLACE: { label: "Xóa địa điểm", category: "Places", color: "rose" },
  UPDATE_PLACE_COVER: { label: "Đổi ảnh đại diện địa điểm", category: "Places", color: "sky" },
  ADD_PLACE_MEDIA: { label: "Thêm ảnh địa điểm", category: "Places", color: "emerald" },
  DELETE_PLACE_MEDIA: { label: "Xóa ảnh địa điểm", category: "PlaceMedia", color: "rose" },

  // Quản lý món ăn
  CREATE_FOOD: { label: "Thêm món ăn", category: "Foods", color: "emerald" },
  UPDATE_FOOD: { label: "Cập nhật món ăn", category: "Foods", color: "sky" },
  UPDATE_FOOD_STATUS: { label: "Đổi trạng thái món ăn", category: "Foods", color: "amber" },
  DELETE_FOOD: { label: "Xóa món ăn", category: "Foods", color: "rose" },

  // Quản lý cẩm nang
  CREATE_BLOG: { label: "Tạo bài viết cẩm nang", category: "Blogs", color: "emerald" },
  UPDATE_BLOG: { label: "Cập nhật bài viết cẩm nang", category: "Blogs", color: "sky" },
  UPDATE_BLOG_STATUS: { label: "Đổi trạng thái bài viết", category: "Blogs", color: "amber" },
  DELETE_BLOG: { label: "Xóa bài viết", category: "Blogs", color: "rose" },

  // Quản lý bộ sưu tập
  CREATE_COLLECTION: { label: "Tạo bộ sưu tập", category: "Collections", color: "emerald" },
  UPDATE_COLLECTION_PLACES: { label: "Cập nhật địa điểm BST", category: "Collections", color: "sky" },
  UPDATE_COLLECTION_STATUS: { label: "Đổi trạng thái BST", category: "Collections", color: "amber" },
};

const TARGET_TABLES = [
  { value: "all", label: "Tất cả phân hệ" },
  { value: "Places", label: "Địa điểm (Places)" },
  { value: "Proposals", label: "Đề xuất (Proposals)" },
  { value: "Reviews", label: "Đánh giá (Reviews)" },
  { value: "Comments", label: "Bình luận (Comments)" },
  { value: "Foods", label: "Món ăn đặc sản (Foods)" },
  { value: "Blogs", label: "Cẩm nang (Blogs)" },
  { value: "Collections", label: "Bộ sưu tập (Collections)" },
  { value: "Users", label: "Người dùng (Users)" },
  { value: "PlaceMedia", label: "Thư viện ảnh (PlaceMedia)" },
  { value: "Reports", label: "Báo cáo vi phạm (Reports)" },
];

const getBadgeStyle = (color: ActionMeta["color"]) => {
  switch (color) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    case "rose":
      return "bg-rose-50 text-rose-700 border-rose-200/80";
    case "amber":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "purple":
      return "bg-purple-50 text-purple-700 border-purple-200/80";
    case "sky":
      return "bg-sky-50 text-sky-700 border-sky-200/80";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [keyword, setKeyword] = useState("");
  const [targetTable, setTargetTable] = useState("all");
  const [actionType, setActionType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Selected Log Detail Modal State
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [detailLog, setDetailLog] = useState<AdminAuditLogDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: GetAdminAuditLogsParams = {
        page,
        pageSize,
      };

      if (keyword.trim()) params.keyword = keyword.trim();
      if (targetTable && targetTable !== "all") params.targetTable = targetTable;
      if (actionType && actionType !== "all") params.actionType = actionType;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res: any = await adminService.getAuditLogs(params as any);
      const data = res?.data || res;

      if (data && Array.isArray(data.items)) {
        setLogs(data.items);
        setTotalCount(data.totalCount ?? data.items.length);
        setTotalPages(data.totalPages ?? Math.max(1, Math.ceil((data.totalCount ?? data.items.length) / pageSize)));
        setHasNextPage(Boolean(data.hasNextPage ?? (page < (data.totalPages || 1))));
        setHasPreviousPage(Boolean(data.hasPreviousPage ?? (page > 1)));
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotalCount(data.length);
        setTotalPages(1);
        setHasNextPage(false);
        setHasPreviousPage(false);
      } else {
        setLogs([]);
        setTotalCount(0);
        setTotalPages(1);
        setHasNextPage(false);
        setHasPreviousPage(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể tải danh sách nhật ký kiểm toán.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, keyword, targetTable, actionType, fromDate, toDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle open detail modal
  const handleOpenDetail = async (id: number) => {
    setSelectedLogId(id);
    setIsDetailLoading(true);
    setDetailLog(null);
    try {
      const res: any = await adminService.getAuditLogDetail(id);
      const logData = res?.data || res;
      setDetailLog(logData);
    } catch {
      // Fallback: find in loaded logs list
      const fallback = logs.find((l) => l.id === id);
      if (fallback) {
        setDetailLog({
          ...fallback,
          oldDataJSON: null,
          newDataJSON: null,
          metadataJSON: null,
          requestId: "",
          userAgent: "",
        });
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedLogId(null);
    setDetailLog(null);
  };

  const handleResetFilters = () => {
    setKeyword("");
    setTargetTable("all");
    setActionType("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Safe parse JSON helper
  const parsedOldData = useMemo(() => {
    if (!detailLog?.oldDataJSON) return null;
    try {
      return typeof detailLog.oldDataJSON === "string"
        ? JSON.parse(detailLog.oldDataJSON)
        : detailLog.oldDataJSON;
    } catch {
      return detailLog.oldDataJSON;
    }
  }, [detailLog?.oldDataJSON]);

  const parsedNewData = useMemo(() => {
    if (!detailLog?.newDataJSON) return null;
    try {
      return typeof detailLog.newDataJSON === "string"
        ? JSON.parse(detailLog.newDataJSON)
        : detailLog.newDataJSON;
    } catch {
      return detailLog.newDataJSON;
    }
  }, [detailLog?.newDataJSON]);

  const parsedMetadata = useMemo(() => {
    if (!detailLog?.metadataJSON) return null;
    try {
      return typeof detailLog.metadataJSON === "string"
        ? JSON.parse(detailLog.metadataJSON)
        : detailLog.metadataJSON;
    } catch {
      return detailLog.metadataJSON;
    }
  }, [detailLog?.metadataJSON]);

  // Filter available action types based on target table if selected
  const availableActionTypes = useMemo(() => {
    const entries = Object.entries(ACTION_TYPE_MAP);
    if (!targetTable || targetTable === "all") return entries;
    return entries.filter(([_, meta]) => {
      if (targetTable === "Reports" && meta.category === "Reports") return true;
      return meta.category.toLowerCase() === targetTable.toLowerCase();
    });
  }, [targetTable]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150 text-xs">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="Tên admin, email, lý do, IP..."
                className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Target Table Dropdown */}
          <CustomSelect
            label="Phân hệ"
            value={targetTable}
            onChange={(val) => {
              setTargetTable(val);
              setActionType("all");
              setPage(1);
            }}
            options={TARGET_TABLES.map((t) => ({ value: t.value, label: t.label }))}
            size="sm"
          />

          {/* Action Type Dropdown */}
          <CustomSelect
            label="Loại thao tác"
            value={actionType}
            onChange={(val) => {
              setActionType(val);
              setPage(1);
            }}
            options={[
              { value: "all", label: "Tất cả hành động" },
              ...availableActionTypes.map(([code, meta]) => ({
                value: code,
                label: `${meta.label}`,
              })),
            ]}
            size="sm"
          />

          {/* Date Range & Reset Button */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-50">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              <span>Từ ngày (From Date)</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              <span>Đến ngày (To Date)</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
            <p className="font-semibold text-xs text-slate-500">Đang tải nhật ký kiểm toán...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center text-rose-500 bg-rose-50/50 flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <p className="font-bold text-xs">{errorMsg}</p>
            <button
              onClick={() => fetchAuditLogs()}
              className="mt-2 px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs"
            >
              Thử lại
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <History size={32} className="text-slate-300 stroke-1" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy bản ghi kiểm toán nào</p>
            <p className="text-slate-400 text-xs max-w-sm">
              Không có thao tác nào khớp với điều kiện lọc hiện tại. Thử nới lỏng bộ lọc hoặc bấm "Đặt lại".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Thời gian</th>
                  <th className="p-3.5">Quản trị viên</th>
                  <th className="p-3.5">Bảng</th>
                  <th className="p-3.5">Hành động</th>
                  <th className="p-3.5">Lý do / Nghiệp vụ</th>
                  <th className="p-3.5">IP & Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const meta = ACTION_TYPE_MAP[log.actionType] || {
                    label: log.actionType,
                    category: log.targetTable,
                    color: "slate",
                  };
                  const isSystemAdmin =
                    log.actorRoleCode === "SystemAdmin" || log.actorRoleCode === "1";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(log.id)}
                    >
                      {/* Time */}
                      <td className="p-3.5 pl-4 align-top whitespace-nowrap">
                        <div className="font-mono text-[11px] font-semibold text-slate-800">
                          {formatDateTime(log.createdAt)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: #{log.id}
                        </div>
                      </td>

                      {/* Admin Info */}
                      <td className="p-3.5 align-top">
                        <div className="flex items-start gap-2.5">
                          {log.adminAvatar ? (
                            <img
                              src={log.adminAvatar}
                              alt={log.adminName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(log.adminName || "A").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{log.adminName || `Admin #${log.adminId}`}</span>
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${isSystemAdmin
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                              >
                                {isSystemAdmin ? (
                                  <ShieldCheck size={10} />
                                ) : (
                                  <Shield size={10} />
                                )}
                                <span>{log.actorRoleCode || "Admin"}</span>
                              </span>
                            </div>
                            {log.adminEmail && (
                              <div className="text-[11px] text-slate-400 truncate">
                                {log.adminEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Bảng dữ liệu */}
                      <td className="p-3.5 align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                          <Layers size={12} className="text-slate-500 shrink-0" />
                          <span>{log.targetTable || "—"}</span>
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="p-3.5 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getBadgeStyle(
                            meta.color
                          )}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* Lý do / Nghiệp vụ */}
                      <td className="p-3.5 align-top max-w-sm">
                        <p className="text-slate-700 text-xs leading-relaxed line-clamp-2" title={log.reason}>
                          {log.reason || "—"}
                        </p>
                      </td>

                      {/* IP & Status */}
                      <td className="p-3.5 align-top whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {log.ipAddress || "—"}
                          </span>
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${log.actionStatus === 1 || log.actionStatusText === "Thành công"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                                }`}
                            >
                              {log.actionStatusText || (log.actionStatus === 1 ? "Thành công" : "Thất bại")}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && logs.length > 0 && (
          <div className="p-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Trang <span className="font-bold text-slate-800">{page}</span> /{" "}
              <span className="font-bold text-slate-800">{totalPages}</span> (Tổng{" "}
              <span className="font-bold text-slate-800">{totalCount}</span> bản ghi)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!hasPreviousPage && page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
              >
                <ChevronLeft size={13} />
                <span>Trước</span>
              </button>

              <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold">
                {page}
              </span>

              <button
                type="button"
                disabled={!hasNextPage && page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
              >
                <span>Sau</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Audit Log Diff & Details */}
      {selectedLogId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      Chi tiết kiểm toán #{selectedLogId}
                    </h3>
                    {detailLog && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                          ACTION_TYPE_MAP[detailLog.actionType]?.color || "slate"
                        )}`}
                      >
                        {ACTION_TYPE_MAP[detailLog.actionType]?.label || detailLog.actionType}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Đối soát dữ liệu trước và sau thao tác của quản trị viên
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {isDetailLoading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                  <p className="font-semibold text-xs text-slate-500">
                    Đang tải chi tiết bản ghi kiểm toán...
                  </p>
                </div>
              ) : detailLog ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                        Quản trị viên thực hiện
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">{detailLog.adminName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Role: {detailLog.actorRoleCode} (ID: #{detailLog.adminId})
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                        Mục tiêu tác động
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 truncate" title={detailLog.targetName}>
                        {detailLog.targetName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {detailLog.targetTable} • ID #{detailLog.targetId}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                        Thời gian & IP
                      </div>
                      <div className="font-mono text-slate-900 font-semibold mt-0.5">
                        {formatDateTime(detailLog.createdAt)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        IP: {detailLog.ipAddress || "—"}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                        Trạng thái thao tác
                      </div>
                      <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Check size={13} className="text-emerald-600" />
                        <span>{detailLog.actionStatusText || "Thành công"}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Code: {detailLog.actionStatus}
                      </div>
                    </div>
                  </div>

                  {/* Reason Callout */}
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                    <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-700" />
                      <span>Lý do / Nội dung thao tác:</span>
                    </div>
                    <p className="text-blue-950 font-medium leading-relaxed">
                      {detailLog.reason || "Không có ghi chú lý do."}
                    </p>
                  </div>

                  {/* Tech Specs (Request ID & User Agent) */}
                  <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5 font-bold text-slate-300">
                        <Terminal size={12} className="text-emerald-400" />
                        <span>Thông tin kỹ thuật (System Trace)</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-slate-400">Request ID: </span>
                        <span className="text-amber-300 font-semibold">
                          {detailLog.requestId || "N/A"}
                        </span>
                        {detailLog.requestId && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(detailLog.requestId, "reqId")}
                            className="ml-2 text-slate-400 hover:text-white inline-flex items-center"
                            title="Sao chép RequestId"
                          >
                            {copiedKey === "reqId" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400">Client IP: </span>
                        <span className="text-slate-100">{detailLog.ipAddress || "N/A"}</span>
                      </div>
                      <div className="col-span-full">
                        <span className="text-slate-400">User Agent: </span>
                        <span className="text-slate-300 break-all">{detailLog.userAgent || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diff Viewer (Old Data vs New Data) */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Layers size={14} className="text-slate-600" />
                      <span>So sánh biến động dữ liệu (Data Diff)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Old Data Box */}
                      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 space-y-2">
                        <div className="flex items-center justify-between font-bold text-rose-800 text-xs border-b border-rose-200 pb-1.5">
                          <span>Dữ liệu trước thay đổi (Old Data)</span>
                          {detailLog.oldDataJSON && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(detailLog.oldDataJSON || "", "oldJson")}
                              className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-[10px]"
                            >
                              {copiedKey === "oldJson" ? <Check size={11} /> : <Copy size={11} />}
                              <span>Copy JSON</span>
                            </button>
                          )}
                        </div>

                        {detailLog.oldDataJSON ? (
                          <pre className="p-3 bg-white/80 rounded-lg border border-rose-100 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap break-all">
                            {typeof parsedOldData === "object"
                              ? JSON.stringify(parsedOldData, null, 2)
                              : detailLog.oldDataJSON}
                          </pre>
                        ) : (
                          <div className="p-6 text-center text-slate-400 italic text-[11px]">
                            Không có dữ liệu cũ (Thao tác tạo mới hoặc không có snapshot trước đó)
                          </div>
                        )}
                      </div>

                      {/* New Data Box */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                        <div className="flex items-center justify-between font-bold text-emerald-800 text-xs border-b border-emerald-200 pb-1.5">
                          <span className="flex items-center gap-1">
                            <span>Dữ liệu sau thay đổi (New Data)</span>
                            <ArrowRight size={12} className="text-emerald-600" />
                          </span>
                          {detailLog.newDataJSON && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(detailLog.newDataJSON || "", "newJson")}
                              className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-[10px]"
                            >
                              {copiedKey === "newJson" ? <Check size={11} /> : <Copy size={11} />}
                              <span>Copy JSON</span>
                            </button>
                          )}
                        </div>

                        {detailLog.newDataJSON ? (
                          <pre className="p-3 bg-white/80 rounded-lg border border-emerald-100 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap break-all">
                            {typeof parsedNewData === "object"
                              ? JSON.stringify(parsedNewData, null, 2)
                              : detailLog.newDataJSON}
                          </pre>
                        ) : (
                          <div className="p-6 text-center text-slate-400 italic text-[11px]">
                            Không có dữ liệu mới (Thao tác xóa hoặc không cập nhật payload mới)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata if present */}
                  {detailLog.metadataJSON && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                      <div className="font-bold text-slate-800 text-xs">
                        Metadata bổ sung (MetadataJSON)
                      </div>
                      <pre className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {typeof parsedMetadata === "object"
                          ? JSON.stringify(parsedMetadata, null, 2)
                          : detailLog.metadataJSON}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  Không tìm thấy chi tiết bản ghi.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTab;
