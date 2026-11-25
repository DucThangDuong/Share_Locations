import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Globe,
  Trash2,
  ArrowLeft,
  MapPin,
  Calendar,
  Compass,
  Users,
  Copy,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  RotateCcw,
  X,
} from "lucide-react";
import { adminService, extractList } from "@/services/adminService";
import { CustomSelect } from "@/components/common/CustomSelect";
import { ItineraryDayTimelineSection } from "@/components/itinerary/ItineraryDayTimelineSection";
import { ItineraryStopDetailPanel } from "@/components/itinerary/ItineraryStopDetailPanel";
import { normalizeTimeToHHmm } from "@/utils/itineraryStyles";
import type { AdminTripListItem, AdminTripDetail } from "@/types/admin.types";
import type { ProvinceDto } from "@/types/models/geography.model";
import type {
  ItineraryDayData,
  ItineraryStop,
  TransportType,
} from "@/types/models/itinerary.model";

interface TripsTabProps {
  showToast?: (msg: string) => void;
}

const VALID_TRANSPORTS: TransportType[] = [
  "Xe máy",
  "Ô tô",
  "Đi bộ",
  "Taxi",
  "Xe buýt",
  "Tàu hỏa",
  "Máy bay",
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Mới nhất" },
  { value: "budget_desc", label: "Ngân sách cao" },
  { value: "daysCount_desc", label: "Nhiều ngày nhất" },
  { value: "viewCount_desc", label: "Nhiều lượt xem" },
];

const PRIVACY_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả hiển thị" },
  { value: "0", label: "Công khai" },
  { value: "2", label: "Đã ẩn" },
];

const normalizeTransportMode = (raw?: string | null): TransportType => {
  if (!raw) return "Xe máy";
  const matched = VALID_TRANSPORTS.find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase()
  );
  if (matched) return matched;
  if (raw.toLowerCase().includes("taxi") || raw.toLowerCase().includes("grab")) {
    return "Taxi";
  }
  return "Xe máy";
};

const formatCurrencyVnd = (value?: number | null): string => {
  if (value === null || value === undefined || isNaN(Number(value)) || Number(value) <= 0) {
    return "Chưa dự kiến";
  }
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

const toDateInputValue = (raw?: string | null): string => {
  if (!raw) return "";
  const str = String(raw).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatDisplayDate = (raw?: string | null): string => {
  const iso = toDateInputValue(raw);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as {
    response?: { data?: { message?: string; title?: string } | string };
    message?: string;
  };
  if (typeof e?.response?.data === "string" && e.response.data.trim()) {
    return e.response.data;
  }
  if (typeof e?.response?.data === "object" && e?.response?.data) {
    if (e.response.data.message) return e.response.data.message;
    if (e.response.data.title) return e.response.data.title;
  }
  if (e?.message) return e.message;
  return fallback;
};

const mapDetailDaysToTimeline = (detail: AdminTripDetail): ItineraryDayData[] => {
  const sortedDays = [...(detail.days || [])].sort(
    (a, b) => Number(a.dayNumber) - Number(b.dayNumber)
  );
  return sortedDays.map((day, dIdx) => ({
    dayNumber: day.dayNumber || dIdx + 1,
    title: day.dayTitle || `Ngày ${day.dayNumber || dIdx + 1}`,
    date: formatDisplayDate(day.date) || undefined,
    description: "",
    stops: [...(day.stops || [])]
      .sort((a, b) => Number(a.visitOrder) - Number(b.visitOrder))
      .map((stop, sIdx): ItineraryStop => {
        const start = normalizeTimeToHHmm(stop.startTime) || "";
        const end = normalizeTimeToHHmm(stop.endTime) || "";
        return {
          id: String(stop.id ?? `${day.dayNumber}-${stop.placeId}-${sIdx}`),
          placeId: Number(stop.placeId),
          time: start,
          startTime: start,
          endTime: end,
          name: stop.placeName || `Địa điểm #${stop.placeId}`,
          category: stop.categoryName || "Điểm tham quan",
          area: stop.provinceName || undefined,
          address: stop.address || undefined,
          note: stop.note || "",
          costEstimate: Number(stop.estimatedCost || 0),
          duration: "",
          transportMode: normalizeTransportMode(stop.transportMode),
          visitOrder: stop.visitOrder || sIdx + 1,
          img: stop.coverImageUrl || undefined,
        };
      }),
  }));
};

export const TripsTab: React.FC<TripsTabProps> = ({ showToast }) => {
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const notify = useCallback((msg: string) => {
    if (showToastRef.current) {
      showToastRef.current(msg);
    } else {
      alert(msg);
    }
  }, []);

  const [trips, setTrips] = useState<AdminTripListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [keywordInput, setKeywordInput] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [privacyFilter, setPrivacyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt_desc");
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);

  const [selectedTrip, setSelectedTrip] = useState<AdminTripDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [expandedDayIndices, setExpandedDayIndices] = useState<Set<number>>(new Set());
  const [selectedStopInfo, setSelectedStopInfo] = useState<{
    dayIndex: number;
    stop: ItineraryStop;
  } | null>(null);

  const [updatingPrivacyId, setUpdatingPrivacyId] = useState<number | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    adminService
      .getGeographyProvinces({ pageSize: 100 })
      .then((res) => {
        if (!active) return;
        const list = extractList<ProvinceDto>(res?.data ?? res);
        setProvinces(list);
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, []);

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sortField, sortOrder] = sortBy.split("_");
      const params: Record<string, unknown> = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder,
      };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (provinceFilter !== "all") params.provinceId = Number(provinceFilter);
      if (privacyFilter !== "all") params.privacy = Number(privacyFilter);

      const res: any = await adminService.getTrips(params);
      const payload = res?.data ?? res;
      const items = extractList<AdminTripListItem>(payload).filter(
        (item) => Number(item.privacy) !== 1
      );
      const total = Number(
        res?.meta?.totalElements ??
        payload?.totalCount ??
        payload?.totalElements ??
        items.length
      );
      const pages = Math.max(
        1,
        Number(
          res?.meta?.totalPages ??
          payload?.totalPages ??
          Math.ceil(total / pageSize)
        )
      );

      setTrips(items);
      setTotalPages(pages);
    } catch (err) {
      notify(extractErrorMessage(err, "Không thể tải danh sách chuyến đi."));
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, keyword, provinceFilter, privacyFilter, sortBy, notify]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeyword(value);
      setPage(1);
    }, 350);
  };

  const handleResetFilters = () => {
    setKeywordInput("");
    setKeyword("");
    setProvinceFilter("all");
    setPrivacyFilter("all");
    setSortBy("createdAt_desc");
    setPage(1);
  };

  const handleOpenDetail = async (id: number) => {
    setIsLoadingDetail(true);
    setSelectedStopInfo(null);
    try {
      const res: any = await adminService.getTripDetail(id);
      const detail: AdminTripDetail | null = res?.data ?? res ?? null;
      if (!detail || !detail.id) {
        notify("Không tìm thấy thông tin chi tiết chuyến đi.");
        return;
      }
      setSelectedTrip(detail);
      const dayCount = detail.days?.length ?? 0;
      setExpandedDayIndices(
        new Set(Array.from({ length: dayCount }, (_, idx) => idx))
      );
    } catch (err) {
      notify(extractErrorMessage(err, "Không thể tải chi tiết chuyến đi."));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTrip(null);
    setSelectedStopInfo(null);
    fetchTrips();
  };

  const handleTogglePrivacy = async (tripId: number, currentPrivacy: number) => {
    if (updatingPrivacyId === tripId) return;
    const nextPrivacy = currentPrivacy === 0 ? 2 : 0;
    setUpdatingPrivacyId(tripId);
    try {
      const res: any = await adminService.updateTripPrivacy(tripId, nextPrivacy);
      if (res && res.success === false) {
        throw new Error(res.message || "Không thể cập nhật quyền hiển thị.");
      }
      setTrips((prev) =>
        prev.map((item) =>
          item.id === tripId
            ? {
              ...item,
              privacy: nextPrivacy,
              privacyText: nextPrivacy === 0 ? "Công khai" : "Đã ẩn",
            }
            : item
        )
      );
      setSelectedTrip((prev) =>
        prev && prev.id === tripId
          ? {
            ...prev,
            privacy: nextPrivacy,
            privacyText: nextPrivacy === 0 ? "Công khai" : "Đã ẩn",
          }
          : prev
      );
      notify(
        nextPrivacy === 0
          ? "Đã công khai lại chuyến đi trên cộng đồng."
          : "Đã ẩn chuyến đi khỏi cộng đồng."
      );
      if (privacyFilter !== "all" && Number(privacyFilter) !== nextPrivacy && !selectedTrip) {
        fetchTrips();
      }
    } catch (err) {
      notify(extractErrorMessage(err, "Lỗi khi cập nhật quyền hiển thị."));
    } finally {
      setUpdatingPrivacyId(null);
    }
  };

  const handleDeleteTrip = async (tripId: number, title: string) => {
    if (deletingTripId === tripId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn chuyến đi "${title}" không?`)) {
      return;
    }
    setDeletingTripId(tripId);
    try {
      const res: any = await adminService.deleteTrip(tripId);
      if (res && res.success === false) {
        throw new Error(res.message || "Không thể xóa chuyến đi.");
      }
      setTrips((prev) => prev.filter((item) => item.id !== tripId));
      if (selectedTrip && selectedTrip.id === tripId) {
        setSelectedTrip(null);
        setSelectedStopInfo(null);
      }
      notify(`Đã xóa chuyến đi "${title}".`);
      await fetchTrips();
    } catch (err) {
      notify(extractErrorMessage(err, "Không thể xóa chuyến đi."));
    } finally {
      setDeletingTripId(null);
    }
  };

  const provinceOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả tỉnh thành" },
      ...provinces.map((p) => ({ value: String(p.id), label: p.name })),
    ],
    [provinces]
  );

  const timelineDays = useMemo(
    () => (selectedTrip ? mapDetailDaysToTimeline(selectedTrip) : []),
    [selectedTrip]
  );

  const isAllDaysExpanded =
    timelineDays.length > 0 && expandedDayIndices.size === timelineDays.length;

  const handleToggleDay = (dayIdx: number) => {
    setExpandedDayIndices((prev) => {
      const next = new Set(prev);
      if (next.has(dayIdx)) {
        next.delete(dayIdx);
      } else {
        next.add(dayIdx);
      }
      return next;
    });
  };

  const handleToggleAllDays = () => {
    if (isAllDaysExpanded) {
      setExpandedDayIndices(new Set());
    } else {
      setExpandedDayIndices(
        new Set(Array.from({ length: timelineDays.length }, (_, idx) => idx))
      );
    }
  };

  const hasActiveFilters =
    Boolean(keyword.trim()) ||
    provinceFilter !== "all" ||
    privacyFilter !== "all" ||
    sortBy !== "createdAt_desc";

  if (isLoadingDetail) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200">
        <Loader2 size={28} className="animate-spin text-emerald-700" />
        <span className="text-xs font-medium text-slate-500">
          Đang tải chi tiết chuyến đi...
        </span>
      </div>
    );
  }

  if (selectedTrip) {
    const isPublic = Number(selectedTrip.privacy) === 0;
    const isBusyPrivacy = updatingPrivacyId === selectedTrip.id;
    const isBusyDelete = deletingTripId === selectedTrip.id;
    const totalStopsCost = timelineDays.reduce(
      (sum, d) => sum + d.stops.reduce((s, st) => s + (st.costEstimate || 0), 0),
      0
    );
    const displayBudget =
      selectedTrip.estimatedBudget && Number(selectedTrip.estimatedBudget) > 0
        ? Number(selectedTrip.estimatedBudget)
        : totalStopsCost;

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={handleBackToList}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0 mt-0.5"
                title="Quay lại danh sách"
              >
                <ArrowLeft size={16} />
              </button>

              {selectedTrip.coverImageUrl ? (
                <img
                  src={selectedTrip.coverImageUrl}
                  alt={selectedTrip.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                  <Compass size={26} />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    {selectedTrip.title}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isPublic
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                  >
                    {isPublic ? <Globe size={11} /> : <EyeOff size={11} />}
                    <span>{isPublic ? "Công khai" : "Đã ẩn"}</span>
                  </span>
                </div>

                {selectedTrip.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {selectedTrip.description}
                  </p>
                )}

                <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                    {selectedTrip.authorAvatar ? (
                      <img
                        src={selectedTrip.authorAvatar}
                        alt={selectedTrip.authorName}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold inline-flex items-center justify-center">
                        {(selectedTrip.authorName || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>{selectedTrip.authorName}</span>
                  </span>

                  {selectedTrip.provinceName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold text-[11px]">
                      <MapPin size={11} />
                      <span>{selectedTrip.provinceName}</span>
                    </span>
                  )}

                  {(selectedTrip.startDate || selectedTrip.endDate) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Calendar size={12} />
                      <span>
                        {formatDisplayDate(selectedTrip.startDate) || "..."} -{" "}
                        {formatDisplayDate(selectedTrip.endDate) || "..."}
                      </span>
                    </span>
                  )}

                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700 text-[11px]">
                    {timelineDays.length} ngày · {selectedTrip.stopsCount} điểm dừng
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-extrabold text-emerald-800 text-xs">
                    Dự tính: {formatCurrencyVnd(displayBudget)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Eye size={12} />
                    <span>{(selectedTrip.viewCount || 0).toLocaleString("vi-VN")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Copy size={11} />
                    <span>{(selectedTrip.cloneCount || 0).toLocaleString("vi-VN")}</span>
                  </span>
                </div>

                {selectedTrip.members && selectedTrip.members.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Users size={12} />
                      <span>Thành viên ({selectedTrip.members.length}):</span>
                    </span>
                    {selectedTrip.members.map((member) => (
                      <span
                        key={member.userId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700"
                      >
                        <span>{member.fullName}</span>
                        <span className="text-[10px] text-slate-400">({member.role})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                disabled={isBusyPrivacy}
                onClick={() => handleTogglePrivacy(selectedTrip.id, Number(selectedTrip.privacy))}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${isPublic
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                  }`}
              >
                {isBusyPrivacy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isPublic ? (
                  <EyeOff size={14} />
                ) : (
                  <Globe size={14} />
                )}
                <span>{isPublic ? "Ẩn chuyến đi" : "Công khai lại"}</span>
              </button>

              <button
                type="button"
                disabled={isBusyDelete}
                onClick={() => handleDeleteTrip(selectedTrip.id, selectedTrip.title)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBusyDelete ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>Xóa chuyến đi</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-600">
            Lộ trình chi tiết ({timelineDays.length} ngày · {selectedTrip.stopsCount} điểm dừng)
          </div>
          {timelineDays.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllDays}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronsUpDown size={13} />
              <span>{isAllDaysExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}</span>
            </button>
          )}
        </div>

        {timelineDays.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <MapPin size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chuyến đi chưa có ngày hoặc điểm dừng nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div
              className={`space-y-4 transition-all ${selectedStopInfo ? "lg:col-span-8" : "lg:col-span-12"
                }`}
            >
              {timelineDays.map((day, dIdx) => (
                <ItineraryDayTimelineSection
                  key={`${selectedTrip.id}-day-${day.dayNumber}`}
                  day={day}
                  dayIndex={dIdx}
                  totalDays={timelineDays.length}
                  isExpanded={expandedDayIndices.has(dIdx)}
                  currentUserRole="Viewer"
                  selectedStopId={selectedStopInfo?.stop.id || null}
                  dragOverDayIdx={null}
                  onToggleExpand={handleToggleDay}
                  onSelectStop={(dayIndex, stop) => setSelectedStopInfo({ dayIndex, stop })}
                  onOpenPlacePicker={() => { }}
                  onDeleteDay={() => { }}
                  onDeleteStop={() => { }}
                  onMoveStopToDay={() => { }}
                  onMoveStopToWishlist={() => { }}
                  onDragStartStop={() => { }}
                  onDragOverDay={() => { }}
                  onDragLeaveDay={() => { }}
                  onDropOnDay={() => { }}
                />
              ))}
            </div>

            {selectedStopInfo && (
              <aside className="lg:col-span-4 sticky top-20">
                <ItineraryStopDetailPanel
                  stop={selectedStopInfo.stop}
                  dayIndex={selectedStopInfo.dayIndex}
                  currentUserRole="Viewer"
                  onClose={() => setSelectedStopInfo(null)}
                  onUpdateStop={() => { }}
                  onViewPlaceDetails={(stop) => {
                    if (stop.placeId) {
                      window.open(`/places/${stop.placeId}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                />
              </aside>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên chuyến đi, mô tả, tên hoặc email người tạo..."
              value={keywordInput}
              onChange={(e) => handleKeywordChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {keywordInput && (
              <button
                type="button"
                onClick={() => handleKeywordChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <CustomSelect
            value={provinceFilter}
            onChange={(val) => {
              setProvinceFilter(val);
              setPage(1);
            }}
            options={provinceOptions}
            size="sm"
            className="min-w-[160px]"
          />

          <CustomSelect
            value={privacyFilter}
            onChange={(val) => {
              setPrivacyFilter(val);
              setPage(1);
            }}
            options={PRIVACY_FILTER_OPTIONS}
            size="sm"
            className="min-w-[140px]"
          />

          <CustomSelect
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setPage(1);
            }}
            options={SORT_OPTIONS}
            size="sm"
            className="min-w-[140px]"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 size={28} className="animate-spin text-emerald-700" />
          <span className="text-xs font-medium">Đang tải danh sách chuyến đi...</span>
        </div>
      ) : trips.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-2">
          <Compass size={40} className="text-slate-300" />
          <p className="text-sm font-bold text-slate-800">Không tìm thấy chuyến đi nào</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Chưa có chuyến đi công khai nào khớp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3.5">Chuyến đi</th>
                  <th className="p-3.5">Người tạo</th>
                  <th className="p-3.5">Quy mô</th>
                  <th className="p-3.5">Ngân sách dự kiến</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => {
                  const isPublic = Number(trip.privacy) === 0;
                  const isBusyPrivacy = updatingPrivacyId === trip.id;
                  const isBusyDelete = deletingTripId === trip.id;

                  return (
                    <tr
                      key={trip.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="p-3.5 max-w-[280px]">
                        <div className="flex items-center gap-3 min-w-0">
                          {trip.coverImageUrl ? (
                            <img
                              src={trip.coverImageUrl}
                              alt={trip.title}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                              <Compass size={18} />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(trip.id)}
                              className="font-bold text-xs text-slate-900 hover:text-emerald-700 transition-colors truncate block max-w-full text-left cursor-pointer"
                              title={trip.title}
                            >
                              {trip.title}
                            </button>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {trip.provinceName && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-semibold">
                                  <MapPin size={10} />
                                  <span>{trip.provinceName}</span>
                                </span>
                              )}
                              {(trip.startDate || trip.endDate) && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                  <Calendar size={10} />
                                  <span>
                                    {formatDisplayDate(trip.startDate) || "..."} -{" "}
                                    {formatDisplayDate(trip.endDate) || "..."}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {trip.authorAvatar ? (
                            <img
                              src={trip.authorAvatar}
                              alt={trip.authorName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {(trip.authorName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                              {trip.authorName}
                            </div>
                            {trip.authorEmail && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {trip.authorEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {trip.daysCount} ngày · {trip.stopsCount} điểm dừng
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={10} />
                            <span>{(trip.viewCount || 0).toLocaleString("vi-VN")} lượt xem</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Copy size={10} />
                            <span>{(trip.cloneCount || 0).toLocaleString("vi-VN")} sao chép</span>
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-extrabold text-emerald-800">
                        {formatCurrencyVnd(trip.estimatedBudget)}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isPublic
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                            }`}
                        >
                          <span>{isPublic ? "Công khai" : "Đã ẩn"}</span>
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(trip.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Xem chi tiết</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusyPrivacy}
                            onClick={() => handleTogglePrivacy(trip.id, Number(trip.privacy))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                            title={isPublic ? "Ẩn khỏi cộng đồng" : "Công khai lại"}
                          >
                            {isBusyPrivacy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : isPublic ? (
                              <EyeOff size={12} />
                            ) : (
                              <Globe size={12} />
                            )}
                            <span>{isPublic ? "Ẩn" : "Công khai"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusyDelete}
                            onClick={() => handleDeleteTrip(trip.id, trip.title)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-colors cursor-pointer disabled:opacity-50"
                            title="Xóa chuyến đi"
                          >
                            {isBusyDelete ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Trang trước</span>
              </button>

              <span className="text-xs font-bold text-slate-600">
                Trang {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1"
              >
                <span>Trang sau</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripsTab;
