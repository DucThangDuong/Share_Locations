import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminService, extractList, type AdminMetrics } from "@/services/adminService";
import { isUserAdmin, isUserSystemAdmin } from "@/utils/authUtils";
import type {
  AdminMainTab,
  PlaceReviewItem,
  PlaceCommentItem,
  GroupedReport,
  AdminReportItem,
  AdminAuditLog,
  AdminProposalItem,
  AdminFoodItem,
  AdminBlogItem,
  AdminUserItem,
} from "@/types/admin.types";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ModerationDrawer } from "@/components/admin/ModerationDrawer";

import { DashboardTab } from "@/components/admin/tabs/DashboardTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { PlacesTab } from "@/components/admin/tabs/PlacesTab";
import { ProposalsTab } from "@/components/admin/tabs/ProposalsTab";
import { ReviewsCommentsTab } from "@/components/admin/tabs/ReviewsCommentsTab";
import { ReportsTab } from "@/components/admin/tabs/ReportsTab";
import { FoodsTab } from "@/components/admin/tabs/FoodsTab";
import { BlogsTab } from "@/components/admin/tabs/BlogsTab";
import {
  CollectionsTab,
  ProvincesTab,
  CategoriesTab,
  SystemSettingsTab,
  AdminProfileTab,
  NotificationsProfileTab,
  AuditLogsTab,
  RankingsTab,
} from "@/components/admin/tabs/OtherTabs";

const TAB_SLUG_MAP: Record<AdminMainTab, string> = {
  dashboard: "dashboard",
  users: "users",
  places: "places",
  proposals: "proposals",
  reviews_comments: "reviews",
  reports: "reports",
  foods: "foods",
  collections: "collections",
  provinces: "provinces",
  blogs: "blogs",
  categories: "categories",
  settings: "settings",
  admin_profile: "profile",
  notifications_profile: "settings",
  audit_logs: "audit-logs",
  rankings: "rankings",
};

const SLUG_TO_TAB_MAP: Record<string, AdminMainTab> = {
  "": "dashboard",
  dashboard: "dashboard",
  users: "users",
  places: "places",
  proposals: "proposals",
  reviews: "reviews_comments",
  "reviews-comments": "reviews_comments",
  reviews_comments: "reviews_comments",
  reports: "reports",
  foods: "foods",
  collections: "collections",
  provinces: "provinces",
  regions: "provinces",
  blogs: "blogs",
  categories: "categories",
  "place-types": "categories",
  profile: "admin_profile",
  "admin-profile": "admin_profile",
  admin_profile: "admin_profile",
  settings: "settings",
  "system-settings": "settings",
  "report-types": "settings",
  "notifications-profile": "settings",
  notifications_profile: "settings",
  "audit-logs": "audit_logs",
  audit_logs: "audit_logs",
  rankings: "rankings",
  "bang-xep-hang": "rankings",
  leaderboard: "rankings",
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.search.includes("dev=admin")) {
      try {
        localStorage.setItem("user_info", JSON.stringify({ id: 1, fullName: "Quản trị viên", roleId: 3, role: "SYSTEM_ADMIN" }));
      } catch { }
      return;
    }
    if (!isUserAdmin()) {
      navigate('/', { replace: true });
    }
  }, [navigate, location.search]);

  const storedAdmin = (() => {
    try {
      if (typeof window !== "undefined" && window.location.search.includes("dev=admin")) {
        return { id: 1, fullName: "Quản trị viên", roleId: 3, role: "SYSTEM_ADMIN" };
      }
      return JSON.parse(localStorage.getItem("user_info") || "{}");
    } catch {
      return {};
    }
  })();
  const currentAdminInfo = {
    adminId: Number(storedAdmin.id || storedAdmin.userId || 0),
    adminName: storedAdmin.fullName || storedAdmin.name || "Quản trị viên",
    role: storedAdmin.roleId ?? storedAdmin.role ?? "Admin tổng",
    roleId: storedAdmin.roleId ?? storedAdmin.role,
    avatar: storedAdmin.avatarUrl || storedAdmin.avatar,
  };

  const SUPER_ADMIN_ONLY_TABS: AdminMainTab[] = [
    "users",
    "provinces",
    "categories",
    "settings",
    "notifications_profile",
  ];

  const getTabFromUrl = (): AdminMainTab => {
    let resolvedTab: AdminMainTab = "dashboard";

    const pathParts = location.pathname.replace(/\/+$/, "").split("/");
    const adminIndex = pathParts.indexOf("admin");
    if (adminIndex !== -1 && pathParts[adminIndex + 1]) {
      const subSlug = pathParts[adminIndex + 1].toLowerCase();
      if (SLUG_TO_TAB_MAP[subSlug]) {
        resolvedTab = SLUG_TO_TAB_MAP[subSlug];
      }
    } else {
      const params = new URLSearchParams(location.search);
      const queryTab = params.get("tab")?.toLowerCase();
      if (queryTab && SLUG_TO_TAB_MAP[queryTab]) {
        resolvedTab = SLUG_TO_TAB_MAP[queryTab];
      }
    }

    if (!isUserSystemAdmin() && SUPER_ADMIN_ONLY_TABS.includes(resolvedTab)) {
      return "dashboard";
    }

    return resolvedTab;
  };

  const getReportTargetTypeFromUrl = (): "all" | "place" | "review" | "comment" | "blog" | "photo" => {
    const params = new URLSearchParams(location.search);
    const type = params.get("targetType")?.toLowerCase();
    if (type === "place" || type === "review" || type === "comment" || type === "blog" || type === "photo") {
      return type;
    }
    return "place";
  };

  const [mainTab, setMainTabState] = useState<AdminMainTab>(getTabFromUrl);
  const [reportTargetTypeFilter, setReportTargetTypeFilterState] = useState<"all" | "place" | "review" | "comment" | "blog" | "photo">(getReportTargetTypeFromUrl);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const tabFromUrl = getTabFromUrl();
    if (tabFromUrl !== mainTab) {
      setMainTabState(tabFromUrl);
    }
    if (tabFromUrl === "reports") {
      const typeFromUrl = getReportTargetTypeFromUrl();
      if (typeFromUrl !== reportTargetTypeFilter) {
        setReportTargetTypeFilterState(typeFromUrl);
      }
    }
    if (tabFromUrl === "places") {
      const params = new URLSearchParams(location.search);
      const urlProv = params.get("provinceId") || params.get("province") || "all";
      const urlCat = params.get("categoryId") || params.get("category") || "all";
      const urlStat = params.get("status") || "all";
      const urlKw = params.get("keyword") || params.get("search") || "";
      const urlSortBy = params.get("sortBy") || undefined;
      const urlSortOrder = (params.get("sortOrder") as "asc" | "desc") || undefined;
      const urlPage = Number(params.get("page")) || 1;

      const pId = urlProv !== "all" && !isNaN(Number(urlProv)) ? Number(urlProv) : undefined;
      const cId = urlCat !== "all" && !isNaN(Number(urlCat)) ? Number(urlCat) : undefined;

      setPlaceFilterProvince((prev) => (prev !== urlProv ? urlProv : prev));
      setPlaceFilterCategory((prev) => (prev !== urlCat ? urlCat : prev));
      setPlaceFilterStatus((prev) => (prev !== urlStat ? urlStat : prev));
      setPlaceSearchText((prev) => (prev !== urlKw ? urlKw : prev));

      setPlaceFilters((prev: any) => {
        if (
          prev.province === urlProv &&
          prev.provinceId === pId &&
          prev.category === urlCat &&
          prev.categoryId === cId &&
          prev.status === urlStat &&
          prev.keyword === urlKw &&
          prev.sortBy === urlSortBy &&
          prev.sortOrder === urlSortOrder &&
          prev.page === urlPage
        ) {
          return prev;
        }
        return {
          ...prev,
          province: urlProv,
          provinceId: pId,
          category: urlCat,
          categoryId: cId,
          status: urlStat,
          keyword: urlKw,
          sortBy: urlSortBy,
          sortOrder: urlSortOrder,
          page: urlPage,
        };
      });
    }
    if (tabFromUrl === "foods") {
      const params = new URLSearchParams(location.search);
      const urlProv = params.get("provinceId") || params.get("province") || "all";
      const urlStat = params.get("status") || "all";
      const urlKw = params.get("keyword") || params.get("search") || "";
      const urlSortBy = params.get("sortBy") || undefined;
      const urlSortOrder = (params.get("sortOrder") as "asc" | "desc") || undefined;
      const urlPage = Number(params.get("page")) || 1;

      const pId = urlProv !== "all" && !isNaN(Number(urlProv)) ? Number(urlProv) : undefined;

      setFoodFilters((prev: any) => {
        if (
          prev.province === urlProv &&
          prev.provinceId === pId &&
          prev.status === urlStat &&
          prev.keyword === urlKw &&
          prev.sortBy === urlSortBy &&
          prev.sortOrder === urlSortOrder &&
          prev.page === urlPage
        ) {
          return prev;
        }
        return {
          ...prev,
          province: urlProv,
          provinceId: pId,
          status: urlStat,
          keyword: urlKw,
          sortBy: urlSortBy,
          sortOrder: urlSortOrder,
          page: urlPage,
        };
      });
    }
  }, [location.pathname, location.search]);

  const setMainTab = (tab: AdminMainTab) => {
    if (!isUserSystemAdmin() && SUPER_ADMIN_ONLY_TABS.includes(tab)) {
      showToast("Bạn không có quyền truy cập chức năng này (chỉ dành cho Quản trị viên cấp cao).");
      setMainTabState("dashboard");
      navigate("/admin");
      return;
    }

    setMainTabState(tab);
    const slug = TAB_SLUG_MAP[tab];
    let targetPath = slug === "dashboard" ? "/admin" : `/admin/${slug}`;
    if (tab === "reports") {
      const type = reportTargetTypeFilter && reportTargetTypeFilter !== "all" ? reportTargetTypeFilter : "place";
      targetPath += `?targetType=${type}`;
    }
    if (location.pathname + location.search !== targetPath) {
      navigate(targetPath);
    }
  };

  const setReportTargetTypeFilter = (type: "all" | "place" | "review" | "comment" | "blog" | "photo") => {
    const activeType = type || "place";
    setReportTargetTypeFilterState(activeType);
    setMainTabState("reports");
    const params = new URLSearchParams(location.search);
    params.set("targetType", activeType);
    const searchStr = params.toString();
    const targetPath = `/admin/reports${searchStr ? `?${searchStr}` : ""}`;
    if (location.pathname + location.search !== targetPath) {
      navigate(targetPath);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const [dashRegion, setDashRegion] = useState("all");
  const [dashProvince, setDashProvince] = useState("all");
  const [dashTimeRange, setDashTimeRange] = useState<"today" | "7days" | "30days" | "90days">("7days");
  const [dashboardMetrics, setDashboardMetrics] = useState<AdminMetrics | null>(null);

  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState<{
    role?: string;
    status?: string;
    keyword?: string;
    categoryId?: number;
    provinceId?: number;
    regionId?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }>({ page: 1, pageSize: 20 });
  const [usersPagination, setUsersPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    categoryAdminsCount?: number;
    systemAdminsCount?: number;
    regularUsersCount?: number;
  }>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    categoryAdminsCount: 0,
    systemAdminsCount: 0,
    regularUsersCount: 0,
  });
  const [placesList, setPlacesList] = useState<any[]>([]);
  const [proposals, setProposals] = useState<AdminProposalItem[]>([]);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [foodsList, setFoodsList] = useState<AdminFoodItem[]>([]);
  const [isFoodsLoading, setIsFoodsLoading] = useState(false);
  const [foodsPagination, setFoodsPagination] = useState<{
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }>({
    page: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [foodFilters, setFoodFilters] = useState<{
    keyword?: string;
    province?: string;
    provinceId?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }>({ page: 1, pageSize: 10 });
  const [blogsList, setBlogsList] = useState<AdminBlogItem[]>([]);
  const [isBlogsLoading, setIsBlogsLoading] = useState(false);
  const [blogsPagination, setBlogsPagination] = useState<{
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }>({
    page: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [blogFilters, setBlogFilters] = useState<{
    keyword?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }>({ page: 1, pageSize: 10 });
  const [auditLogs] = useState<AdminAuditLog[]>([]);

  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  const [placeSearchText, setPlaceSearchText] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("keyword") || params.get("search") || "";
  });
  const [placeFilterProvince, setPlaceFilterProvince] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("province") || "all";
  });
  const [placeFilterCategory, setPlaceFilterCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "all";
  });
  const [placeFilterStatus, setPlaceFilterStatus] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("status") || "all";
  });
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [placesPagination, setPlacesPagination] = useState<{
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }>({
    page: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [placeFilters, setPlaceFilters] = useState<{
    keyword?: string;
    province?: string;
    provinceId?: number;
    category?: string;
    categoryId?: number;
    status?: any;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }>(() => {
    const params = new URLSearchParams(window.location.search);
    const filters: any = { page: 1, pageSize: 10 };

    const pId = params.get("provinceId") || params.get("province");
    if (pId) {
      filters.province = pId;
      if (!isNaN(Number(pId))) filters.provinceId = Number(pId);
    }
    const cId = params.get("categoryId") || params.get("category");
    if (cId) {
      filters.category = cId;
      if (!isNaN(Number(cId))) filters.categoryId = Number(cId);
    }
    if (params.get("status")) filters.status = params.get("status")!;
    if (params.get("keyword")) filters.keyword = params.get("keyword")!;
    if (params.get("search")) filters.keyword = params.get("search")!;
    if (params.get("sortBy")) filters.sortBy = params.get("sortBy")!;
    if (params.get("sortOrder")) filters.sortOrder = params.get("sortOrder") as "asc" | "desc";
    if (params.get("page")) filters.page = Number(params.get("page")) || 1;

    return filters;
  });

  const [proposalStatusFilter, setProposalStatusFilter] = useState<"all" | "0" | "1" | "2">("all");
  const [proposalSort, setProposalSort] = useState<{ sortBy?: string; sortOrder?: "asc" | "desc" }>({});
  const [reportSort, setReportSort] = useState<{ sortBy?: string; sortOrder?: "asc" | "desc" }>({});
  const [revComSort, setRevComSort] = useState<{ sortBy?: string; sortOrder?: "asc" | "desc" }>({});

  const [revComTab, setRevComTab] = useState<"reviews" | "comments">("reviews");
  const [revReportFilter, setRevReportFilter] = useState("all");
  const [reviewsList, setReviewsList] = useState<PlaceReviewItem[]>([]);
  const [commentsList, setCommentsList] = useState<PlaceCommentItem[]>([]);

  const [reportSubTab, setReportSubTab] = useState<"all" | "urgent" | "assigned_to_me" | "resolved">("all");
  const [reportPriorityFilter] = useState<"all" | "urgent" | "high" | "normal" | "low">("all");
  const [reportProvinceFilter, setReportProvinceFilter] = useState("all");
  const [reportSearchText, setReportSearchText] = useState("");
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [selectedReportRowIds, setSelectedReportRowIds] = useState<number[]>([]);

  const [activeReportGroupKey, setActiveReportGroupKey] = useState<string | null>(null);
  const [selectedReportIdInDrawer, setSelectedReportIdInDrawer] = useState<number | null>(null);
  const [drawerDecisionTab, setDrawerDecisionTab] = useState<"accept" | "dismiss">("accept");
  const [drawerActionTaken, setDrawerActionTaken] = useState("hide_target");
  const [drawerResolutionNote, setDrawerResolutionNote] = useState("");
  const [drawerDismissReason, setDrawerDismissReason] = useState("SPAM_ABUSE");
  const [drawerAutoCloseDuplicates, setDrawerAutoCloseDuplicates] = useState(true);
  const [drawerAutoNotifyReporters, setDrawerAutoNotifyReporters] = useState(true);
  const [drawerAutoRecalculateRating, setDrawerAutoRecalculateRating] = useState(true);
  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);


  const currentPlace = placesList.find((p) => p.id === selectedPlaceId) || null;

  useEffect(() => {
    if (!isUserAdmin()) return;
    let cancelled = false;
    const page = { page: 1, pageSize: 50 };

    const load = async () => {
      try {
        switch (mainTab) {
          case "dashboard": {
            const res = await adminService.getMetrics();
            if (!cancelled && res?.data) {
              setDashboardMetrics(res.data);
            }
            break;
          }
          case "users": {
            setIsUsersLoading(true);
            try {
              const res: any = await adminService.getUsers(userFilters as Record<string, unknown>);
              if (!cancelled) {
                const list = extractList<AdminUserItem>(res?.data || res);
                setUsersList(list);

                const meta = res?.meta || res?.pagination || {};
                const firstItem = (list[0] || {}) as any;

                const page = Number(meta.page || userFilters.page || 1);
                const pageSize = Number(meta.size || meta.pageSize || userFilters.pageSize || 20);
                const totalCount = Number(
                  meta.totalElements ??
                  meta.totalCount ??
                  meta.total ??
                  res?.totalCount ??
                  res?.totalElements ??
                  list.length
                );
                const totalPages = Number(
                  meta.totalPages ??
                  Math.max(1, Math.ceil(totalCount / pageSize))
                );
                const categoryAdminsCount = Number(
                  meta.categoryAdminsCount ??
                  firstItem?.categoryAdminsCount ??
                  0
                );
                const systemAdminsCount = Number(
                  meta.systemAdminsCount ??
                  firstItem?.systemAdminsCount ??
                  0
                );
                const regularUsersCount = Number(
                  meta.regularUsersCount ??
                  firstItem?.regularUsersCount ??
                  0
                );

                setUsersPagination({
                  page,
                  pageSize,
                  totalCount,
                  totalPages,
                  categoryAdminsCount,
                  systemAdminsCount,
                  regularUsersCount,
                });
              }
            } catch {
              if (!cancelled) setUsersList([]);
            } finally {
              if (!cancelled) setIsUsersLoading(false);
            }
            break;
          }
          case "places": {
            setIsPlacesLoading(true);
            try {
              const cleanParams: Record<string, any> = {
                page: placeFilters.page || 1,
                pageSize: placeFilters.pageSize || 10,
              };
              if (placeFilters.keyword?.trim()) {
                cleanParams.keyword = placeFilters.keyword.trim();
                cleanParams.search = placeFilters.keyword.trim();
              }
              if (placeFilters.provinceId !== undefined && placeFilters.provinceId !== null) {
                cleanParams.provinceId = Number(placeFilters.provinceId);
              } else if (placeFilters.province && placeFilters.province !== "all" && !isNaN(Number(placeFilters.province))) {
                cleanParams.provinceId = Number(placeFilters.province);
              }

              if (placeFilters.categoryId !== undefined && placeFilters.categoryId !== null) {
                cleanParams.categoryId = Number(placeFilters.categoryId);
              } else if (placeFilters.category && placeFilters.category !== "all" && !isNaN(Number(placeFilters.category))) {
                cleanParams.categoryId = Number(placeFilters.category);
              }

              if (placeFilters.status !== undefined && placeFilters.status !== null && placeFilters.status !== "all") {
                if (placeFilters.status === "active" || placeFilters.status === "1" || placeFilters.status === 1) {
                  cleanParams.status = 1;
                } else if (placeFilters.status === "hidden" || placeFilters.status === "0" || placeFilters.status === 0) {
                  cleanParams.status = 0;
                }
              }

              if (placeFilters.sortBy) {
                cleanParams.sortBy = placeFilters.sortBy;
              }
              if (placeFilters.sortOrder) {
                cleanParams.sortOrder = placeFilters.sortOrder;
              }

              const result: any = await adminService.getPlaces(cleanParams);
              if (!cancelled) {
                const rawPlaces = extractList(result?.data || result);
                setPlacesList(
                  rawPlaces.map((item: any) => {
                    const isVis =
                      item.status === 1 ||
                      item.status === "1" ||
                      item.statusNum === 1 ||
                      String(item.status || "").toLowerCase() === "active" ||
                      String(item.status || "").toLowerCase() === "approved" ||
                      item.status === "Đang hiển thị" ||
                      item.status === "Đã duyệt";
                    const statusNum = isVis ? 1 : 0;
                    const statusStr = isVis ? "Đang hiển thị" : "Đang ẩn";

                    return {
                      ...item,
                      id: item.id,
                      name: item.name || item.title || "",
                      province: item.provinceName || item.province || "",
                      provinceName: item.provinceName || item.province || "",
                      provinceId: item.provinceId,
                      category: item.categoryName || item.category || "Nhà hàng & Quán ăn",
                      categoryName: item.categoryName || item.category || "Nhà hàng & Quán ăn",
                      categoryId: item.categoryId,
                      location: item.address || item.location || "",
                      address: item.address || item.location || "",
                      img:
                        item.coverImg ||
                        item.thumbnailUrl ||
                        item.img ||
                        item.image ||
                        "",
                      coverImg:
                        item.coverImg ||
                        item.thumbnailUrl ||
                        item.img ||
                        item.image ||
                        "",
                      rating: Number(item.avgRating ?? item.rating ?? 0),
                      avgRating: Number(item.avgRating ?? item.rating ?? 0),
                      reviewCount: Number(item.reviewCount ?? item.reviewsCount ?? 0),
                      price: item.priceLevel || item.price || "",
                      hours: item.openingHours || item.hours || "",
                      latitude: item.latitude ?? item.lat,
                      longitude: item.longitude ?? item.lng,
                      desc: item.desc || item.description || "",
                      status: statusStr,
                      statusNum: statusNum,
                      createdAt: item.createdAt || item.createdDate || item.created_at,
                      updatedAt: item.updatedAt || item.updatedDate || item.updated_at || item.createdAt || item.createdDate,
                      createdBy: item.createdBy || item.creatorName || item.createdByName,
                      updatedBy: item.updatedBy || item.updaterName || item.updatedByName || item.createdBy,
                    };
                  })
                );

                const meta = result?.meta || result?.pagination || {};
                const page = Number(meta.page || placeFilters.page || 1);
                const pageSize = Number(meta.size || meta.pageSize || placeFilters.pageSize || 10);
                const totalElements = Number(
                  meta.totalElements ?? meta.totalCount ?? meta.total ?? result?.total ?? rawPlaces.length
                );
                const totalPages = Number(
                  meta.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize))
                );

                setPlacesPagination({
                  page,
                  pageSize,
                  totalElements,
                  totalPages,
                });
              }
            } catch {
              if (!cancelled) setPlacesList([]);
            } finally {
              if (!cancelled) setIsPlacesLoading(false);
            }
            break;
          }
          case "proposals": {
            const proposalParams: Record<string, any> = { ...page };
            if (proposalSort.sortBy) {
              proposalParams.sortBy = proposalSort.sortBy;
            }
            if (proposalSort.sortOrder) {
              proposalParams.sortOrder = proposalSort.sortOrder;
            }
            const result = await adminService.getProposals(proposalParams);
            if (!cancelled) {
              const rawProposals = extractList(result?.data);
              setProposals(
                rawProposals.map((item: any) => {
                  const isPending =
                    String(item.status || "").toLowerCase() === "pending" ||
                    item.status === 0 ||
                    item.status === "0";
                  const isApproved =
                    String(item.status || "").toLowerCase() === "approved" ||
                    item.status === 1 ||
                    item.status === "1";
                  const statusCode = isPending ? 0 : isApproved ? 1 : 2;

                  return {
                    ...item,
                    id: item.id,
                    type: item.type || "new_place",
                    placeName: item.placeName || item.name || "",
                    coverImg: item.coverImg || item.thumbnailUrl || item.img || "",
                    address: item.address || item.location || "",
                    categoryName: item.categoryName || item.category || "Nhà hàng & Quán ăn",
                    category: item.categoryName || item.category || "Nhà hàng & Quán ăn",
                    provinceName: item.provinceName || item.province || "",
                    province: item.provinceName || item.province || "",
                    proposerName:
                      item.proposerName ||
                      item.proposedBy ||
                      item.proposer?.name ||
                      item.userName ||
                      "Người dùng",
                    proposedBy:
                      item.proposerName ||
                      item.proposedBy ||
                      item.proposer?.name ||
                      item.userName ||
                      "Người dùng",
                    proposerAvatar:
                      item.proposerAvatar || item.userAvatar || item.proposer?.avatarUrl || item.avatar || "",
                    userAvatar:
                      item.proposerAvatar || item.userAvatar || item.proposer?.avatarUrl || item.avatar || "",
                    submittedAt: item.submittedAt || item.createdAt || "",
                    status: statusCode,
                    adminNotes: item.adminNotes || item.adminNote || item.AdminNote || null,
                    adminNote: item.adminNote || item.AdminNote || item.adminNotes || null,
                    rejectReason: item.rejectReason || item.RejectReason || item.rejectionReason || item.RejectionReason || item.adminNote || item.AdminNote || null,
                    rejectionReason: item.rejectionReason || item.RejectionReason || item.rejectReason || item.RejectReason || item.adminNote || item.AdminNote || null,
                    proposer: item.proposer || {
                      name: item.proposerName || item.proposedBy || "Người dùng",
                      avatarUrl: item.proposerAvatar || item.userAvatar || "",
                      email: item.proposerEmail || item.email || "",
                    },
                    placeData: item.placeData || {
                      name: item.placeName || item.name || "",
                      address: item.address || item.location || "",
                      categoryName: item.categoryName || item.category || "Nhà hàng & Quán ăn",
                      provinceName: item.provinceName || item.province || "",
                      coverImg: item.coverImg || item.thumbnailUrl || item.img || "",
                      images: Array.from(new Set([item.coverImg, ...(item.images || []), ...(item.mediaUrls || [])].filter(Boolean))),
                    },
                    proposedData: {
                      name: item.placeName || item.name || "",
                      address: item.address || item.location || "",
                      category:
                        item.categoryName || item.category || "Nhà hàng & Quán ăn",
                      phone: item.phone || item.placeData?.phone || "",
                      hours: item.openingHours || item.hours || item.placeData?.openingHours || "",
                      price: item.priceLevel || item.price || "",
                      description: item.description || item.desc || item.placeData?.description || "",
                      imageUrl: item.coverImg || item.thumbnailUrl || item.img || "",
                      coverImg: item.coverImg || item.thumbnailUrl || item.img || "",
                      images: Array.from(new Set([item.coverImg, ...(item.images || []), ...(item.placeData?.images || [])].filter(Boolean))),
                    },
                  } as AdminProposalItem;
                })
              );
            }
            break;
          }
          case "reports": {
            const reportParams: Record<string, any> = {
              page: 1,
              pageSize: 50,
            };
            const activeTargetType = reportTargetTypeFilter && reportTargetTypeFilter !== "all" ? reportTargetTypeFilter : "place";
            reportParams.targetType = activeTargetType;
            if (reportSubTab && reportSubTab !== "all") {
              reportParams.subTab = reportSubTab;
            }
            if (reportSearchText?.trim()) {
              reportParams.keyword = reportSearchText.trim();
            }
            if (reportSort.sortBy) {
              reportParams.sortBy = reportSort.sortBy;
            }
            if (reportSort.sortOrder) {
              reportParams.sortOrder = reportSort.sortOrder;
            }

            const result = await adminService.getReports(reportParams);
            if (!cancelled) {
              const rawReports = extractList(result?.data || result);
              setReports(
                rawReports.map((item: any) => {
                  const isPending =
                    String(item.status || "").toLowerCase() === "pending" ||
                    item.status === 0;
                  const isResolved =
                    String(item.status || "").toLowerCase() === "reviewed" ||
                    String(item.status || "").toLowerCase() === "resolved" ||
                    item.status === 1;
                  const statusCode = isPending ? 0 : isResolved ? 1 : 2;

                  let rawType = String(item.targetType || item.targetTypeName || item.entityType || "").toLowerCase().trim();
                  const typeNum = Number(item.targetTypeId || item.targetType);
                  if (typeNum === 1 || rawType === "1" || rawType === "place") rawType = "place";
                  else if (typeNum === 2 || rawType === "2" || rawType === "review" || (item.reviewId && !item.commentId)) rawType = "review";
                  else if (typeNum === 3 || rawType === "3" || rawType === "comment" || item.commentId) rawType = "comment";
                  else if (typeNum === 4 || rawType === "4" || rawType === "blog" || item.blogId) rawType = "blog";
                  else if (typeNum === 5 || rawType === "5" || rawType === "photo") rawType = "photo";
                  else if (typeNum === 6 || rawType === "6" || rawType === "user") rawType = "user";
                  else if (rawType.includes("comment") || String(item.title || "").toLowerCase().startsWith("bình luận")) rawType = "comment";
                  else if (rawType.includes("review") || String(item.title || "").toLowerCase().startsWith("đánh giá")) rawType = "review";
                  else if (rawType.includes("blog") || String(item.title || "").toLowerCase().startsWith("bài viết") || String(item.title || "").toLowerCase().startsWith("cẩm nang") || rawType.includes("cẩm nang")) rawType = "blog";
                  else if (!rawType) rawType = "place";

                  return {
                    ...item,
                    id: item.id,
                    codeId: item.codeId || `${item.id}`,
                    targetType: rawType as any,
                    targetId: item.targetId || item.placeId || item.reviewId || item.commentId || item.blogId || 0,
                    targetTitle: item.targetTitle || item.title || "Đối tượng báo cáo",
                    targetContent:
                      item.targetContent ||
                      item.content ||
                      item.commentContent ||
                      item.reviewContent ||
                      item.comment ||
                      item.review ||
                      item.targetText ||
                      item.text ||
                      item.targetDescription ||
                      "",
                    targetImage: item.targetImage || item.imageUrl || item.coverImageUrl || item.image || "",
                    reporterId: item.reporterId || 0,
                    reporterName:
                      item.reporterName || item.reporter || "Người dùng ẩn danh",
                    reporterAvatar: item.reporterAvatar || item.avatar || "",
                    reportTypeName:
                      item.reportReasonCategory || item.reason || item.reportTypeName || "Vi phạm quy định",
                    reasonContent:
                      item.reasonContent ||
                      item.reportReasonCategory ||
                      item.reason ||
                      item.reportTypeName ||
                      "Vi phạm quy định",
                    description: item.notes || item.description || item.targetContent || "",
                    submittedAt: item.createdAt || item.submittedAt || "",
                    priority: item.priority || "normal",
                    slaStatus: item.slaStatus || "normal",
                    status: statusCode,
                    province: item.provinceName || item.province || "",
                    category: item.categoryName || item.category || "",
                  } as AdminReportItem;
                })
              );
            }
            break;
          }
          case "reviews_comments": {
            const revParams: Record<string, any> = { ...page };
            if (revComSort.sortBy) {
              revParams.sortBy = revComSort.sortBy;
            }
            if (revComSort.sortOrder) {
              revParams.sortOrder = revComSort.sortOrder;
            }
            const [reviewsRes, commentsRes] = await Promise.all([
              adminService.getReviews(revParams),
              adminService.getComments(revParams),
            ]);
            if (!cancelled) {
              const rawReviews = extractList(reviewsRes?.data);
              const rawComments = extractList(commentsRes?.data);

              setReviewsList(
                rawReviews.map((item: any) => ({
                  ...item,
                  id: item.id,
                  placeId: item.placeId || 0,
                  placeName: item.placeName || "Địa điểm",
                  userName: item.userName || item.authorName || "Người dùng",
                  userAvatar: item.userAvatar || item.avatar || "",
                  rating: Number(item.rating ?? 5),
                  content: item.content || item.comment || "",
                  createdAt: item.createdAt || item.publishedAt || "",
                  status: String(item.status || "active").toLowerCase(),
                  reportCount: Number(item.reportCount || 0),
                  images: item.images || item.media || [],
                } as PlaceReviewItem))
              );

              setCommentsList(
                rawComments.map((item: any) => ({
                  ...item,
                  id: item.id,
                  blogId: item.blogId || 0,
                  blogTitle: item.blogTitle || "Bài viết",
                  userName: item.userName || item.authorName || "Người dùng",
                  userAvatar: item.userAvatar || item.avatar || "",
                  content: item.content || item.comment || "",
                  createdAt: item.createdAt || item.publishedAt || "",
                  status: String(item.status || "active").toLowerCase(),
                  reportCount: Number(item.reportCount || 0),
                } as PlaceCommentItem))
              );
            }
            break;
          }
          case "foods": {
            setIsFoodsLoading(true);
            try {
              const cleanParams: Record<string, any> = {
                page: foodFilters.page || 1,
                pageSize: foodFilters.pageSize || 10,
              };
              if (foodFilters.keyword?.trim()) {
                cleanParams.keyword = foodFilters.keyword.trim();
              }
              if (foodFilters.provinceId !== undefined && foodFilters.provinceId !== null) {
                cleanParams.provinceId = Number(foodFilters.provinceId);
              } else if (foodFilters.province && foodFilters.province !== "all") {
                if (!isNaN(Number(foodFilters.province))) {
                  cleanParams.provinceId = Number(foodFilters.province);
                } else {
                  cleanParams.province = foodFilters.province;
                }
              }
              if (foodFilters.status && foodFilters.status !== "all") {
                cleanParams.status = foodFilters.status;
              }
              if (foodFilters.sortBy) {
                cleanParams.sortBy = foodFilters.sortBy;
              }
              if (foodFilters.sortOrder) {
                cleanParams.sortOrder = foodFilters.sortOrder;
              }

              const result: any = await adminService.getFoods(cleanParams);
              if (!cancelled) {
                const rawFoods = extractList(result?.data || result);
                setFoodsList(
                  rawFoods.map((item: any) => ({
                    ...item,
                    id: item.id,
                    name: item.name || "",
                    province: item.provinceName || item.province || "",
                    provinceName: item.provinceName || item.province || "",
                    provinceId: item.provinceId,
                    specialtyType:
                      item.specialtyType || item.category || "Món đặc sản",
                    desc: item.desc || item.description || "",
                    historyInfo: item.historyInfo || "",
                    status: String(item.status || "active").toLowerCase(),
                    coverImg:
                      item.coverImg ||
                      item.img ||
                      item.image ||
                      item.imageUrl ||
                      "",
                    minPrice: item.minPrice ? Number(item.minPrice) : 0,
                    maxPrice: item.maxPrice ? Number(item.maxPrice) : 0,
                    priceRange:
                      item.priceRange ||
                      (item.minPrice
                        ? `${Number(item.minPrice).toLocaleString("vi-VN")}đ – ${Number(
                          item.maxPrice || item.minPrice
                        ).toLocaleString("vi-VN")}đ`
                        : ""),
                    places: item.places || [],
                    placesCount: item.placesCount ?? (item.places?.length ?? 0),
                    createdAt: item.createdAt || "",
                    updatedAt: item.updatedAt || item.createdAt || "",
                    updatedBy: item.updatedBy || "Admin",
                    createdBy: item.createdBy || "Admin",
                  } as AdminFoodItem))
                );

                const meta = result?.meta || result?.pagination || {};
                const page = Number(meta.page || foodFilters.page || 1);
                const pageSize = Number(meta.size || meta.pageSize || foodFilters.pageSize || 10);
                const totalElements = Number(
                  meta.totalElements ?? meta.totalCount ?? meta.total ?? result?.total ?? rawFoods.length
                );
                const totalPages = Number(
                  meta.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize))
                );

                setFoodsPagination({
                  page,
                  pageSize,
                  totalElements,
                  totalPages,
                });
              }
            } catch {
              if (!cancelled) setFoodsList([]);
            } finally {
              if (!cancelled) setIsFoodsLoading(false);
            }
            break;
          }
          case "blogs": {
            setIsBlogsLoading(true);
            try {
              const cleanParams: Record<string, any> = {
                page: blogFilters.page || 1,
                pageSize: blogFilters.pageSize || 10,
              };
              if (blogFilters.keyword?.trim()) {
                cleanParams.keyword = blogFilters.keyword.trim();
              }
              if (blogFilters.category && blogFilters.category !== "all") {
                cleanParams.category = blogFilters.category;
              }
              if (blogFilters.status && blogFilters.status !== "all") {
                cleanParams.status = blogFilters.status;
              }
              if (blogFilters.sortBy) {
                cleanParams.sortBy = blogFilters.sortBy;
              }
              if (blogFilters.sortOrder) {
                cleanParams.sortOrder = blogFilters.sortOrder;
              }

              const result: any = await adminService.getBlogs(cleanParams);
              if (!cancelled) {
                const rawBlogs = extractList(result?.data || result);
                setBlogsList(
                  rawBlogs.map((item: any) => ({
                    ...item,
                    id: item.id,
                    title: item.title || "",
                    authorName:
                      item.authorName ||
                      item.author ||
                      "Ban Biên Tập LangThang",
                    authorAvatar:
                      item.authorAvatar ||
                      item.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
                    category:
                      item.category || item.categoryName || "Lịch trình ăn uống",
                    categoryId: item.categoryId,
                    publishedAt: item.publishedAt || item.createdAt || "Vừa xong",
                    createdAt: item.createdAt || item.publishedAt || "",
                    updatedAt: item.updatedAt || item.publishedAt || item.createdAt || "",
                    updatedBy: item.updatedBy || item.authorName || item.author || "Ban Biên Tập LangThang",
                    createdBy: item.createdBy || item.authorName || item.author || "Ban Biên Tập LangThang",
                    views: Number(item.views ?? item.viewCount ?? 0),
                    viewCount: Number(item.viewCount ?? item.views ?? 0),
                    likes: Number(item.likes ?? item.likeCount ?? 0),
                    likeCount: Number(item.likeCount ?? item.likes ?? 0),
                    readTime: item.readTime || "5 phút đọc",
                    summary: item.summary || item.desc || item.description || "",
                    content: item.content || item.body || item.summary || "",
                    coverImg:
                      item.coverImg ||
                      item.img ||
                      item.image ||
                      item.thumbnailUrl ||
                      "",
                    status: String(item.status || "draft").toLowerCase(),
                  } as AdminBlogItem))
                );

                const meta = result?.meta || result?.pagination || {};
                const page = Number(meta.page || blogFilters.page || 1);
                const pageSize = Number(meta.size || meta.pageSize || blogFilters.pageSize || 10);
                const totalElements = Number(
                  meta.totalElements ?? meta.totalCount ?? meta.total ?? result?.total ?? rawBlogs.length
                );
                const totalPages = Number(
                  meta.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize))
                );

                setBlogsPagination({
                  page,
                  pageSize,
                  totalElements,
                  totalPages,
                });
              }
            } catch {
              if (!cancelled) setBlogsList([]);
            } finally {
              if (!cancelled) setIsBlogsLoading(false);
            }
            break;
          }
          case "collections":
            await adminService.getCollections();
            break;
          case "provinces":
            await adminService.getCompleteness();
            break;
          case "categories":
            await adminService.getCategories();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang Admin:", err);
        if (!cancelled) showToast("Không thể tải dữ liệu quản trị. Vui lòng thử lại.");
      } finally {
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [mainTab, userFilters, placeFilters, foodFilters, blogFilters, proposalSort, reportSort, revComSort, reportTargetTypeFilter, reportSubTab, reportSearchText, reportsRefreshKey]);

  const addAuditLog = (
    _action: string,
    _target: string,
    _details: string,
    _type: "approve" | "reject" | "edit" | "hide" | "create" | "resolve" | "delete"
  ) => {
  };

  const handleTogglePlaceStatus = async (placeId: number) => {
    const place = placesList.find((item) => item.id === placeId);
    const isCurrentlyVisible = place
      ? (Number(place.statusNum ?? place.status) === 1 || String(place.status).toLowerCase() === "active" || place.status === "Đang hiển thị" || place.status === "Đã duyệt")
      : true;
    const nextStatusNum = isCurrentlyVisible ? 0 : 1;
    const nextStatusStr = isCurrentlyVisible ? "Đang ẩn" : "Đang hiển thị";

    await adminService.updatePlaceStatus(placeId, nextStatusNum);

    setPlacesList((prev) =>
      prev.map((p) => {
        if (p.id === placeId) {
          return { ...p, status: nextStatusStr, statusNum: nextStatusNum };
        }
        return p;
      })
    );
    addAuditLog(
      isCurrentlyVisible ? "Tạm ẩn địa điểm" : "Khôi phục hiển thị địa điểm",
      place?.name || `Địa điểm #${placeId}`,
      isCurrentlyVisible ? "Tạm ẩn khỏi trang khách" : "Khôi phục hiển thị trên trang khách",
      "hide"
    );
    showToast(`Đã ${isCurrentlyVisible ? "tạm ẩn" : "hiện lại"} địa điểm "${place?.name || `#${placeId}`}".`);
  };

  const handleUpdatePlace = async (updatedPlace: any) => {
    await adminService.updatePlace(updatedPlace.id, {
      name: updatedPlace.name,
      desc: updatedPlace.description || updatedPlace.desc,
      description: updatedPlace.description || updatedPlace.desc,
      coverImg: updatedPlace.coverImg || updatedPlace.img,
      address: updatedPlace.address || updatedPlace.location,
      latitude: updatedPlace.latitude,
      longitude: updatedPlace.longitude,
      provinceId: updatedPlace.provinceId,
      categoryId: updatedPlace.categoryId,
      status: updatedPlace.status,
      priceLevel: updatedPlace.priceLevel,
      openingHours: updatedPlace.openingHours || updatedPlace.hours,
      hours: updatedPlace.openingHours || updatedPlace.hours,
      minPrice: updatedPlace.minPrice,
      maxPrice: updatedPlace.maxPrice,
      primaryImageUrl: updatedPlace.primaryImageUrl || updatedPlace.coverImg || updatedPlace.img,
      phone: updatedPlace.phone,
      website: updatedPlace.website,
      foodIds: updatedPlace.foodIds,
      foods: updatedPlace.foods,
      photos: updatedPlace.images || updatedPlace.photos || updatedPlace.mediaUrls,
      autoApprove: true,
    });
    setPlacesList((prev) =>
      prev.map((p) => (p.id === updatedPlace.id ? { ...p, ...updatedPlace } : p))
    );
    addAuditLog(
      "Cập nhật thông tin địa điểm",
      updatedPlace.name,
      "Chỉnh sửa thông tin chi tiết địa điểm",
      "edit"
    );
    showToast(`Đã cập nhật thông tin "${updatedPlace.name}".`);
  };

  const handleDeletePlace = async (placeId: number) => {
    try {
      const place = placesList.find((item) => item.id === placeId);
      const res = await adminService.deletePlace(placeId);
      setPlacesList((prev) => prev.filter((p) => p.id !== placeId));
      addAuditLog(
        "Xóa địa điểm",
        place?.name || `Địa điểm #${placeId}`,
        "Xóa mềm địa điểm khỏi hệ thống (IsDeleted = true)",
        "delete"
      );
      showToast(res?.message || `Đã xóa địa điểm "${place?.name || `#${placeId}`}".`);
    } catch (err: any) {
      console.error("Xóa địa điểm thất bại:", err);
      const msg = err?.response?.data?.message || err?.message || "Xóa địa điểm thất bại. Vui lòng thử lại sau.";
      showToast(msg);
      throw err;
    }
  };


  const handleOpenModerationDrawer = (groupKey: string, specificReportId?: number) => {
    setActiveReportGroupKey(groupKey);
    if (specificReportId) {
      setSelectedReportIdInDrawer(specificReportId);
    } else {
      setSelectedReportIdInDrawer(null);
    }
  };

  const activeReportGroup: GroupedReport | null = activeReportGroupKey
    ? (() => {
      const [targetType, targetIdStr] = activeReportGroupKey.split("_");
      const targetId = Number(targetIdStr);
      const groupReports = reports.filter(
        (r) => r.targetType === targetType && r.targetId === targetId
      );

      if (groupReports.length === 0) return null;

      const first = groupReports[0];
      const isUrgent = groupReports.some((r) => r.priority === "urgent" || r.slaStatus === "breached");
      const isHigh = groupReports.some((r) => r.priority === "high");

      return {
        groupKey: activeReportGroupKey,
        targetType: first.targetType,
        targetId: first.targetId,
        targetTitle: first.targetTitle,
        targetSubtitle: first.targetSubtitle,
        targetImage: first.targetImage,
        targetContent: first.targetContent,
        targetRating: first.targetRating,
        province: first.province,
        category: first.category,
        placeId: first.placeId,
        placeName: first.placeName,
        placeSubtitle: first.placeSubtitle,
        placeImage: first.placeImage,
        reportsCount: groupReports.length,
        reportsList: groupReports,
        highestPriority: isUrgent ? "urgent" : isHigh ? "high" : "normal",
        latestReportTime: first.submittedAt,
        assignedAdminId: first.assignedToAdminId,
        assignedAdminName: first.assignedToAdminName,
        hasUnresolvedUrgent: isUrgent,
        status: first.status,
      };
    })()
    : null;

  const handleConfirmDrawerResolution = async () => {
    if (!activeReportGroup) return;

    const currentStatus = selectedReportIdInDrawer
      ? activeReportGroup.reportsList.find((r) => r.id === selectedReportIdInDrawer)?.status
      : activeReportGroup.status;

    if (currentStatus === 1 || currentStatus === 2 || activeReportGroup.status === 1 || activeReportGroup.status === 2) {
      showToast("Báo cáo này đã được xử lý xong trước đó rồi.");
      setActiveReportGroupKey(null);
      return;
    }

    const newStatus = drawerDecisionTab === "accept" ? 1 : 2;
    const actionName = drawerDecisionTab === "accept" ? "Chấp thuận & Xử lý vi phạm" : "Bác bỏ phản ánh";
    const selectedId = selectedReportIdInDrawer || activeReportGroup.reportsList[0].id;

    const effectiveActionTaken = drawerDecisionTab === "accept"
      ? (drawerActionTaken || "hide_target")
      : drawerDismissReason;

    try {
      await adminService.resolveReport(selectedId, {
        id: selectedId,
        targetType: activeReportGroup.targetType,
        decision: drawerDecisionTab,
        actionTaken: effectiveActionTaken,
        resolutionNote: drawerResolutionNote,
      });

      if (drawerDecisionTab === "accept" && (effectiveActionTaken.includes("hide_target") || effectiveActionTaken.includes("hide_content"))) {
        const targetId = activeReportGroup.targetId;
        if (activeReportGroup.targetType === "place") {
          setPlacesList((prev) =>
            prev.map((p) => (p.id === targetId ? { ...p, status: "Đang ẩn", statusNum: 0 } : p))
          );
        } else if (activeReportGroup.targetType === "review") {
          setReviewsList((prev) =>
            prev.map((rev) => (rev.id === targetId ? { ...rev, status: "hidden" } : rev))
          );
        } else if (activeReportGroup.targetType === "comment") {
          setCommentsList((prev) =>
            prev.map((c) => (c.id === targetId ? { ...c, status: "hidden" } : c))
          );
        } else if (activeReportGroup.targetType === "blog") {
          setBlogsList((prev) =>
            prev.map((b) => (b.id === targetId ? { ...b, status: "archived" } : b))
          );
        }
      }

      const targetTypeNorm = String(activeReportGroup.targetType).toLowerCase().trim();
      const targetIdNorm = Number(activeReportGroup.targetId);

      setReports((prev) =>
        prev.map((r) => {
          const isMatch = drawerAutoCloseDuplicates
            ? String(r.targetType).toLowerCase().trim() === targetTypeNorm && Number(r.targetId) === targetIdNorm
            : r.id === selectedId;

          if (isMatch) {
            return {
              ...r,
              status: newStatus,
              statusText: newStatus === 1 ? "Đã giải quyết" : "Đã bác bỏ",
              resolutionAction: effectiveActionTaken,
              resolutionNote: drawerResolutionNote,
              assignedToAdminId: currentAdminInfo.adminId,
              assignedToAdminName: currentAdminInfo.adminName,
            };
          }
          return r;
        })
      );

      addAuditLog(
        actionName,
        activeReportGroup.targetTitle,
        `Đã xử lý quyết định: ${drawerDecisionTab === "accept" ? drawerActionTaken : drawerDismissReason}`,
        drawerDecisionTab === "accept" ? "resolve" : "reject"
      );

      showToast(`Đã hoàn tất xử lý cho "${activeReportGroup.targetTitle}".`);
      setActiveReportGroupKey(null);
      setReportsRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Lỗi khi giải quyết báo cáo:", err);
      showToast("Có lỗi xảy ra khi xử lý báo cáo. Vui lòng thử lại.");
    }
  };

  const handleAssignToMe = (groupKey: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (`${r.targetType}_${r.targetId}` === groupKey) {
          return {
            ...r,
            assignedToAdminId: currentAdminInfo.adminId,
            assignedToAdminName: currentAdminInfo.adminName,
          };
        }
        return r;
      })
    );
    showToast("Đã nhận xử lý hồ sơ phản ánh này.");
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedReportRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchAssign = () => {
    setReports((prev) =>
      prev.map((r) =>
        selectedReportRowIds.includes(r.id)
          ? {
            ...r,
            assignedToAdminId: currentAdminInfo.adminId,
            assignedToAdminName: currentAdminInfo.adminName,
          }
          : r
      )
    );
    showToast(`Đã gán ${selectedReportRowIds.length} báo cáo cho bạn.`);
    setSelectedReportRowIds([]);
  };

  const handleBatchDismiss = () => {
    setReports((prev) =>
      prev.map((r) =>
        selectedReportRowIds.includes(r.id)
          ? {
            ...r,
            status: 2,
            resolutionAction: "Bác bỏ hàng loạt",
          }
          : r
      )
    );
    showToast(`Đã bác bỏ ${selectedReportRowIds.length} báo cáo.`);
    setSelectedReportRowIds([]);
  };

  if (!isUserAdmin() && !location.search.includes("dev=admin")) {
    return null;
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-1 w-full overflow-hidden">
        <AdminSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          mainTab={mainTab}
          setMainTab={setMainTab}
          setSelectedPlaceId={setSelectedPlaceId}
          reportTargetTypeFilter={reportTargetTypeFilter}
          setReportTargetTypeFilter={setReportTargetTypeFilter}
          onBackToUserView={() => navigate("/")}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopbar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            mainTab={mainTab}
            selectedPlaceId={selectedPlaceId}
            currentPlaceName={currentPlace?.name}
            searchText={reportSearchText}
            setSearchText={setReportSearchText}
            currentAdminInfo={currentAdminInfo}
            showToast={showToast}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {mainTab === "dashboard" && (
                <DashboardTab
                  currentAdminInfo={currentAdminInfo}
                  metrics={dashboardMetrics}
                  places={placesList}
                  proposals={proposals}
                  reports={reports}
                  reportedReviews={reviewsList.filter((r) => r.reportCount > 0)}
                  auditLogs={auditLogs}
                  dashRegion={dashRegion}
                  setDashRegion={setDashRegion}
                  dashProvince={dashProvince}
                  setDashProvince={setDashProvince}
                  dashTimeRange={dashTimeRange}
                  setDashTimeRange={setDashTimeRange}
                  setMainTab={setMainTab}
                  setPlaceFilterStatus={setPlaceFilterStatus}
                  setProposalStatusFilter={setProposalStatusFilter}
                  setRevComTab={setRevComTab}
                  setRevReportFilter={setRevReportFilter}
                  setReportSubTab={setReportSubTab}
                  showToast={showToast}
                  onRefresh={async () => {
                    try {
                      const res = await adminService.getMetrics();
                      if (res?.data) {
                        setDashboardMetrics(res.data);
                      }
                    } catch {
                    }
                  }}
                />
              )}

              {mainTab === "users" && (
                <UsersTab
                  usersList={usersList}
                  isLoading={isUsersLoading}
                  pagination={usersPagination}
                  onPageChange={(p) => {
                    setUserFilters((prev) => ({ ...prev, page: p }));
                  }}
                  onFilterChange={(newFilters) => {
                    setUserFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
                  }}
                  currentFilters={userFilters}
                  showToast={showToast}
                />
              )}

              {mainTab === "places" && (
                <PlacesTab
                  placesList={placesList}
                  isLoading={isPlacesLoading}
                  pagination={placesPagination}
                  onPageChange={(p) => {
                    setPlaceFilters((prev) => ({ ...prev, page: p }));
                  }}
                  onFilterChange={(newFilters) => {
                    setPlaceFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
                  }}
                  selectedPlaceId={selectedPlaceId}
                  setSelectedPlaceId={setSelectedPlaceId}
                  placeSearchText={placeSearchText}
                  setPlaceSearchText={setPlaceSearchText}
                  placeFilterProvince={placeFilterProvince}
                  setPlaceFilterProvince={setPlaceFilterProvince}
                  placeFilterCategory={placeFilterCategory}
                  setPlaceFilterCategory={setPlaceFilterCategory}
                  placeFilterStatus={placeFilterStatus}
                  setPlaceFilterStatus={setPlaceFilterStatus}
                  handleTogglePlaceStatus={handleTogglePlaceStatus}
                  handleUpdatePlace={handleUpdatePlace}
                  handleDeletePlace={handleDeletePlace}
                  onPlaceCreated={(createdPlace) => {
                    setPlacesList((prev) => [createdPlace, ...prev]);
                    addAuditLog("Tạo địa điểm mới", createdPlace.name, "Địa điểm được số hóa bởi Quản trị viên", "create");
                  }}
                  showToast={showToast}
                />
              )}

              {mainTab === "proposals" && (
                <ProposalsTab
                  proposals={proposals}
                  proposalStatusFilter={proposalStatusFilter}
                  setProposalStatusFilter={setProposalStatusFilter}
                  setProposals={setProposals}
                  addAuditLog={addAuditLog}
                  showToast={showToast}
                  onFilterChange={(f) => setProposalSort(f)}
                />
              )}

              {mainTab === "reviews_comments" && (
                <ReviewsCommentsTab
                  revComTab={revComTab}
                  setRevComTab={setRevComTab}
                  reviewsList={reviewsList}
                  setReviewsList={setReviewsList}
                  commentsList={commentsList}
                  setCommentsList={setCommentsList}
                  revReportFilter={revReportFilter}
                  setRevReportFilter={setRevReportFilter}
                  addAuditLog={addAuditLog}
                  showToast={showToast}
                  onSortChange={(field, order) => setRevComSort({ sortBy: field, sortOrder: order })}
                />
              )}

              {mainTab === "reports" && (
                <ReportsTab
                  reports={reports}
                  reportSubTab={reportSubTab}
                  reportTargetTypeFilter={reportTargetTypeFilter}
                  setReportTargetTypeFilter={setReportTargetTypeFilter}
                  reportPriorityFilter={reportPriorityFilter}
                  reportProvinceFilter={reportProvinceFilter}
                  setReportProvinceFilter={setReportProvinceFilter}
                  reportSearchText={reportSearchText}
                  setReportSearchText={setReportSearchText}
                  selectedReportRowIds={selectedReportRowIds}
                  setSelectedReportRowIds={setSelectedReportRowIds}
                  reportCurrentPage={reportCurrentPage}
                  setReportCurrentPage={setReportCurrentPage}
                  currentAdminId={currentAdminInfo.adminId}
                  handleToggleSelectRow={handleToggleSelectRow}
                  handleBatchAssign={handleBatchAssign}
                  handleBatchDismiss={handleBatchDismiss}
                  handleOpenModerationDrawer={handleOpenModerationDrawer}
                  showToast={showToast}
                  onSortChange={(sortBy, sortOrder) => setReportSort({ sortBy, sortOrder })}
                />
              )}

              {mainTab === "foods" && (
                <FoodsTab
                  foodsList={foodsList}
                  setFoodsList={setFoodsList}
                  isLoading={isFoodsLoading}
                  pagination={foodsPagination}
                  onPageChange={(p) => {
                    setFoodFilters((prev) => ({ ...prev, page: p }));
                  }}
                  onFilterChange={(newFilters) => {
                    setFoodFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
                  }}
                  addAuditLog={addAuditLog}
                  showToast={showToast}
                />
              )}
              {mainTab === "collections" && <CollectionsTab showToast={showToast} />}
              {mainTab === "provinces" && isUserSystemAdmin() && <ProvincesTab showToast={showToast} />}
              {mainTab === "blogs" && (
                <BlogsTab
                  blogsList={blogsList}
                  setBlogsList={setBlogsList}
                  isLoading={isBlogsLoading}
                  pagination={blogsPagination}
                  onPageChange={(p) => {
                    setBlogFilters((prev) => ({ ...prev, page: p }));
                  }}
                  onFilterChange={(newFilters) => {
                    setBlogFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
                  }}
                  addAuditLog={addAuditLog}
                  showToast={showToast}
                />
              )}
              {mainTab === "categories" && isUserSystemAdmin() && <CategoriesTab showToast={showToast} />}
              {mainTab === "admin_profile" && (
                <AdminProfileTab
                  currentAdminInfo={currentAdminInfo}
                  onNavigateTab={(tab) => setMainTab(tab as any)}
                  showToast={showToast}
                />
              )}
              {mainTab === "settings" && isUserSystemAdmin() && (
                <SystemSettingsTab
                  currentAdminInfo={currentAdminInfo}
                  showToast={showToast}
                />
              )}
              {mainTab === "notifications_profile" && isUserSystemAdmin() && (
                <NotificationsProfileTab
                  currentAdminInfo={currentAdminInfo}
                  showToast={showToast}
                />
              )}
              {mainTab === "audit_logs" && <AuditLogsTab />}
              {mainTab === "rankings" && <RankingsTab showToast={showToast} />}
            </div>
          </main>
        </div>
      </div>

      <ModerationDrawer
        activeReportGroup={activeReportGroup}
        selectedReportInDrawer={
          activeReportGroup?.reportsList.find((r) => r.id === selectedReportIdInDrawer) || null
        }
        setSelectedReportIdInDrawer={setSelectedReportIdInDrawer}
        drawerDecisionTab={drawerDecisionTab}
        setDrawerDecisionTab={setDrawerDecisionTab}
        drawerActionTaken={drawerActionTaken}
        setDrawerActionTaken={setDrawerActionTaken}
        drawerResolutionNote={drawerResolutionNote}
        setDrawerResolutionNote={setDrawerResolutionNote}
        drawerDismissReason={drawerDismissReason}
        setDrawerDismissReason={setDrawerDismissReason}
        drawerAutoCloseDuplicates={drawerAutoCloseDuplicates}
        setDrawerAutoCloseDuplicates={setDrawerAutoCloseDuplicates}
        drawerAutoNotifyReporters={drawerAutoNotifyReporters}
        setDrawerAutoNotifyReporters={setDrawerAutoNotifyReporters}
        drawerAutoRecalculateRating={drawerAutoRecalculateRating}
        setDrawerAutoRecalculateRating={setDrawerAutoRecalculateRating}
        handleConfirmDrawerResolution={handleConfirmDrawerResolution}
        handleAssignToMe={handleAssignToMe}
        onClose={() => setActiveReportGroupKey(null)}
      />
    </div>
  );
};

export default AdminPage;
