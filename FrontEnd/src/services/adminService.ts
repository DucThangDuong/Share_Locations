import apiClient from "./apiClient";
import type { ApiSuccessResponse } from "@/types/responses/common.response";

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const extractList = <T = any>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data?.items)) return data.data.items;
  if (Array.isArray(data.places)) return data.places;
  return [];
};

export interface AdminMetrics {
  summary: {
    totalPlaces: number;
    newProposalsPending: number;
    unresolvedReports: number;
    urgentSlaBreached: number;
    totalReviews: number;
    reportedReviews: number;
    totalFoods: number;
    totalBlogs: number;
  };
  provinceCompleteness?: unknown[];
  trends?: unknown[];
}

export interface AdminTrendPoint {
  label?: string;
  timestamp?: string;
  reviewsCount?: number;
  reviews?: number;
  reportsCount?: number;
  reports?: number;
}

export interface AdminDashboardTrendsResponse {
  timeRange?: string;
  points?: AdminTrendPoint[];
}

export interface AdminSlaPerformanceDto {
  proposalsApprovalRate?: {
    approved: number;
    total: number;
    percentage: number;
    pendingInspection: number;
  };
  reportsResolutionSla?: {
    resolvedWithinSla: number;
    totalReports: number;
    percentage: number;
    openUnder24h: number;
  };
  placesDataQualityRate?: {
    qualifiedPlaces: number;
    totalPlaces: number;
    percentage: number;
    missingInfoSummary?: string;
  };
}

export interface AdminPriorityQueueItemDto {
  id: string | number;
  targetName?: string;
  type: "proposals" | "reports" | "reviews" | string;
  category?: string;
  isUrgent?: boolean;
  title: string;
  desc?: string;
  description?: string;
  location?: string;
  locationName?: string;
  timeAgo?: string;
  createdAt?: string;
  badge?: string;
  badgeLabel?: string;
  badgeColor?: string;
  actionText?: string;
  targetId?: string | number;
}

export interface AdminContributorsSummaryDto {
  newContributorsCount?: number;
  growthComparisonText?: string;
  topActiveProvinces?: Array<{
    provinceName?: string;
    name?: string;
    activityPercentage?: number;
    percentage?: number;
    count?: number;
  }>;
}

const get = async <T>(url: string, params?: Record<string, unknown>) => {
  const response = await apiClient.get<ApiSuccessResponse<T>>(url, { params });
  return response.data;
};

const write = async <T>(
  method: "post" | "put" | "patch" | "delete",
  url: string,
  data?: unknown,
) => {
  const response = await apiClient.request<ApiSuccessResponse<T>>({ method, url, data });
  return response.data;
};

export interface AdminCollectionSummary {
  id: number;
  provinceId: number | null;
  provinceName: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isFeatured: boolean;
  displayOrder: number;
  status: number;
  placeCount: number;
}

export interface AdminCollectionPlaceDetail {
  id: number;
  name: string;
  description?: string | null;
  categoryName: string | null;
  provinceName: string | null;
  address: string | null;
  avgRating: number;
  reviewCount: number;
  displayOrder: number;
  coverUrl: string | null;
  isActive?: boolean;
}

export interface CollectionPlaceInputDto {
  placeId: number;
  displayOrder: number;
}

export interface UpdateCollectionPlacesRequest {
  collectionId: number;
  title?: string | null;
  description?: string | null;
  provinceId?: number | null;
  places: CollectionPlaceInputDto[];
  replaceExisting: boolean;
}

export interface UpdateAdminCollectionStatusRequest {
  id: number;
  status?: number | null;
  reason?: string | null;
}

export interface AdminCommentItemDto {
  id: number;
  blogId?: number | null;
  blogTitle?: string | null;
  reviewId?: number | null;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  content: string;
  createdAt: string;
  status: string;
  reportCount: number;
}

export interface GetAdminCommentsRequest {
  hasReportsOnly?: boolean;
  status?: string;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
  reviewId?: number;
}

export interface GetAdminReportsRequest {
  subTab?: string;
  targetType?: string;
  status?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface ResolveAdminReportRequest {
  id?: number;
  targetType: string;
  decision: "accept" | "dismiss" | string;
  actionTaken?: string | null;
  resolutionNote?: string | null;
}

export interface CreateCollectionRequest {
  title: string;
  name?: string;
  description?: string | null;
  provinceId?: number | null;
  displayOrder?: number;
  isFeatured?: boolean;
  featured?: boolean;
  status?: number;
  coverUrl?: string | null;
  places?: CollectionPlaceInputDto[];
  placeIds?: number[];
}

export const adminService = {
  getMetrics: () => get<AdminMetrics>("/api/admin/dashboard/metrics"),
  getDashboardTrends: (params?: { timeRange?: string; region?: string }) =>
    get<AdminDashboardTrendsResponse | AdminTrendPoint[]>("/api/admin/dashboard/trends", params as Record<string, unknown>),
  getDashboardSlaPerformance: () =>
    get<AdminSlaPerformanceDto>("/api/admin/dashboard/sla-performance"),
  getDashboardPriorityQueue: (params?: { filter?: string; limit?: number }) =>
    get<AdminPriorityQueueItemDto[] | { items: AdminPriorityQueueItemDto[] }>("/api/admin/dashboard/priority-queue", params as Record<string, unknown>),
  getDashboardContributorsSummary: () =>
    get<AdminContributorsSummaryDto>("/api/admin/dashboard/contributors-summary"),
  getPlaces: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/places", params),
  getPlace: (id: number) => get<Record<string, unknown>>(`/api/admin/places/${id}`),
  createPlace: async (data: unknown) => {
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      return write<number>("post", "/api/admin/places", data);
    }
    try {
      const res = await apiClient.post<ApiSuccessResponse<number>>("/api/admin/places", data, {
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 415 && typeof data === "object" && data !== null) {
        const fd = new FormData();
        Object.entries(data as Record<string, any>).forEach(([key, val]) => {
          if (val === undefined || val === null) return;
          if (Array.isArray(val)) {
            val.forEach((item) => {
              if (item !== undefined && item !== null) {
                const isFile = item instanceof File || item instanceof Blob;
                const formKey = isFile && (key === "photos" || key === "images") ? "mediaFiles" : key;
                fd.append(formKey, isFile ? item : String(item));
              }
            });
          } else if (val instanceof File || val instanceof Blob) {
            const formKey = key === "primaryImageUrl" || key === "coverImg" ? "coverImage" : key;
            fd.append(formKey, val);
          } else {
            fd.append(key, String(val));
          }
        });
        return write<number>("post", "/api/admin/places", fd);
      }
      throw err;
    }
  },
  updatePlace: (id: number, data: unknown) => write<boolean>("put", `/api/admin/places/${id}`, data),
  updatePlaceStatus: (id: number, status: string | number) => {
    const isOne = status === 1 || status === "1" || String(status).toLowerCase() === "active" || String(status).toLowerCase() === "approved";
    const statusVal = isOne ? 1 : 0;
    return write<boolean>("patch", `/api/admin/places/${id}/status`, {
      status: statusVal,
      statusNum: statusVal,
      statusName: isOne ? "Active" : "Inactive",
      isActive: isOne
    });
  },
  uploadPlaceCoverImage: async (placeId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("coverImage", file);
    formData.append("image", file);

    const res = await apiClient.post<any>(
      `/api/admin/places/${placeId}/cover-image`,
      formData
    );
    const body = res.data;
    if (typeof body === "string") return body;
    const data = body?.data ?? body;
    if (typeof data === "string") return data;
    return data?.coverImageUrl || data?.url || data?.imageUrl || data?.coverImage || "";
  },

  uploadPlaceMedia: async (placeId: number, files: File[]): Promise<any[]> => {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await apiClient.post<any>(
      `/api/admin/places/${placeId}/media`,
      formData
    );
    const body = res.data;
    const data = body?.data ?? body;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.media)) return data.media;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  deletePlaceMedia: async (placeId: number, mediaId: number): Promise<boolean> => {
    const res = await apiClient.delete<ApiSuccessResponse<boolean>>(
      `/api/admin/places/${placeId}/media/${mediaId}`
    );
    return Boolean(res.data?.data ?? true);
  },

  uploadPlaceImages: async (files: File[], placeId?: number): Promise<string[]> => {
    if (!files || files.length === 0) return [];

    if (placeId) {
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const res = await apiClient.post<ApiSuccessResponse<any[]>>(
          `/api/admin/places/${placeId}/media`,
          formData
        );
        const data = res.data?.data;
        if (Array.isArray(data)) {
          return data.map((item: any) => (typeof item === "string" ? item : item.url || item.imageUrl || "")).filter(Boolean);
        }
      } catch {
      }
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
      formData.append("photos", file);
      formData.append("images", file);
    });

    try {
      const res = await apiClient.post<ApiSuccessResponse<string[] | { urls: string[] }>>(
        "/api/admin/places/upload-images",
        formData
      );
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray((data as any).urls)) return (data as any).urls;
    } catch {
      try {
        const res = await apiClient.post<ApiSuccessResponse<string[] | { urls: string[] }>>(
          "/api/media/upload",
          formData
        );
        const data = res.data?.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray((data as any).urls)) return (data as any).urls;
      } catch {
        return Promise.all(
          files.map(
            (f) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(f);
              })
          )
        );
      }
    }
    return [];
  },
  deletePlace: (id: number) => write<boolean>("delete", `/api/admin/places/${id}`),

  getProposals: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/proposals", params),
  getProposal: (id: number) => get<Record<string, unknown>>(`/api/admin/proposals/${id}`),
  approveProposal: (id: number, adminNotes?: string) =>
    write<boolean>("post", `/api/admin/proposals/${id}/approve`, { adminNotes }),
  rejectProposal: (id: number, rejectionReason: string) =>
    write<boolean>("post", `/api/admin/proposals/${id}/reject`, { rejectionReason }),

  getReports: (params?: Record<string, unknown> | GetAdminReportsRequest) => {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if ((params as any).subTab && (params as any).subTab !== "all") {
        cleanParams.subTab = (params as any).subTab;
      }
      if ((params as any).targetType && (params as any).targetType !== "all") {
        cleanParams.targetType = (params as any).targetType;
      }
      if ((params as any).status !== undefined) {
        cleanParams.status = (params as any).status;
      }
      if ((params as any).keyword) {
        cleanParams.keyword = (params as any).keyword;
      }
      if ((params as any).sortBy) {
        cleanParams.sortBy = (params as any).sortBy;
      }
      if ((params as any).sortOrder) {
        cleanParams.sortOrder = (params as any).sortOrder;
      }
      cleanParams.page = (params as any).page || 1;
      cleanParams.pageSize = (params as any).pageSize || 20;
    }
    return get<AdminPage<Record<string, unknown>>>("/api/admin/reports", cleanParams);
  },
  getGroupedReports: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>("/api/admin/reports/grouped", params),
  resolveReport: (id: number, data: ResolveAdminReportRequest | unknown) =>
    write<boolean>("post", `/api/admin/reports/${id}/resolve`, data),

  getReviews: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/reviews", params),
  updateReviewStatus: (id: number, status: string) =>
    write<boolean>("patch", `/api/admin/reviews/${id}/status`, { status }),
  deleteReview: (id: number) => write<boolean>("delete", `/api/admin/reviews/${id}`),
  getComments: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/comments", params),
  updateCommentStatus: (id: number, status: string) =>
    write<boolean>("patch", `/api/admin/comments/${id}/status`, { status }),
  deleteComment: (id: number) => write<boolean>("delete", `/api/admin/comments/${id}`),

  getFoods: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/foods", params),
  createFood: (data: unknown) => write<number>("post", "/api/admin/foods", data),
  updateFood: async (id: number, data: unknown) => {
    try {
      return await write<{ id: number; coverImg?: string; success?: boolean } | boolean>(
        "put",
        `/api/admin/foods/${id}`,
        data
      );
    } catch (err: any) {
      if (err?.response?.status === 405) {
        try {
          return await write<{ id: number; coverImg?: string; success?: boolean } | boolean>(
            "patch",
            `/api/admin/foods/${id}`,
            data
          );
        } catch {
          return await write<{ id: number; coverImg?: string; success?: boolean } | boolean>(
            "post",
            `/api/admin/foods/${id}`,
            data
          );
        }
      }
      throw err;
    }
  },
  updateFoodStatus: (id: number, status: string) =>
    write<boolean>("patch", `/api/admin/foods/${id}/status`, { status }),
  deleteFood: (id: number) => write<boolean>("delete", `/api/admin/foods/${id}`),

  getBlogs: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/blogs", params),
  getBlog: (id: number) => get<Record<string, unknown>>(`/api/admin/blogs/${id}`),
  createBlog: (data: unknown) => write<number>("post", "/api/admin/blogs", data),
  updateBlog: (id: number, data: unknown) => write<boolean>("put", `/api/admin/blogs/${id}`, data),
  updateBlogStatus: (id: number, status: string) =>
    write<boolean>("patch", `/api/admin/blogs/${id}/status`, { status }),
  deleteBlog: (id: number) => write<boolean>("delete", `/api/admin/blogs/${id}`),

  getCompleteness: () => get<unknown[]>("/api/admin/provinces/completeness"),
  getCategories: () => get<unknown[]>("/api/admin/categories"),
  getCollections: () => get<AdminCollectionSummary[]>("/api/admin/collections"),
  getCollectionPlaces: (collectionId: number) =>
    get<AdminCollectionPlaceDetail[]>(`/api/admin/collections/${collectionId}/places`),
  updateCollectionPlaces: (
    collectionId: number,
    data: UpdateCollectionPlacesRequest
  ) => write<unknown>("put", `/api/admin/collections/${Number(collectionId)}/places`, data),
  createCollection: (data: CreateCollectionRequest | unknown) =>
    write<unknown>("post", "/api/admin/collections", data),
  updateCollection: (id: number, data: unknown) => write<unknown>("put", `/api/admin/collections/${id}`, data),
  deleteCollection: (id: number) => write<unknown>("delete", `/api/admin/collections/${id}`),
  updateCollectionStatus: (id: number, status?: number | null, reason?: string | null) =>
    write<unknown>("patch", `/api/admin/collections/${id}/status`, { id, status, reason }),

  getUsers: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>("/api/admin/users", params),
  getUserDetail: (userId: number) =>
    get<Record<string, unknown>>(`/api/admin/users/${userId}`),
  updateUserRole: (
    userId: number,
    data: {
      role: string;
      categoryIds?: number[];
      provinceIds?: number[];
      regionIds?: number[];
      reason?: string;
    }
  ) => write<any>("put", `/api/admin/users/${userId}/role`, data),
  updateUserScopes: (userId: number, data: unknown) =>
    write<unknown>("put", `/api/admin/users/${userId}/scopes`, data),
  updateUserStatus: (userId: number, status: string | number, reason?: string) =>
    write<boolean>("patch", `/api/admin/users/${userId}/status`, { status: String(status), reason }),
  getUserActivities: (userId: number) =>
    get<Record<string, unknown>>(`/api/admin/users/${userId}/activities`),
  getUserAccessHistory: (userId: number) =>
    get<Record<string, unknown>[]>("/api/admin/users/" + userId + "/access-history"),

  getAuditLogs: (params?: Record<string, unknown>) =>
    get<any>("/api/admin/audit-logs", params),
  getAuditLogDetail: (id: number) =>
    get<any>(`/api/admin/audit-logs/${id}`),

  getGeographyRegions: (params?: { activeOnly?: boolean }) =>
    get<import("@/types/admin.types").AdminGeographyRegionItem[]>("/api/admin/geography/regions", params as Record<string, unknown>),
  createGeographyRegion: (data: FormData | Partial<import("@/types/admin.types").AdminGeographyRegionItem>) =>
    write<number>("post", "/api/admin/geography/regions", data),
  updateGeographyRegion: (id: number, data: FormData | Partial<import("@/types/admin.types").AdminGeographyRegionItem>) =>
    write<boolean>("put", `/api/admin/geography/regions/${id}`, data),
  updateGeographyRegionStatus: (id: number, status: number, reason?: string) =>
    write<boolean>("put", `/api/admin/geography/regions/${id}/status`, { status, reason }),

  getGeographyProvinces: (params?: {
    regionId?: number;
    status?: number;
    featured?: boolean;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) =>
    get<import("@/types/admin.types").AdminGeographyProvinceItem[] | AdminPage<import("@/types/admin.types").AdminGeographyProvinceItem>>(
      "/api/admin/geography/provinces",
      params as Record<string, unknown>
    ),
  getGeographyProvince: (id: number) =>
    get<import("@/types/admin.types").AdminGeographyProvinceItem>(`/api/admin/geography/provinces/${id}`),
  createGeographyProvince: (data: FormData | Partial<import("@/types/admin.types").AdminGeographyProvinceItem>) =>
    write<number>("post", "/api/admin/geography/provinces", data),
  updateGeographyProvince: (id: number, data: FormData | Partial<import("@/types/admin.types").AdminGeographyProvinceItem>) =>
    write<boolean>("put", `/api/admin/geography/provinces/${id}`, data),
  updateGeographyProvinceStatus: (id: number, status: number, reason?: string) =>
    write<boolean>("put", `/api/admin/geography/provinces/${id}/status`, { status, reason }),

  getCatalogPlaceTypes: (params?: { activeOnly?: boolean }) =>
    get<import("@/types/admin.types").AdminCatalogPlaceTypeItem[]>(
      "/api/admin/catalog/place-types",
      params as Record<string, unknown>
    ),
  createCatalogPlaceType: (data: FormData | Partial<import("@/types/admin.types").AdminCatalogPlaceTypeItem>) =>
    write<number>("post", "/api/admin/catalog/place-types", data),
  updateCatalogPlaceType: (id: number, data: FormData | Partial<import("@/types/admin.types").AdminCatalogPlaceTypeItem>) =>
    write<boolean>("post", `/api/admin/catalog/place-types/${id}`, data),
  updateCatalogPlaceTypeStatus: (id: number, status: number, reason?: string) =>
    write<boolean>("put", `/api/admin/catalog/place-types/${id}/status`, { status, reason }),

  getCatalogCategories: (params?: {
    placeTypeId?: number;
    status?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) =>
    get<import("@/types/admin.types").AdminCatalogCategoryItem[] | AdminPage<import("@/types/admin.types").AdminCatalogCategoryItem>>(
      "/api/admin/catalog/categories",
      params as Record<string, unknown>
    ),
  getCatalogCategory: (id: number) =>
    get<import("@/types/admin.types").AdminCatalogCategoryItem>(`/api/admin/catalog/categories/${id}`),
  createCatalogCategory: (data: FormData | Partial<import("@/types/admin.types").AdminCatalogCategoryItem>) =>
    write<number>("post", "/api/admin/catalog/categories", data),
  updateCatalogCategory: (id: number, data: FormData | Partial<import("@/types/admin.types").AdminCatalogCategoryItem>) =>
    write<boolean>("post", `/api/admin/catalog/categories/${id}`, data),
  updateCatalogCategoryStatus: (id: number, status: number, reason?: string) =>
    write<boolean>("put", `/api/admin/catalog/categories/${id}/status`, { status, reason }),

  getReportTypes: (params?: { targetScope?: string; activeOnly?: boolean }) =>
    get<import("@/types/admin.types").AdminReportTypeItem[]>("/api/admin/settings/report-types", params as Record<string, unknown>),
  createReportType: (data: Partial<import("@/types/admin.types").AdminReportTypeItem>) =>
    write<number>("post", "/api/admin/settings/report-types", data),
  updateReportType: (id: number, data: Partial<import("@/types/admin.types").AdminReportTypeItem>) =>
    write<boolean>("put", `/api/admin/settings/report-types/${id}`, data),
  updateReportTypeStatus: (id: number, isActive: boolean) =>
    write<boolean>("put", `/api/admin/settings/report-types/${id}/status`, { isActive }),
  deleteReportType: (id: number) =>
    write<boolean>("delete", `/api/admin/settings/report-types/${id}`),

  getSystemSettings: (params?: { group?: string }) =>
    get<import("@/types/admin.types").AdminSystemSettingItem[]>("/api/admin/settings/system-settings", params as Record<string, unknown>),
  updateSystemSetting: (key: string, data: { settingValue: string; description?: string }) =>
    write<boolean>("put", `/api/admin/settings/system-settings/${encodeURIComponent(key)}`, data),
  batchUpdateSystemSettings: (settings: Record<string, string>) =>
    write<number>("put", "/api/admin/settings/system-settings/batch", { settings }),
};

export default adminService;

