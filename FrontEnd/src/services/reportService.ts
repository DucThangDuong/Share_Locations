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
  status: number;
  createdAt: string;
}

class ReportService {
  async getReasons(targetType?: string) {
    try {
      const response = await apiClient.get("/api/reports/reasons", {
        params: targetType ? { targetType } : undefined,
      });
      return response.data;
    } catch {
      return { data: [] };
    }
  }
  async submitReport(data: CreateReportDto) {
    const rawTargetType = String(data.targetType || "place").toLowerCase();
    const rawTargetId = data.targetId || data.blogId || data.placeId || data.reviewId || data.commentId || 0;
    const targetNumId = Number(rawTargetId);
    const reasonNumId = Number(data.reasonId) || (rawTargetType === "blog" ? 5 : 1);
    const descText = data.description?.trim() || "";

    const payload = {
      targetType: rawTargetType,
      targetId: targetNumId,
      reasonId: reasonNumId,
      description: descText,
    };

    try {
      const response = await apiClient.post("/api/reports", payload);
      return response.data;
    } catch (err: any) {
      if (rawTargetType === "blog" && targetNumId > 0) {
        try {
          const fallbackRes = await apiClient.post(`/api/blogs/${targetNumId}/reports`, {
            reasonId: reasonNumId,
            reason: data.reason,
            reasonCode: data.reasonCode || data.reason,
            description: descText,
            contactEmail: data.contactEmail,
          });
          return fallbackRes.data;
        } catch {
        }
      }
      if (rawTargetType === "place" && targetNumId > 0) {
        try {
          const fallbackRes = await apiClient.post(`/api/places/${targetNumId}/reports`, {
            reasonId: reasonNumId,
            reason: data.reason,
            description: descText,
            contactEmail: data.contactEmail,
          });
          return fallbackRes.data;
        } catch {
        }
      }
      throw err;
    }
  }
  async getMyReports() {
    try {
      const response = await apiClient.get("/api/reports/my-reports");
      return response.data;
    } catch {
      return { data: { items: [] } };
    }
  }

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
