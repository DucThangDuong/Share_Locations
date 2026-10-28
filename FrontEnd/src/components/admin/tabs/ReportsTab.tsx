import React, { useEffect, useState, useMemo } from "react";
import { Image, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminReportItem, AdminUserDetail } from "@/types/admin.types";
import { CustomSelect } from "@/components/common/CustomSelect";
import { geographyService, type ProvinceDto } from "@/services/geographyService";
import { isUserSystemAdmin, decodeJwtPayload } from "@/utils/authUtils";
import { adminService } from "@/services/adminService";

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

const normalizeType = (type: string) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "place" || t === "1" || t === "địa điểm") return "place";
  if (t === "review" || t === "2" || t === "đánh giá") return "review";
  if (t === "comment" || t === "3" || t === "bình luận") return "comment";
  if (t === "blog" || t === "4" || t === "bài viết" || t === "cẩm nang") return "blog";
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
      return "Cẩm nang";
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
  onSortChange?: (sortBy?: string, sortOrder?: "asc" | "desc") => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  reportSubTab,
  reportTargetTypeFilter,
  setReportTargetTypeFilter: _setReportTargetTypeFilter,
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
  onSortChange,
}) => {
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadScopedProvinces = async () => {
      try {
        const provRes = await geographyService.getProvinces();
        const allProvinces: ProvinceDto[] = Array.isArray(provRes?.data)
          ? provRes.data
          : Array.isArray(provRes)
            ? provRes
            : [];

        if (isUserSystemAdmin()) {
          if (!cancelled) setProvincesList(allProvinces);
          return;
        }

        const assignedProvIds: number[] = [];
        const assignedRegIds: number[] = [];
        const assignedProvNames: string[] = [];

        const adminId = currentAdminId || Number(JSON.parse(localStorage.getItem("user_info") || "{}").id || 0);
        if (adminId) {
          try {
            const detailRes = await adminService.getUserDetail(adminId);
            const detail = ((detailRes?.data || detailRes) as unknown) as AdminUserDetail;
            if (detail) {
              if (Array.isArray(detail.provinceScopes)) {
                detail.provinceScopes.forEach((s) => {
                  if (s.provinceId) assignedProvIds.push(s.provinceId);
                  if (s.provinceName) assignedProvNames.push(s.provinceName.toLowerCase().trim());
                });
              }
              if (Array.isArray(detail.regionScopes)) {
                detail.regionScopes.forEach((r) => {
                  if (r.regionId) assignedRegIds.push(r.regionId);
                });
              }
            }
          } catch {
          }
        }

        try {
          const stored = JSON.parse(localStorage.getItem("user_info") || "{}");
          const scopes = stored.provinceScopes || stored.managedProvinces;
          if (Array.isArray(scopes)) {
            scopes.forEach((s: any) => {
              if (s.provinceId) assignedProvIds.push(s.provinceId);
              if (s.provinceName) assignedProvNames.push(String(s.provinceName).toLowerCase().trim());
            });
          }
          const regScopes = stored.regionScopes || stored.managedRegions;
          if (Array.isArray(regScopes)) {
            regScopes.forEach((r: any) => {
              if (r.regionId) assignedRegIds.push(r.regionId);
            });
          }

          const jwt = decodeJwtPayload();
          if (jwt) {
            const jwtProv = jwt.province_scope || jwt.provinceScopes;
            if (Array.isArray(jwtProv)) {
              jwtProv.forEach((v: any) => assignedProvIds.push(Number(v)));
            } else if (jwtProv) {
              assignedProvIds.push(Number(jwtProv));
            }
          }
        } catch { }

        if (assignedProvIds.length > 0 || assignedRegIds.length > 0 || assignedProvNames.length > 0) {
          const scoped = allProvinces.filter((p) => {
            if (assignedProvIds.includes(p.id)) return true;
            if (assignedRegIds.includes(p.regionId)) return true;
            if (assignedProvNames.includes(p.name.toLowerCase().trim())) return true;
            return false;
          });
          if (scoped.length > 0) {
            if (!cancelled) setProvincesList(scoped);
            return;
          }
        }

        const reportProvs = Array.from(
          new Set(reports.map((r) => r.province).filter(Boolean))
        ).map((p) => p.toLowerCase().trim());

        const scopedFromReports = allProvinces.filter((p) =>
          reportProvs.some((rp) => p.name.toLowerCase().trim().includes(rp) || rp.includes(p.name.toLowerCase().trim()))
        );

        if (scopedFromReports.length > 0) {
          if (!cancelled) setProvincesList(scopedFromReports);
          return;
        }

        if (reportProvs.length > 0) {
          if (!cancelled) {
            setProvincesList(
              reportProvs.map((name, idx) => ({
                id: idx + 1,
                name: reports.find((r) => r.province.toLowerCase().trim() === name)?.province || name,
                regionId: 0,
                regionName: "",
                featured: false,
                displayOrder: 0,
                placeCount: 0,
              }))
            );
          }
          return;
        }

        if (!cancelled) setProvincesList(allProvinces);
      } catch {
        const reportProvs = Array.from(new Set(reports.map((r) => r.province).filter(Boolean)));
        if (!cancelled) {
          setProvincesList(
            reportProvs.map((name, idx) => ({
              id: idx + 1,
              name,
              regionId: 0,
              regionName: "",
              featured: false,
              displayOrder: 0,
              placeCount: 0,
            }))
          );
        }
      }
    };

    void loadScopedProvinces();
    return () => {
      cancelled = true;
    };
  }, [currentAdminId, reports]);

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== "all") {
      if (String(r.status) !== statusFilter) return false;
    } else {
      if (reportSubTab === "urgent") {
        if (r.status !== 0 || (r.priority !== "urgent" && r.slaStatus !== "breached")) return false;
      } else if (reportSubTab === "assigned_to_me") {
        if (r.status !== 0 || r.assignedToAdminId !== currentAdminId) return false;
      } else if (reportSubTab === "resolved") {
        if (r.status === 0) return false;
      }
    }

    const itemType = normalizeType(r.targetType || (r as any).targetTypeName || (r as any).entityType);
    if (reportTargetTypeFilter !== "all" && itemType !== reportTargetTypeFilter) return false;

    if (reportPriorityFilter !== "all") {
      if (reportPriorityFilter === "urgent" && r.priority !== "urgent" && r.slaStatus !== "breached") return false;
      if (reportPriorityFilter === "high" && r.priority !== "high") return false;
      if (reportPriorityFilter === "normal" && r.priority !== "normal") return false;
      if (reportPriorityFilter === "low" && r.priority !== "low") return false;
    }

    if (reportProvinceFilter !== "all") {
      const pFilter = reportProvinceFilter.toLowerCase().trim();
      const rProv = String(r.province || (r as any).provinceName || "").toLowerCase().trim();
      if (rProv && !rProv.includes(pFilter) && !pFilter.includes(rProv)) return false;
    }

    if (reportSearchText.trim()) {
      const q = reportSearchText.toLowerCase();
      const matchId = (r.codeId || `#${r.id}`).toLowerCase().includes(q);
      const matchTitle = (r.targetTitle || "").toLowerCase().includes(q);
      const matchContent = ((r.targetContent || (r as any).content || (r as any).reviewContent || (r as any).commentContent) || "").toLowerCase().includes(q);
      const matchReporter = (r.reporterName || "").toLowerCase().includes(q);
      const matchReason = (r.reportReasonCategory || r.reportTypeName || r.reasonContent || "").toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchContent && !matchReporter && !matchReason) return false;
    }

    return true;
  });

  type SortField = "targetTitle" | "submittedAt" | null;
  type SortOrder = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: "targetTitle" | "submittedAt") => {
    let nextOrder: SortOrder = "desc";
    let nextField: SortField = field;
    if (sortField === field) {
      if (sortOrder === "desc") {
        nextOrder = "asc";
      } else {
        nextField = null;
      }
    } else {
      nextOrder = field === "targetTitle" ? "asc" : "desc";
    }
    setSortField(nextField);
    setSortOrder(nextOrder);
    onSortChange?.(nextField || undefined, nextField ? nextOrder : undefined);
  };

  const renderSortIcon = (field: "targetTitle" | "submittedAt") => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-emerald-700" />
    ) : (
      <ArrowDown size={12} className="text-emerald-700" />
    );
  };

  const sortedReports = useMemo(() => {
    if (!sortField) return filteredReports;
    return [...filteredReports].sort((a, b) => {
      if (sortField === "targetTitle") {
        const nameA = String(a.targetTitle || "").trim().toLowerCase();
        const nameB = String(b.targetTitle || "").trim().toLowerCase();
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB, "vi")
          : nameB.localeCompare(nameA, "vi");
      }
      if (sortField === "submittedAt") {
        const timeA = new Date(a.submittedAt || 0).getTime();
        const timeB = new Date(b.submittedAt || 0).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredReports, sortField, sortOrder]);

  const PAGE_SIZE = 7;
  const totalPages = Math.max(1, Math.ceil(sortedReports.length / PAGE_SIZE));
  const safePage = Math.min(reportCurrentPage, totalPages);
  const paginatedReports = sortedReports.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Tìm theo ID, tên quán, người gửi..."
            value={reportSearchText}
            onChange={(e) => {
              setReportSearchText(e.target.value);
              setReportCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 w-64"
          />

          <CustomSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setReportCurrentPage(1);
            }}
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "0", label: "Chờ thẩm định (Pending)" },
              { value: "1", label: "Đã giải quyết (Resolved)" },
              { value: "2", label: "Đã bác bỏ (Dismissed)" },
            ]}
            size="sm"
            className="min-w-[150px]"
          />

          <CustomSelect
            value={reportProvinceFilter}
            onChange={(val) => {
              setReportProvinceFilter(val);
              setReportCurrentPage(1);
            }}
            options={[
              { value: "all", label: "Tất cả tỉnh thành" },
              ...provincesList.map((p) => ({
                value: p.name,
                label: p.name,
              })),
            ]}
            size="sm"
            className="min-w-[140px]"
          />
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4 w-[28%]">
                  <button
                    type="button"
                    onClick={() => handleSort("targetTitle")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo tên đối tượng"
                  >
                    <span>Đối tượng bị phản ánh</span>
                    {renderSortIcon("targetTitle")}
                  </button>
                </th>
                <th className="p-3.5">Loại vi phạm</th>
                <th className="p-3.5">Người phản ánh</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("submittedAt")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo thời gian gửi"
                  >
                    <span>Cập nhật</span>
                    {renderSortIcon("submittedAt")}
                  </button>
                </th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReports.map((r) => {
                const groupKey = `${r.targetType}_${r.targetId}`;
                const normType = normalizeType(r.targetType);
                const isReviewOrComment = normType === "review" || normType === "comment";
                const contentText =
                  r.targetContent ||
                  (r as any).content ||
                  (r as any).reviewContent ||
                  (r as any).commentContent ||
                  (r as any).comment ||
                  (r as any).text ||
                  (r as any).targetDescription;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="p-3.5 pl-4 w-[35%]">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">{getTargetTypeLabel(r.targetType)}</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          {(r.targetImage || r.placeImage) ? (
                            <img
                              src={r.targetImage || r.placeImage}
                              alt={r.targetTitle || r.placeName || 'Ảnh địa điểm'}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.no-img-placeholder')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'no-img-placeholder w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 shrink-0';
                                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                  parent.insertBefore(fallback, target);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                              <Image size={18} className="text-slate-300" />
                            </div>
                          )}
                          <div className="space-y-1 flex-1 min-w-0">
                            {(r.placeName || r.targetSubtitle) && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 truncate">
                                <span className="truncate">{r.placeName || r.targetSubtitle}</span>
                                {r.province && (
                                  <span className="text-slate-400 font-normal shrink-0">({r.province})</span>
                                )}
                              </div>
                            )}
                            {isReviewOrComment && contentText ? (
                              <div className="font-semibold text-slate-900 text-xs line-clamp-3 bg-slate-50/90 border border-slate-200/70 rounded-lg px-2.5 py-1.5 text-slate-800 italic">
                                "{contentText}"
                              </div>
                            ) : (
                              <>
                                {!r.placeName && (
                                  <div className="font-bold text-slate-900 text-xs line-clamp-2">
                                    {r.targetTitle}
                                  </div>
                                )}
                                {contentText && (
                                  <div className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50/70 p-1.5 rounded border border-slate-200/50">
                                    "{contentText}"
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5 max-w-xs">
                        <span className="font-bold text-rose-700 text-xs block">
                          {r.reportTypeName}
                        </span>
                        <span className="text-slate-600 text-[11px] line-clamp-2">
                          {r.reasonContent}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {r.reporterAvatar ? (
                          <img
                            src={r.reporterAvatar}
                            alt={r.reporterName}
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 block text-xs">{r.reporterName}</span>
                          <span className="text-slate-400 text-[10px]">{formatDateTime(r.submittedAt)}</span>
                        </div>
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
                        {r.status === 0 ? "Chờ xử lý" : r.status === 1 ? "Đã giải quyết" : "Đã bác bỏ"}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{formatDateTime(r.submittedAt) || "20/10/2026"}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <button
                        onClick={() => handleOpenModerationDrawer(groupKey, r.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-2xs whitespace-nowrap ${
                          r.status === 0
                            ? "bg-slate-900 hover:bg-slate-800 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {r.status === 0 ? "Thẩm định →" : "Xem chi tiết"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    Không có báo cáo vi phạm nào phù hợp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sortedReports.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{paginatedReports.length}</strong> / <strong>{sortedReports.length}</strong> báo cáo (Trang <strong>{safePage}</strong> / {totalPages})
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setReportCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pNum = safePage - 2 + i;
                    if (safePage <= 3) {
                      pNum = i + 1;
                    } else if (safePage >= totalPages - 2) {
                      pNum = totalPages - 4 + i;
                    }
                    if (pNum < 1 || pNum > totalPages) return null;

                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setReportCurrentPage(pNum)}
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${safePage === pNum
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setReportCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Sau</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
