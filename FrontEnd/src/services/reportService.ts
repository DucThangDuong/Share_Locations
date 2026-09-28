import { apiClient } from "./apiClient";

export interface CreateReportDto {
  targetType: "place" | "review" | "comment" | "blog" | "photo" | "user";
  targetId?: number;
  placeId?: number;
  reviewId?: number;
  commentId?: number;
  blogId?: number;
  reason: string;
  reasonCode?: string;
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
    try {
      const response = await apiClient.get("/api/reports/reasons");
      return response.data;
    } catch {
      return { data: [] };
    }
  }

  /**
   * Submit a new report for any target entity (place, review, comment, blog, photo, user)
   */
  async submitReport(data: CreateReportDto) {
    const rawTargetType = String(data.targetType || "place").toLowerCase();
    const typeFormatted = rawTargetType.charAt(0).toUpperCase() + rawTargetType.slice(1);
    const rawTargetId = data.targetId || data.placeId || data.reviewId || data.commentId || data.blogId || 0;
    const targetNumId = Number(rawTargetId);

    const targetTypeMap: Record<string, number> = {
      place: 1,
      review: 2,
      comment: 3,
      blog: 4,
      photo: 5,
      user: 6,
    };
    const targetTypeId = targetTypeMap[rawTargetType] || 1;

    const payload = {
      targetType: typeFormatted === "Photo" ? "Place" : typeFormatted,
      targetTypeId,
      targetId: targetNumId,
      placeId: data.placeId || (rawTargetType === "place" ? targetNumId : undefined),
      reviewId: data.reviewId || (rawTargetType === "review" ? targetNumId : undefined),
      commentId: data.commentId || (rawTargetType === "comment" ? targetNumId : undefined),
      blogId: data.blogId || (rawTargetType === "blog" ? targetNumId : undefined),
      reason: data.reason,
      reasonCode: data.reasonCode || data.reason,
      description: data.description || "",
      notes: data.description || "",
      content: data.description || "",
      evidenceUrl: data.evidenceUrl || undefined,
      contactEmail: data.contactEmail || undefined,
    };

    try {
      const response = await apiClient.post("/api/reports", payload);
      return response.data;
    } catch (err: any) {
      // Fallback for place endpoint if generic /api/reports 404s
      if (rawTargetType === "place" && targetNumId > 0) {
        try {
          const fallbackRes = await apiClient.post(`/api/places/${targetNumId}/reports`, {
            reason: data.reason,
            description: data.description,
            contactEmail: data.contactEmail,
          });
          return fallbackRes.data;
        } catch {
          // Re-throw original
        }
      }
      throw err;
    }
  }

  /**
   * Get user's submitted reports history
   */
  async getMyReports() {
    try {
      const response = await apiClient.get("/api/reports/my-reports");
      return response.data;
    } catch {
      return { data: { items: [] } };
    }
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
