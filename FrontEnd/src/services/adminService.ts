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

export const adminService = {
  getMetrics: () => get<AdminMetrics>("/api/admin/dashboard/metrics"),
  getPlaces: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/places", params),
  getPlace: (id: number) => get<Record<string, unknown>>(`/api/admin/places/${id}`),
  createPlace: (data: unknown) => write<number>("post", "/api/admin/places", data),
  updatePlace: (id: number, data: unknown) => write<boolean>("put", `/api/admin/places/${id}`, data),
  updatePlaceStatus: (id: number, status: string) =>
    write<boolean>("patch", `/api/admin/places/${id}/status`, { status }),
  deletePlace: (id: number) => write<boolean>("delete", `/api/admin/places/${id}`),

  getProposals: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/proposals", params),
  getProposal: (id: number) => get<Record<string, unknown>>(`/api/admin/proposals/${id}`),
  approveProposal: (id: number, adminNotes?: string) =>
    write<boolean>("post", `/api/admin/proposals/${id}/approve`, { adminNotes }),
  rejectProposal: (id: number, rejectionReason: string) =>
    write<boolean>("post", `/api/admin/proposals/${id}/reject`, { rejectionReason }),

  getReports: (params: Record<string, unknown>) => get<AdminPage<Record<string, unknown>>>("/api/admin/reports", params),
  getGroupedReports: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>("/api/admin/reports/grouped", params),
  resolveReport: (id: number, data: unknown) =>
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
  updateFood: (id: number, data: unknown) => write<boolean>("put", `/api/admin/foods/${id}`, data),
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
  getCollections: () => get<unknown[]>("/api/admin/collections"),
};

export default adminService;
