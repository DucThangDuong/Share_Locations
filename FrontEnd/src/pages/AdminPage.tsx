import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, extractList, type AdminMetrics } from "@/services/adminService";
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
} from "@/types/admin.types";

// Modular Admin Components
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ModerationDrawer } from "@/components/admin/ModerationDrawer";
import { AddPlaceModal } from "@/components/admin/modals/AddPlaceModal";

// Modular Tabs
import { DashboardTab } from "@/components/admin/tabs/DashboardTab";
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
  NotificationsProfileTab,
  AuditLogsTab,
} from "@/components/admin/tabs/OtherTabs";

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const storedAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem("user_info") || "{}");
    } catch {
      return {};
    }
  })();
  const currentAdminInfo = {
    adminId: Number(storedAdmin.id || storedAdmin.userId || 0),
    adminName: storedAdmin.fullName || storedAdmin.name || "Quản trị viên",
    role: storedAdmin.role || "Admin",
    avatar: storedAdmin.avatarUrl || storedAdmin.avatar,
  };

  // Navigation State
  const [mainTab, setMainTab] = useState<AdminMainTab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };


  // Global Dashboard Scope
  const [dashRegion, setDashRegion] = useState("all");
  const [dashProvince, setDashProvince] = useState("all");
  const [dashTimeRange, setDashTimeRange] = useState<"today" | "7days" | "30days" | "90days">("7days");
  const [dashboardMetrics, setDashboardMetrics] = useState<AdminMetrics | null>(null);

  // Core Data Stores
  const [placesList, setPlacesList] = useState<any[]>([]);
  const [proposals, setProposals] = useState<AdminProposalItem[]>([]);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [foodsList, setFoodsList] = useState<AdminFoodItem[]>([]);
  const [blogsList, setBlogsList] = useState<AdminBlogItem[]>([]);
  const [auditLogs] = useState<AdminAuditLog[]>([]);

  // Places Filter & Details State
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [placeSearchText, setPlaceSearchText] = useState("");
  const [placeFilterProvince, setPlaceFilterProvince] = useState("all");
  const [placeFilterStatus, setPlaceFilterStatus] = useState("all");

  // Proposals Filter
  const [proposalStatusFilter, setProposalStatusFilter] = useState<"all" | "0" | "1" | "2">("all");

  // Reviews & Comments State
  const [revComTab, setRevComTab] = useState<"reviews" | "comments">("reviews");
  const [revReportFilter, setRevReportFilter] = useState("all");
  const [reviewsList, setReviewsList] = useState<PlaceReviewItem[]>([]);
  const [commentsList, setCommentsList] = useState<PlaceCommentItem[]>([]);

  // Reports Queue State
  const [reportSubTab, setReportSubTab] = useState<"all" | "urgent" | "assigned_to_me" | "resolved">("all");
  const [reportTargetTypeFilter, setReportTargetTypeFilter] = useState<"all" | "place" | "review" | "comment" | "blog" | "photo">("all");
  const [reportPriorityFilter, setReportPriorityFilter] = useState<"all" | "urgent" | "high" | "normal" | "low">("all");
  const [reportProvinceFilter, setReportProvinceFilter] = useState("all");
  const [reportSearchText, setReportSearchText] = useState("");
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [selectedReportRowIds, setSelectedReportRowIds] = useState<number[]>([]);

  // Moderation Drawer State
  const [activeReportGroupKey, setActiveReportGroupKey] = useState<string | null>(null);
  const [selectedReportIdInDrawer, setSelectedReportIdInDrawer] = useState<number | null>(null);
  const [drawerDecisionTab, setDrawerDecisionTab] = useState<"accept" | "dismiss">("accept");
  const [drawerActionTaken, setDrawerActionTaken] = useState("hide_target");
  const [drawerResolutionNote, setDrawerResolutionNote] = useState("");
  const [drawerDismissReason, setDrawerDismissReason] = useState("SPAM_ABUSE");
  const [drawerAutoCloseDuplicates, setDrawerAutoCloseDuplicates] = useState(true);
  const [drawerAutoNotifyReporters, setDrawerAutoNotifyReporters] = useState(true);
  const [drawerAutoRecalculateRating, setDrawerAutoRecalculateRating] = useState(true);

  // Add Place Modal State
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [newPlaceForm, setNewPlaceForm] = useState({
    name: "",
    category: "Nhà hàng & Quán ăn",
    province: "Đà Nẵng",
    location: "",
    price: "35.000đ – 75.000đ",
    hours: "07:00 – 22:00",
    phone: "0905 123 456",
    website: "https://langthang.vn",
    desc: "",
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
  });

  const currentPlace = placesList.find((p) => p.id === selectedPlaceId) || null;

  useEffect(() => {
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
          case "places": {
            const result = await adminService.getPlaces(page);
            if (!cancelled) {
              const rawPlaces = extractList(result?.data);
              setPlacesList(
                rawPlaces.map((item: any) => {
                  const isPending =
                    String(item.status || "").toLowerCase() === "pending" ||
                    item.status === 0;
                  const isHidden =
                    String(item.status || "").toLowerCase() === "suspended" ||
                    String(item.status || "").toLowerCase() === "hidden" ||
                    item.status === 3;
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
                      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
                    coverImg:
                      item.coverImg ||
                      item.thumbnailUrl ||
                      item.img ||
                      item.image ||
                      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
                    rating: Number(item.avgRating ?? item.rating ?? 0),
                    avgRating: Number(item.avgRating ?? item.rating ?? 0),
                    reviewCount: Number(item.reviewCount ?? item.reviewsCount ?? 0),
                    price: item.priceLevel || item.price || "",
                    hours: item.openingHours || item.hours || "",
                    latitude: item.latitude ?? item.lat,
                    longitude: item.longitude ?? item.lng,
                    desc: item.desc || item.description || "",
                    status: isPending ? "Chờ duyệt" : isHidden ? "Đang ẩn" : "Đã duyệt",
                    statusNum: isPending ? 0 : isHidden ? 3 : 1,
                  };
                })
              );
            }
            break;
          }
          case "proposals": {
            const result = await adminService.getProposals(page);
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
                    placeName: item.name || item.placeName || "",
                    proposedBy:
                      item.proposerName ||
                      item.proposedBy ||
                      item.userName ||
                      "Người dùng",
                    userAvatar:
                      item.proposerAvatar || item.userAvatar || item.avatar || "",
                    province: item.provinceName || item.province || "",
                    submittedAt: item.submittedAt || item.createdAt || "",
                    status: statusCode,
                    category: item.categoryName || item.category || "Nhà hàng & Quán ăn",
                    proposedData: {
                      name: item.name || item.placeName || "",
                      address: item.address || item.location || "",
                      category:
                        item.categoryName || item.category || "Nhà hàng & Quán ăn",
                      phone: item.phone || "",
                      hours: item.openingHours || item.hours || "",
                      price: item.priceLevel || item.price || "",
                      desc: item.desc || item.description || "",
                      mediaUrls:
                        item.mediaUrls || (item.coverImg ? [item.coverImg] : []),
                    },
                  } as AdminProposalItem;
                })
              );
            }
            break;
          }
          case "reports": {
            const result = await adminService.getReports({ ...page, status: "Pending" });
            if (!cancelled) {
              const rawReports = extractList(result?.data);
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

                  return {
                    ...item,
                    id: item.id,
                    codeId: item.codeId || `REP-${item.id}`,
                    targetType: String(item.targetType || "place").toLowerCase(),
                    targetId: item.targetId || 0,
                    targetTitle: item.targetTitle || item.title || "Đối tượng báo cáo",
                    reporterId: item.reporterId || 0,
                    reporterName:
                      item.reporterName || item.reporter || "Người dùng ẩn danh",
                    reportTypeName:
                      item.reason || item.reportTypeName || "Vi phạm quy định",
                    reasonContent:
                      item.reason ||
                      item.reasonContent ||
                      item.reportTypeName ||
                      "Vi phạm quy định",
                    description: item.notes || item.description || "",
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
            const [reviewsRes, commentsRes] = await Promise.all([
              adminService.getReviews(page),
              adminService.getComments(page),
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
            const result = await adminService.getFoods(page);
            if (!cancelled) {
              const rawFoods = extractList(result?.data);
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
                    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop",
                  minPrice: item.minPrice ? Number(item.minPrice) : 0,
                  maxPrice: item.maxPrice ? Number(item.maxPrice) : 0,
                  priceRange:
                    item.priceRange ||
                    (item.minPrice
                      ? `${Number(item.minPrice).toLocaleString("vi-VN")}đ – ${Number(
                          item.maxPrice || item.minPrice
                        ).toLocaleString("vi-VN")}đ`
                      : ""),
                  createdAt: item.createdAt || "",
                } as AdminFoodItem))
              );
            }
            break;
          }
          case "blogs": {
            const result = await adminService.getBlogs(page);
            if (!cancelled) {
              const rawBlogs = extractList(result?.data);
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
                    "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop",
                  status: String(item.status || "draft").toLowerCase(),
                } as AdminBlogItem))
              );
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
  }, [mainTab]);

  // ── AUDIT LOG HELPER ──
  const addAuditLog = (
    _action: string,
    _target: string,
    _details: string,
    _type: "approve" | "reject" | "edit" | "hide" | "create" | "resolve" | "delete"
  ) => {
    // Audit records are created by the backend transaction; this UI only reads them.
  };

  // Handlers for Places
  const handleApprovePlace = async (placeId: number) => {
    const place = placesList.find((item) => item.id === placeId);
    if (!place) return;
    await adminService.updatePlaceStatus(placeId, "active");
    setPlacesList((prev) =>
      prev.map((p) => {
        if (p.id === placeId) {
          addAuditLog("Duyệt địa điểm phát hành", p.name, "Địa điểm đã được công khai trên hệ thống", "approve");
          showToast(`Đã duyệt địa điểm "${p.name}".`);
          return { ...p, status: "Đã duyệt", statusNum: 1 };
        }
        return p;
      })
    );
  };

  const handleTogglePlaceStatus = async (placeId: number) => {
    const place = placesList.find((item) => item.id === placeId);
    if (!place) return;
    const nextStatus = place.statusNum === 3 ? "active" : "suspended";
    await adminService.updatePlaceStatus(placeId, nextStatus);
    setPlacesList((prev) =>
      prev.map((p) => {
        if (p.id === placeId) {
          const isHidden = p.statusNum === 3;
          const nextStatusNum = isHidden ? 1 : 3;
          const nextStatusStr = isHidden ? "Đã duyệt" : "Đang ẩn";
          addAuditLog(
            isHidden ? "Khôi phục hiển thị địa điểm" : "Tạm ẩn địa điểm",
            p.name,
            isHidden ? "Khôi phục hiển thị trên trang khách" : "Tạm ẩn khỏi trang khách",
            "hide"
          );
          showToast(`Đã ${isHidden ? "hiện lại" : "tạm ẩn"} địa điểm "${p.name}".`);
          return { ...p, status: nextStatusStr, statusNum: nextStatusNum };
        }
        return p;
      })
    );
  };

  const handleUpdatePlace = async (updatedPlace: any) => {
    await adminService.updatePlace(updatedPlace.id, {
      name: updatedPlace.name,
      desc: updatedPlace.desc,
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
      description: updatedPlace.description || updatedPlace.desc,
      primaryImageUrl: updatedPlace.coverImg || updatedPlace.img,
      phone: updatedPlace.phone,
      website: updatedPlace.website,
      photos: updatedPlace.images || updatedPlace.photos || updatedPlace.mediaUrls,
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

  // Handle Add Place Submit
  const handleAddPlaceSubmit = async () => {
    if (!newPlaceForm.name || !newPlaceForm.location) {
      alert("Vui lòng điền đầy đủ tên và địa chỉ địa điểm.");
      return;
    }

    const response = await adminService.createPlace({
      name: newPlaceForm.name,
      desc: newPlaceForm.desc,
      coverImg: newPlaceForm.img,
      address: newPlaceForm.location,
      provinceId: Number(newPlaceForm.province) || undefined,
      categoryId: Number(newPlaceForm.category) || undefined,
      openingHours: newPlaceForm.hours,
    });
    const newPlace = { id: response.data, ...newPlaceForm, statusNum: 1, status: "Đã duyệt" };

    setPlacesList((prev) => [newPlace, ...prev]);
    addAuditLog("Tạo địa điểm mới", newPlace.name, "Địa điểm được số hóa bởi Quản trị viên", "create");
    showToast(`Đã tạo địa điểm "${newPlace.name}" thành công.`);
    setIsAddPlaceModalOpen(false);
  };

  // Drawer Open Trigger
  const handleOpenModerationDrawer = (groupKey: string, specificReportId?: number) => {
    setActiveReportGroupKey(groupKey);
    if (specificReportId) {
      setSelectedReportIdInDrawer(specificReportId);
    } else {
      setSelectedReportIdInDrawer(null);
    }
  };

  // Grouped active report calculation for drawer
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
          targetContent: first.targetContent,
          targetRating: first.targetRating,
          province: first.province,
          category: first.category,
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

  // Drawer Confirm Resolution
  const handleConfirmDrawerResolution = async () => {
    if (!activeReportGroup) return;

    const newStatus = drawerDecisionTab === "accept" ? 1 : 2;
    const actionName = drawerDecisionTab === "accept" ? "Chấp thuận & Xử lý vi phạm" : "Bác bỏ phản ánh";
    const selectedId = selectedReportIdInDrawer || activeReportGroup.reportsList[0].id;
    await adminService.resolveReport(selectedId, {
      action: drawerDecisionTab === "accept" ? drawerActionTaken || "hide_content" : "dismiss",
      adminNotes: drawerDecisionTab === "accept" ? drawerResolutionNote : drawerDismissReason,
      targetType: activeReportGroup.targetType,
      targetId: activeReportGroup.targetId,
    });

    setReports((prev) =>
      prev.map((r) => {
        if (
          drawerAutoCloseDuplicates
            ? r.targetType === activeReportGroup.targetType && r.targetId === activeReportGroup.targetId
            : r.id === (selectedReportIdInDrawer || activeReportGroup.reportsList[0].id)
        ) {
          return {
            ...r,
            status: newStatus,
            resolutionAction: drawerActionTaken,
            resolutionNote: drawerResolutionNote,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          mainTab={mainTab}
          setMainTab={setMainTab}
          setSelectedPlaceId={setSelectedPlaceId}
          pendingPlacesCount={placesList.filter((p) => p.statusNum === 0).length}
          pendingProposalsCount={proposals.filter((p) => p.status === 0).length}
          reportedReviewsCount={reviewsList.filter((r) => r.reportCount > 0).length}
          pendingReportsCount={reports.filter((r) => r.status === 0).length}
          placeReportsCount={reports.filter((r) => r.status === 0 && r.targetType === "place").length}
          reviewReportsCount={reports.filter((r) => r.status === 0 && r.targetType === "review").length}
          commentReportsCount={reports.filter((r) => r.status === 0 && r.targetType === "comment").length}
          blogReportsCount={reports.filter((r) => r.status === 0 && r.targetType === "blog").length}
          reportTargetTypeFilter={reportTargetTypeFilter}
          setReportTargetTypeFilter={setReportTargetTypeFilter}
          foodsCount={foodsList.length}
          blogsCount={blogsList.length}
          auditLogsCount={auditLogs.length}
          onBackToUserView={() => navigate("/")}
        />

        {/* Main Workspace Area */}
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
                  setIsAddPlaceModalOpen={setIsAddPlaceModalOpen}
                  showToast={showToast}
                />
              )}

              {mainTab === "places" && (
                <PlacesTab
                  placesList={placesList}
                  selectedPlaceId={selectedPlaceId}
                  setSelectedPlaceId={setSelectedPlaceId}
                  placeSearchText={placeSearchText}
                  setPlaceSearchText={setPlaceSearchText}
                  placeFilterProvince={placeFilterProvince}
                  setPlaceFilterProvince={setPlaceFilterProvince}
                  placeFilterStatus={placeFilterStatus}
                  setPlaceFilterStatus={setPlaceFilterStatus}
                  setIsAddPlaceModalOpen={setIsAddPlaceModalOpen}
                  handleApprovePlace={handleApprovePlace}
                  handleTogglePlaceStatus={handleTogglePlaceStatus}
                  handleUpdatePlace={handleUpdatePlace}
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
                />
              )}

              {mainTab === "reports" && (
                <ReportsTab
                  reports={reports}
                  reportSubTab={reportSubTab}
                  setReportSubTab={setReportSubTab}
                  reportTargetTypeFilter={reportTargetTypeFilter}
                  setReportTargetTypeFilter={setReportTargetTypeFilter}
                  reportPriorityFilter={reportPriorityFilter}
                  setReportPriorityFilter={setReportPriorityFilter}
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
                />
              )}

              {mainTab === "foods" && (
                <FoodsTab
                  foodsList={foodsList}
                  setFoodsList={setFoodsList}
                  addAuditLog={addAuditLog}
                  showToast={showToast}
                />
              )}
              {mainTab === "collections" && <CollectionsTab />}
              {mainTab === "provinces" && <ProvincesTab />}
              {mainTab === "blogs" && (
                <BlogsTab
                  blogsList={blogsList}
                  setBlogsList={setBlogsList}
                  addAuditLog={addAuditLog}
                  showToast={showToast}
                />
              )}
              {mainTab === "categories" && <CategoriesTab />}
              {mainTab === "notifications_profile" && (
                <NotificationsProfileTab
                  currentAdminInfo={currentAdminInfo}
                />
              )}
              {mainTab === "audit_logs" && <AuditLogsTab auditLogs={auditLogs} />}
            </div>
          </main>
        </div>
      </div>

      {/* Moderation Action Drawer */}
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

      {/* Add Place Modal */}
      <AddPlaceModal
        isOpen={isAddPlaceModalOpen}
        onClose={() => setIsAddPlaceModalOpen(false)}
        form={newPlaceForm}
        setForm={setNewPlaceForm}
        onSubmit={handleAddPlaceSubmit}
      />
    </div>
  );
};

export default AdminPage;
