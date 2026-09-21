import { apiClient } from "./apiClient";

export interface CreateReportDto {
  targetType: "place" | "review" | "comment" | "blog" | "photo";
  targetId?: number;
  placeId?: number;
  reviewId?: number;
  commentId?: number;
  blogId?: number;
  reason: string;
  reasonId?: number;
  description: string;
  evidenceUrl?: string;
  contactEmail?: string;
}

export interface ReportItemResponse {
  id: number;
  codeId: string;
  targetType: string;
  targetId: number;
  reason: string;
  description: string;
  status: number; // 0: Pending, 1: Resolved, 2: Dismissed
  createdAt: string;
}

class ReportService {
  async getReasons() {
    const response = await apiClient.get("/api/reports/reasons");
    return response.data;
  }
  /**
   * Submit a new report for any target entity (place, review, comment, blog, photo)
   */
  async submitReport(data: CreateReportDto) {
    const typeFormatted = data.targetType.charAt(0).toUpperCase() + data.targetType.slice(1).toLowerCase();
    const payload = {
      targetType: typeFormatted === "Photo" ? "Place" : typeFormatted,
      targetId: data.targetId || data.placeId || data.reviewId || data.commentId || data.blogId || 0,
      reason: data.reason,
      notes: data.description || "",
    };
    const response = await apiClient.post("/api/reports", payload);
    return response.data;
  }

  /**
   * Get user's submitted reports history
   */
  async getMyReports() {
    const response = await apiClient.get("/api/reports/my-reports");
    return response.data;
  }

  /**
   * Admin: Fetch all reports with filters
   */
  async getAdminReports(params?: {
    targetType?: string;
    status?: number;
    priority?: string;
    page?: number;
    pageSize?: number;
  }) {
    const response = await apiClient.get("/api/admin/reports", { params });
    return response.data;
  }

  /**
   * Admin: Resolve or dismiss report
   */
  async resolveReport(reportId: number, data: {
    decision: "accept" | "dismiss";
    actionTaken?: string;
    resolutionNote?: string;
    dismissReason?: string;
  }) {
    const response = await apiClient.post(`/api/admin/reports/${reportId}/resolve`, {
      action: data.decision === "dismiss" ? "dismiss" : data.actionTaken || "hide_content",
      adminNotes: data.resolutionNote || data.dismissReason,
    });
    return response.data;
  }
}

export const reportService = new ReportService();
export default reportService;
