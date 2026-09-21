import React, { useState } from "react";
import type {
  AdminProposalItem,
  AdminReportItem,
  AdminAssignmentInfo,
  AdminAuditLog,
  AdminMainTab,
} from "@/types/admin.types";
import type { AdminMetrics } from "@/services/adminService";
import {
  MapPin,
  MessageSquare,
  ClipboardCheck,
  ShieldAlert,
  Plus,
  AlertCircle,
  BarChart3,
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
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  metrics,
  places,
  proposals,
  reports,
  reportedReviews,
  dashRegion,
  setDashRegion,
  dashProvince,
  setDashProvince,
  dashTimeRange,
  setDashTimeRange,
  setMainTab,
  setProposalStatusFilter,
  setRevComTab,
  setRevReportFilter,
  setReportSubTab,
  setIsAddPlaceModalOpen,
}) => {
  const [selectedChartMonth, setSelectedChartMonth] = useState<number>(3);
  const [queueFilter, setQueueFilter] = useState<"all" | "urgent" | "proposals" | "reports">("all");

  const pendingPlaces = places.filter((p) => p.status === "Chờ duyệt" || p.statusNum === 0);
  const pendingProposals = proposals.filter((p) => p.status === 0);
  const pendingReports = reports.filter((r) => r.status === 0);

  const monthlyStats = [
    { month: "Tháng 1", positive: 180, negative: 45, total: 225 },
    { month: "Tháng 2", positive: 310, negative: 60, total: 370 },
    { month: "Tháng 3", positive: 210, negative: 40, total: 250 },
    { month: "Tháng 4", positive: 620, negative: 116, total: 736 },
    { month: "Tháng 5", positive: 490, negative: 85, total: 575 },
    { month: "Tháng 6", positive: 430, negative: 72, total: 502 },
  ];

  const actionQueueItems = [
    {
      id: "reports_urgent",
      type: "reports",
      isUrgent: true,
      title: "Báo cáo đóng cửa & vi phạm thông tin",
      desc: "Phản ánh cơ sở kinh doanh đã ngừng hoạt động hoặc chuyển địa điểm nhưng vẫn hiển thị",
      count: pendingReports.length,
      badge: "Cần thẩm định",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200/80",
      actionText: "Xử lý vi phạm",
      onAction: () => {
        setReportSubTab("pending");
        setMainTab("reports");
      },
    },
    {
      id: "proposals_new",
      type: "proposals",
      isUrgent: true,
      title: "Đề xuất địa điểm mới từ cộng đồng",
      desc: "Người dùng đóng góp quán ăn mới kèm ảnh thực đơn, cần xác thực tọa độ và số điện thoại",
      count: proposals.filter((p) => p.status === 0 && p.type === "new_place").length || 1,
      badge: "Chờ duyệt 48h",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200/80",
      actionText: "Duyệt đề xuất",
      onAction: () => {
        setProposalStatusFilter("0");
        setMainTab("proposals");
      },
    },
    {
      id: "proposals_edit",
      type: "proposals",
      isUrgent: false,
      title: "Đề xuất hiệu chỉnh giá & giờ mở cửa",
      desc: "Khách hàng cập nhật lại khung giá và thời gian phục vụ chính xác theo thực tế",
      count: proposals.filter((p) => p.status === 0 && p.type === "update_info").length || 1,
      badge: "Cần đối chiếu",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200/80",
      actionText: "Đối chiếu & sửa",
      onAction: () => {
        setProposalStatusFilter("0");
        setMainTab("proposals");
      },
    },
    {
      id: "reviews_flagged",
      type: "reports",
      isUrgent: false,
      title: "Đánh giá nghi vấn bôi nhọ & ngôn từ xúc phạm",
      desc: "Người dùng và chủ quán báo cáo đánh giá 1 sao có dấu hiệu cạnh tranh không lành mạnh",
      count: reportedReviews.length,
      badge: "Phản ánh từ quán",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200/80",
      actionText: "Kiểm tra đánh giá",
      onAction: () => {
        setRevComTab("reviews");
        setRevReportFilter("reported");
        setMainTab("reviews_comments");
      },
    },
  ];

  const filteredQueueItems = actionQueueItems.filter((item) => {
    if (queueFilter === "all") return true;
    if (queueFilter === "urgent") return item.isUrgent;
    return item.type === queueFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Scope Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Vùng địa lý:</span>
            <select
              value={dashRegion}
              onChange={(e) => setDashRegion(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">Toàn quốc (3 Vùng)</option>
              <option value="mien_trung">Miền Trung</option>
              <option value="mien_bac">Miền Bắc</option>
              <option value="mien_nam">Miền Nam</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Tỉnh / Thành:</span>
            <select
              value={dashProvince}
              onChange={(e) => setDashProvince(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả tỉnh thành</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Quảng Nam">Quảng Nam</option>
              <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
              <option value="Khánh Hòa">Khánh Hòa</option>
              <option value="Lâm Đồng">Lâm Đồng</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Chu kỳ:</span>
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
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  dashTimeRange === t.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddPlaceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer ml-2"
          >
            <Plus size={14} />
            <span>Thêm địa điểm</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Places */}
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
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics?.summary?.totalPlaces ?? places.length}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +12% <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {pendingPlaces.length > 0 ? (
              <span className="text-amber-700 font-semibold">{pendingPlaces.length} địa điểm chờ duyệt</span>
            ) : (
              "100% địa điểm đang hoạt động"
            )}
          </p>
        </div>

        {/* Card 2: Proposals */}
        <div
          onClick={() => setMainTab("proposals")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đề xuất từ cộng đồng
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics?.summary?.newProposalsPending ?? proposals.length}
            </span>
            {pendingProposals.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingProposals.length} chờ duyệt
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đóng góp địa điểm &amp; chỉnh sửa thông tin</p>
        </div>

        {/* Card 3: Reports */}
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
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics?.summary?.unresolvedReports ?? reports.length}
            </span>
            {pendingReports.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {pendingReports.length} đang chờ xử lý
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Phản ánh sai lệch, đóng cửa &amp; spam</p>
        </div>

        {/* Card 4: Reviews */}
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
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics?.summary?.totalReviews ?? (reportedReviews.length > 0 ? reportedReviews.length : 0)}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +8.5% <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {reportedReviews.length > 0 ? (
              <span className="text-rose-600 font-semibold">{reportedReviews.length} đánh giá có báo cáo</span>
            ) : (
              "Mức độ hài lòng cộng đồng 98%"
            )}
          </p>
        </div>
      </div>

      {/* Action Queue & Interactive Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Urgent Action Queue (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <AlertCircle className="text-rose-600" size={18} />
                <span>Hàng đợi kiểm duyệt ưu tiên</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các sự vụ cần xác minh và ban hành quyết định xử lý
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              {(
                [
                  { id: "all", label: "Tất cả" },
                  { id: "urgent", label: "Khẩn cấp" },
                  { id: "proposals", label: "Đề xuất" },
                  { id: "reports", label: "Báo cáo" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setQueueFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    queueFilter === f.id
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredQueueItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</p>
                </div>

                <button
                  onClick={item.onAction}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  {item.actionText} →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Growth & Distribution Stats (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="text-slate-700" size={18} />
                <span>Xu hướng tương tác số</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Biểu đồ đánh giá tích cực vs phản ánh</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
              Q2 / 2026
            </span>
          </div>

          {/* Monthly Bars Visualization */}
          <div className="space-y-3 pt-1">
            {monthlyStats.map((st, idx) => {
              const isSelected = selectedChartMonth === idx;
              const positivePercent = Math.round((st.positive / st.total) * 100);
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedChartMonth(idx)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 shadow-2xs"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="font-bold text-slate-900">{st.month}</span>
                    <span className="text-slate-500">
                      {st.total} tương tác ({positivePercent}% tích cực)
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${positivePercent}%` }}
                    />
                    <div
                      className="h-full bg-rose-400 transition-all duration-300"
                      style={{ width: `${100 - positivePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick summary footer */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Tỷ lệ phản hồi đúng hạn SLA:</span>
            <strong className="text-slate-900 font-extrabold text-sm">94.2%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
