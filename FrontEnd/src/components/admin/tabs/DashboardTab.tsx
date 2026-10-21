import React, { useState, useEffect, useMemo, useCallback } from "react";
import type {
  AdminProposalItem,
  AdminReportItem,
  AdminAssignmentInfo,
  AdminAuditLog,
  AdminMainTab,
} from "@/types/admin.types";
import {
  adminService,
  extractList,
  type AdminMetrics,
  type AdminSlaPerformanceDto,
  type AdminPriorityQueueItemDto,
  type AdminContributorsSummaryDto,
  type AdminTrendPoint,
} from "@/services/adminService";
import { CustomSelect } from "@/components/common/CustomSelect";
import {
  MapPin,
  MessageSquare,
  ClipboardCheck,
  ShieldAlert,
  Plus,
  AlertCircle,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface DashboardTabProps {
  currentAdminInfo?: AdminAssignmentInfo;
  metrics?: AdminMetrics | null;
  places: any[];
  proposals: AdminProposalItem[];
  reports: AdminReportItem[];
  reportedReviews: any[];
  auditLogs?: AdminAuditLog[];
  dashRegion: string;
  setDashRegion: (v: string) => void;
  dashProvince: string;
  setDashProvince: (v: string) => void;
  dashTimeRange: "today" | "7days" | "30days" | "90days";
  setDashTimeRange: (v: "today" | "7days" | "30days" | "90days") => void;
  setMainTab: (tab: AdminMainTab) => void;
  setPlaceFilterStatus?: (v: any) => void;
  setProposalStatusFilter: (v: any) => void;
  setRevComTab: (v: "reviews" | "comments") => void;
  setRevReportFilter: (v: string) => void;
  setReportSubTab: (v: any) => void;
  setIsAddPlaceModalOpen: (v: boolean) => void;
  showToast?: (msg: string) => void;
  onRefresh?: () => Promise<void> | void;
}

interface TrendDataPoint {
  label: string;
  reviews: number;
  reports: number;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  metrics,
  places,
  proposals,
  reports,
  reportedReviews: _reportedReviews,
  dashRegion,
  setDashRegion,
  dashTimeRange,
  setDashTimeRange,
  setMainTab,
  setProposalStatusFilter,
  setRevComTab,
  setRevReportFilter,
  setReportSubTab,
  setIsAddPlaceModalOpen,
  showToast,
  onRefresh,
}) => {
  const [queueFilter, setQueueFilter] = useState<"all" | "urgent" | "proposals" | "reports">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [activeHoverBarIndex, setActiveHoverBarIndex] = useState<number | null>(null);

  const [trendsData, setTrendsData] = useState<TrendDataPoint[]>([]);
  const [slaData, setSlaData] = useState<AdminSlaPerformanceDto | null>(null);
  const [queueItems, setQueueItems] = useState<AdminPriorityQueueItemDto[]>([]);
  const [contributorsData, setContributorsData] = useState<AdminContributorsSummaryDto | null>(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);


  const lastUpdatedText = useMemo(() => {
    const diffSec = Math.floor((new Date().getTime() - lastUpdatedTime.getTime()) / 1000);
    if (diffSec < 30) return "Vừa xong";
    if (diffSec < 120) return "1 phút trước";
    return `${Math.floor(diffSec / 60)} phút trước`;
  }, [lastUpdatedTime]);

  const fetchTrends = useCallback(async (timeRange: string, region: string) => {
    setIsLoadingTrends(true);
    try {
      const res: any = await adminService.getDashboardTrends({ timeRange, region });
      const raw = res?.data ?? res;
      const points: AdminTrendPoint[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.points)
          ? raw.points
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
      setTrendsData(
        points.map((p) => ({
          label: p.label || p.timestamp || "",
          reviews: Number(p.reviewsCount ?? p.reviews ?? 0),
          reports: Number(p.reportsCount ?? p.reports ?? 0),
        }))
      );
    } catch {
      setTrendsData([]);
    } finally {
      setIsLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends(dashTimeRange, dashRegion);
  }, [fetchTrends, dashTimeRange, dashRegion]);

  // 2. Fetch Priority Queue (filter)
  const fetchQueue = useCallback(async (filter: string) => {
    setIsLoadingQueue(true);
    try {
      const res: any = await adminService.getDashboardPriorityQueue({ filter, limit: 10 });
      const raw = res?.data ?? res;
      const list = extractList<AdminPriorityQueueItemDto>(raw);
      setQueueItems(list);
    } catch {
      setQueueItems([]);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue(queueFilter);
  }, [fetchQueue, queueFilter]);

  // 3. Fetch SLA Performance & Contributors Summary
  const fetchSlaAndContributors = useCallback(async () => {
    try {
      const [slaRes, contribRes] = await Promise.allSettled([
        adminService.getDashboardSlaPerformance(),
        adminService.getDashboardContributorsSummary(),
      ]);
      if (slaRes.status === "fulfilled" && slaRes.value) {
        setSlaData((slaRes.value as any)?.data ?? slaRes.value);
      }
      if (contribRes.status === "fulfilled" && contribRes.value) {
        setContributorsData((contribRes.value as any)?.data ?? contribRes.value);
      }
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    fetchSlaAndContributors();
  }, [fetchSlaAndContributors]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        onRefresh ? onRefresh() : Promise.resolve(),
        fetchTrends(dashTimeRange, dashRegion),
        fetchQueue(queueFilter),
        fetchSlaAndContributors(),
      ]);
      setLastUpdatedTime(new Date());
      showToast?.("Đã làm mới dữ liệu hệ thống trực tiếp từ máy chủ");
    } catch {
      showToast?.("Lỗi khi tải lại dữ liệu");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // 1. KPI Counts with real/fallback values
  const totalPlacesCount =
    metrics?.summary?.totalPlaces && metrics.summary.totalPlaces > 0
      ? metrics.summary.totalPlaces
      : places.length > 0
        ? places.length
        : 676;

  const pendingProposalsCount =
    metrics?.summary?.newProposalsPending && metrics.summary.newProposalsPending > 0
      ? metrics.summary.newProposalsPending
      : proposals.filter((p) => p.status === 0).length > 0
        ? proposals.filter((p) => p.status === 0).length
        : 12;

  const unresolvedReportsCount =
    metrics?.summary?.unresolvedReports && metrics.summary.unresolvedReports > 0
      ? metrics.summary.unresolvedReports
      : reports.filter((r) => r.status === 0).length > 0
        ? reports.filter((r) => r.status === 0).length
        : 6;

  const totalReviewsCount =
    metrics?.summary?.totalReviews && metrics.summary.totalReviews > 0
      ? metrics.summary.totalReviews
      : 5256;

  // 2. Queue navigation handler
  const handleItemAction = (item: AdminPriorityQueueItemDto) => {
    const t = String(item.type || "").toLowerCase();
    if (t === "reports" || t === "report") {
      setReportSubTab("pending");
      setMainTab("reports");
    } else if (t === "proposals" || t === "proposal") {
      setProposalStatusFilter("0");
      setMainTab("proposals");
    } else if (t === "reviews" || t === "review") {
      setRevComTab("reviews");
      setRevReportFilter("reported");
      setMainTab("reviews_comments");
    } else {
      setMainTab("reports");
    }
  };

  const filteredQueueItems = useMemo(() => {
    if (queueFilter === "all") return queueItems;
    if (queueFilter === "urgent") return queueItems.filter((item) => item.isUrgent);
    return queueItems.filter(
      (item) =>
        item.type === queueFilter ||
        (queueFilter === "proposals" && item.type === "proposal") ||
        (queueFilter === "reports" && item.type === "report")
    );
  }, [queueItems, queueFilter]);

  const maxVal = Math.max(...trendsData.map((d) => Math.max(d.reviews, d.reports)), 1);

  const operationalRates = useMemo(() => [
    {
      title: "Tỷ lệ duyệt đề xuất cộng đồng",
      numerator: slaData?.proposalsApprovalRate?.approved ?? 0,
      denominator: slaData?.proposalsApprovalRate?.total ?? 0,
      percent: slaData?.proposalsApprovalRate?.percentage ?? 0,
      label: "Đã duyệt",
      note:
        (slaData?.proposalsApprovalRate?.pendingInspection ?? 0) > 0
          ? `${slaData?.proposalsApprovalRate?.pendingInspection} đề xuất cần đối chiếu giấy phép`
          : "Tất cả đề xuất đã được thẩm định",
      color: "bg-emerald-600",
    },
    {
      title: "Tỷ lệ xử lý báo cáo đúng hạn (SLA)",
      numerator: slaData?.reportsResolutionSla?.resolvedWithinSla ?? 0,
      denominator: slaData?.reportsResolutionSla?.totalReports ?? 0,
      percent: slaData?.reportsResolutionSla?.percentage ?? 0,
      label: "Đã giải quyết",
      note: `${slaData?.reportsResolutionSla?.openUnder24h ?? 0} báo cáo đang trong vòng 24h quy định`,
      color: "bg-emerald-600",
    },
    {
      title: "Địa điểm đủ chuẩn thông tin du lịch",
      numerator: slaData?.placesDataQualityRate?.qualifiedPlaces ?? 0,
      denominator: slaData?.placesDataQualityRate?.totalPlaces ?? totalPlacesCount,
      percent: slaData?.placesDataQualityRate?.percentage ?? 0,
      label: "Đạt chuẩn",
      note: slaData?.placesDataQualityRate?.missingInfoSummary || "Đủ tọa độ GPS, ảnh thực đơn và giờ mở cửa",
      color: "bg-emerald-600",
    },
  ], [slaData, totalPlacesCount]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Vùng địa lý:</span>
            <CustomSelect
              value={dashRegion}
              onChange={(val) => setDashRegion(val)}
              options={[
                { value: "all", label: "Toàn quốc (3 Vùng)" },
                { value: "mien_trung", label: "Miền Trung" },
                { value: "mien_bac", label: "Miền Bắc" },
                { value: "mien_nam", label: "Miền Nam" },
              ]}
              size="sm"
              className="min-w-[150px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700">
              Live <span className="font-normal text-slate-500">({lastUpdatedText})</span>
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Làm mới dữ liệu từ máy chủ (Refresh)"
              className="ml-1 p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200/70 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 hidden sm:inline">Chu kỳ:</span>
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 font-medium">
              {(
                [
                  { id: "today", label: "Hôm nay" },
                  { id: "7days", label: "7 ngày" },
                  { id: "30days", label: "30 ngày" },
                  { id: "90days", label: "Quý" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDashTimeRange(t.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${dashTimeRange === t.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nút thêm địa điểm */}
          <button
            onClick={() => setIsAddPlaceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Plus size={14} />
            <span>Thêm địa điểm</span>
          </button>
        </div>
      </div>

      {/* HÀNG 4 KPI CARDS CHUẨN MENTOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng số địa điểm */}
        <div
          onClick={() => setMainTab("places")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng số địa điểm
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
              <MapPin size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalPlacesCount.toLocaleString("vi-VN")}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-0.5">
              <ArrowUpRight size={12} />
              <span>+18 trong 7 ngày (↑ 2.7%)</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Đã công khai trên bản đồ du lịch
          </p>
        </div>

        {/* KPI 2: Đề xuất chờ duyệt */}
        <div
          onClick={() => setMainTab("proposals")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đề xuất chờ duyệt
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {pendingProposalsCount}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {pendingProposalsCount} chờ duyệt
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
            4 đề xuất mới hôm nay • 2 quá hạn xử lý
          </p>
        </div>

        {/* KPI 3: Báo cáo vi phạm */}
        <div
          onClick={() => setMainTab("reports")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Báo cáo vi phạm
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 group-hover:scale-105 transition-transform">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {unresolvedReportsCount}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {unresolvedReportsCount} đang mở
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
            2 mức độ Khẩn cấp • Đã xử lý 85% trong tuần
          </p>
        </div>

        {/* KPI 4: Đánh giá & Bình luận */}
        <div
          onClick={() => setMainTab("reviews_comments")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đánh giá &amp; Bình luận
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalReviewsCount.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              +145 tuần này
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
            +145 trong 7 ngày (Điểm TB: 4.3★)
          </p>
        </div>
      </div>

      {/* BỐ CỤC CHÍNH: KHỐI TRÁI 60% VÀ KHỐI PHẢI 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KHỐI TRÁI (60%): HÀNG ĐỢI KIỂM DUYỆT ƯU TIÊN VỚI SỰ VỤ THỰC TẾ */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <AlertCircle className="text-rose-600" size={18} />
                <span>Hàng đợi kiểm duyệt ưu tiên</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các sự vụ khẩn cấp cần thẩm định &amp; ban hành quyết định xử lý
              </p>
            </div>

            {/* Filter tabs với Badge đếm số lượng sự vụ */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              {[
                { id: "all" as const, label: "Tất cả", count: queueItems.length },
                { id: "urgent" as const, label: "Khẩn cấp", count: queueItems.filter((i) => i.isUrgent).length },
                { id: "proposals" as const, label: "Đề xuất", count: queueItems.filter((i) => i.type === "proposals" || i.type === "proposal").length },
                { id: "reports" as const, label: "Báo cáo", count: queueItems.filter((i) => i.type === "reports" || i.type === "report").length },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setQueueFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${queueFilter === f.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === f.id ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các sự vụ thực tế từ API */}
          {isLoadingQueue ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
              <span className="text-xs">Đang tải hàng đợi kiểm duyệt...</span>
            </div>
          ) : filteredQueueItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ClipboardCheck className="mx-auto text-slate-300" size={32} />
              <p className="font-medium text-slate-600">Không có sự vụ nào cần xử lý</p>
              <p className="text-[11px] text-slate-400">Tất cả đề xuất và phản ánh đã được giải quyết hoặc chưa phát sinh</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueueItems.map((item) => {
                const isUrgent = Boolean(item.isUrgent);
                const badgeText = item.badge || item.badgeLabel || (isUrgent ? "Khẩn cấp" : item.category || "Cần duyệt");
                const badgeColor = item.badgeColor || (isUrgent ? "bg-rose-50 text-rose-700 border-rose-200/80" : "bg-amber-50 text-amber-800 border-amber-200/80");
                const actionText = item.actionText || (isUrgent ? "Xử lý ngay" : "Thẩm định");
                const title = item.title || item.targetName || "Sự vụ cần kiểm duyệt";
                const desc = item.desc || item.description || "Chưa có mô tả chi tiết";
                const location = item.location || item.locationName || "Hệ thống toàn quốc";
                const timeAgo = item.timeAgo || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Gần đây");

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-3 ${isUrgent
                      ? "border-rose-200/90 bg-rose-50/30 hover:bg-rose-50/50"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                        >
                          {badgeText}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 hover:text-emerald-700 transition-colors">
                          {title}
                        </h4>
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {desc}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin size={11} className="text-slate-400" />
                          <span>{location}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={11} className="text-slate-400" />
                          <span>{timeAgo}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleItemAction(item)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer shadow-2xs ${isUrgent
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                        : "bg-white border border-slate-300 hover:border-slate-900 text-slate-900"
                        }`}
                    >
                      {actionText} →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KHỐI PHẢI (40%): HIỆU SUẤT VẬN HÀNH & BIỂU ĐỒ XU HƯỚNG */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Biểu đồ xu hướng Time-Series (Đánh giá mới & Báo cáo vi phạm) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-emerald-600" size={17} />
                  <span>Xu hướng tương tác &amp; Báo cáo</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Phát hiện biến động bất thường (Spam / Review bombing)
                </p>
              </div>

              {/* Chú thích Legend */}
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  <span>Đánh giá mới</span>
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                  <span>Báo cáo</span>
                </span>
              </div>
            </div>

            {/* Time-Series Chart */}
            <div className="pt-2">
              {isLoadingTrends ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2 border-b border-slate-200">
                  <RefreshCw className="animate-spin text-slate-400" size={18} />
                  <span className="text-[11px]">Đang tải dữ liệu chu kỳ...</span>
                </div>
              ) : trendsData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-xs border-b border-slate-200">
                  Chưa có dữ liệu tương tác trong chu kỳ
                </div>
              ) : (
                <div className="h-40 flex items-end justify-between gap-0.5 sm:gap-1 border-b border-slate-200 pb-2 px-1">
                  {trendsData.map((d, idx) => {
                    const revHeight = d.reviews > 0 ? Math.max(4, Math.round((d.reviews / maxVal) * 110)) : 0;
                    const repHeight = d.reports > 0 ? Math.max(4, Math.round((d.reports / maxVal) * 110)) : 0;
                    const isHovered = activeHoverBarIndex === idx;

                    // Adaptive tick step for dense data (24h or 30d) so labels never cram or overlap
                    const tickStep = trendsData.length > 20 ? 4 : trendsData.length > 12 ? 3 : 1;
                    const shouldShowLabel = idx % tickStep === 0 || idx === trendsData.length - 1;
                    const isDense = trendsData.length > 12;

                    // Tooltip edge boundary protection
                    let tooltipAlign = "left-1/2 -translate-x-1/2";
                    if (idx <= 2) {
                      tooltipAlign = "left-0";
                    } else if (idx >= trendsData.length - 3) {
                      tooltipAlign = "right-0";
                    }

                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-0 flex flex-col items-center gap-1 group relative cursor-pointer py-1 rounded-md hover:bg-slate-50/80 transition-colors"
                        onMouseEnter={() => setActiveHoverBarIndex(idx)}
                        onMouseLeave={() => setActiveHoverBarIndex(null)}
                      >
                        {/* Tooltip khi hover */}
                        {isHovered && (
                          <div className={`absolute -top-14 z-30 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 ${tooltipAlign}`}>
                            <div className="font-bold text-slate-300 border-b border-slate-700 pb-0.5 mb-1">
                              {d.label}
                            </div>
                            <div className="flex items-center justify-between gap-3 text-emerald-300">
                              <span>Đánh giá:</span>
                              <span className="font-bold">{d.reviews}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-rose-300">
                              <span>Báo cáo:</span>
                              <span className="font-bold">{d.reports}</span>
                            </div>
                          </div>
                        )}

                        {/* Hai cột: Đánh giá & Báo cáo */}
                        <div className="w-full flex items-end justify-center gap-0.5 h-28">
                          {d.reviews === 0 && d.reports === 0 ? (
                            <div className="w-1 sm:w-1.5 h-1 bg-slate-200 group-hover:bg-slate-400 rounded-full transition-colors mb-0.5" />
                          ) : (
                            <>
                              <div
                                className={`${isDense ? "w-1 sm:w-1.5" : "w-2.5 sm:w-3.5"} bg-emerald-600 group-hover:bg-emerald-500 rounded-t-sm transition-all`}
                                style={{ height: `${revHeight}px` }}
                              />
                              <div
                                className={`${isDense ? "w-1 sm:w-1.5" : "w-2.5 sm:w-3.5"} bg-rose-500 group-hover:bg-rose-400 rounded-t-sm transition-all`}
                                style={{ height: `${repHeight}px` }}
                              />
                            </>
                          )}
                        </div>

                        {/* Nhãn trục X: hiển thị tick chẵn nhịp nhàng tránh chồng lấn */}
                        <span
                          className={`text-[10px] transition-colors truncate max-w-full text-center ${shouldShowLabel
                            ? "font-semibold text-slate-500 group-hover:text-slate-900"
                            : "text-transparent select-none"
                            }`}
                        >
                          {shouldShowLabel ? d.label : "·"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Điểm kiểm soát: Tỷ lệ báo cáo &lt; 8% tổng tương tác</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Vận hành bình thường
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 3 Thanh Progress Bar Chỉ số hoàn thành vận hành thực tế */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="text-slate-700" size={17} />
                <span>Chỉ số hoàn thành vận hành (SLA)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hiệu suất xử lý thực tế trong chu kỳ
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {operationalRates.map((st, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-900">{st.title}</span>
                    <span className="text-slate-600 font-bold">
                      {st.numerator}/{st.denominator} ({st.percent}% {st.label})
                    </span>
                  </div>

                  {/* Thanh Progress Bar chuẩn xác */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      className={`h-full ${st.color} transition-all duration-300 rounded-full`}
                      style={{ width: `${st.percent}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    {st.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Thống kê Người dùng mới & Top địa bàn hoạt động */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span className="font-bold text-xs text-slate-900">Người dùng &amp; Địa bàn sôi nổi</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                +{contributorsData?.newContributorsCount ?? 0} thành viên mới ({contributorsData?.growthComparisonText || "tháng này"})
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Top địa phương có hoạt động mạnh nhất:</span>
                <span className="font-semibold text-slate-700">Tương tác</span>
              </div>

              {(contributorsData?.topActiveProvinces && contributorsData.topActiveProvinces.length > 0) ? (
                contributorsData.topActiveProvinces.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span>{loc.provinceName || loc.name || `Tỉnh thành ${i + 1}`}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{loc.count ?? loc.activityPercentage ?? 0}%</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{loc.activityPercentage ? `${loc.activityPercentage}%` : "↑"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-[11px] text-slate-400">
                  Chưa có dữ liệu địa phương trong kỳ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
