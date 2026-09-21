import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Flag,
  MessageSquare,
  MapPin,
  FileText,
  ShieldCheck,
  Send,
  HelpCircle,
} from "lucide-react";
import type { ReportTargetType, ReportTargetInfo } from "@/types/admin.types";
import { reportService } from "@/services/reportService";

export type { ReportTargetType, ReportTargetInfo };

export interface ReportModalProps {
  placeName?: string;
  placeId?: number;
  initialTarget?: ReportTargetInfo;
  isOpen?: boolean;
  onClose: () => void;
  onSubmittedReport?: (newReport: any) => void;
  defaultTab?: "form" | "guide" | "history";
}

interface SubmittedUserReport {
  id: number;
  targetType: ReportTargetType;
  targetTitle: string;
  reasonContent: string;
  description: string;
  submittedAt: string;
  status: "pending" | "resolved";
  result?: "violation_confirmed" | "dismissed";
  resolutionNote?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  placeName,
  placeId,
  initialTarget,
  isOpen = true,
  onClose,
  onSubmittedReport,
  defaultTab = "form",
}) => {
  if (isOpen === false) return null;

  const [modalView, setModalView] = useState<"form" | "guide" | "history">(defaultTab);

  // Determine target information
  const targetInfo: ReportTargetInfo = initialTarget || {
    targetType: "place",
    targetId: placeId,
    targetTitle: placeName || "Địa điểm du lịch / Ẩm thực",
    targetSubtitle: "Cơ sở ẩm thực & du lịch",
  };

  const targetType = targetInfo.targetType;

  // Form State
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<number | null>(null);
  const [myReports, setMyReports] = useState<SubmittedUserReport[]>([]);
  const [reportReasons, setReportReasons] = useState<Array<{ code: string; name: string }>>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    void Promise.all([
      reportService.getReasons(),
      defaultTab === "history" ? reportService.getMyReports() : Promise.resolve(null),
    ]).then(([reasons, history]) => {
      setReportReasons(reasons.data || []);
      if (history?.data?.items) setMyReports(history.data.items);
    }).catch(() => undefined);
  }, [defaultTab]);

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const getModalTitle = () => {
    switch (targetType) {
      case "place":
        return "Báo cáo Quán ăn / Địa điểm";
      case "review":
        return "Báo cáo Đánh giá vi phạm";
      case "comment":
        return "Báo cáo Bình luận vi phạm";
      case "blog":
        return "Báo cáo Bài viết vi phạm";
      default:
        return "Báo cáo Vi phạm";
    }
  };

  const getTargetTypeBadge = () => {
    switch (targetType) {
      case "place":
        return { label: "Quán ăn / Địa điểm", icon: MapPin, bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" };
      case "review":
        return { label: "Thẻ đánh giá", icon: MessageSquare, bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" };
      case "comment":
        return { label: "Bình luận", icon: FileText, bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" };
      case "blog":
        return { label: "Bài viết cẩm nang", icon: FileText, bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" };
      default:
        return { label: "Nội dung", icon: Flag, bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReasonId) return;

    setIsSubmitting(true);
    const chosenReason = reportReasons.find((r) => r.code === selectedReasonId);

    try {
      const response = await reportService.submitReport({
        targetType: targetInfo.targetType,
        targetId: targetInfo.targetId,
        placeId: targetInfo.targetType === "place" ? targetInfo.targetId : undefined,
        reviewId: targetInfo.targetType === "review" ? targetInfo.targetId : undefined,
        commentId: targetInfo.targetType === "comment" ? targetInfo.targetId : undefined,
        blogId: targetInfo.targetType === "blog" ? targetInfo.targetId : undefined,
        reason: chosenReason?.name || "Vi phạm quy định",
        description: description.trim() || "Người dùng gửi báo cáo vi phạm.",
        evidenceUrl: filePreview || undefined,
      });

      const reportId = Number(response?.data || Date.now());
      setSubmittedReportId(reportId);

      const newReportEntry: SubmittedUserReport = {
        id: reportId,
        targetType: targetType,
        targetTitle: targetInfo.targetTitle,
        reasonContent: chosenReason?.name || "Vi phạm quy định",
        description: description.trim() || "Người dùng không để lại mô tả thêm.",
        submittedAt: "Vừa xong",
        status: "pending",
      };

      setMyReports((prev) => [newReportEntry, ...prev]);
      if (onSubmittedReport) {
        onSubmittedReport(newReportEntry);
      }
    } catch {
      setSubmittedReportId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const badgeInfo = getTargetTypeBadge();
  const BadgeIcon = badgeInfo.icon;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <Flag size={18} className="fill-rose-600 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {modalView === "guide"
                  ? "Quy chuẩn báo cáo vi phạm"
                  : modalView === "history"
                  ? "Lịch sử báo cáo của bạn"
                  : getModalTitle()}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-none">
                Gửi phản hồi ẩn danh tới Quản trị viên để kiểm duyệt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modalView !== "form" && (
              <button
                type="button"
                onClick={() => setModalView("form")}
                className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                ← Quay lại
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Success View */}
        {submittedReportId ? (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 size={38} strokeWidth={2.2} />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Đã tiếp nhận báo cáo của bạn
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Mã theo dõi: <strong className="text-emerald-700">#REP-{submittedReportId}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 leading-relaxed max-w-md w-full space-y-1.5">
              <p className="font-semibold text-slate-900">
                • Đối tượng: {targetInfo.targetTitle}
              </p>
              <p className="text-slate-500">
                Cảm ơn bạn đã hỗ trợ cộng đồng du lịch trung thực và văn minh. Đội ngũ điều phối viên sẽ kiểm tra và giải quyết trong vòng 24 giờ.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer mt-2 shadow-xs"
            >
              Đã hiểu &amp; Đóng
            </button>
          </div>
        ) : modalView === "guide" ? (
          /* Guide View */
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 leading-relaxed">
              <strong className="block mb-1 text-blue-900 font-bold">Nguyên tắc tiếp nhận báo cáo</strong>
              Mọi thành viên đều có quyền báo cáo các nội dung vi phạm tiêu chuẩn cộng đồng, bao gồm thông tin sai lệch, đánh giá bôi nhọ hoặc spam phá hoại.
            </div>

            <h5 className="font-bold text-slate-900">
              Các lý do vi phạm phổ biến:
            </h5>
            <div className="space-y-2">
              {reportReasons.map((r) => (
                <div
                  key={r.code}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs"
                >
                  <strong className="text-slate-900">• {r.name}</strong>
                </div>
              ))}
            </div>

            <button
              onClick={() => setModalView("form")}
              className="w-full py-2.5 text-center text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
            >
              Tiến hành gửi báo cáo →
            </button>
          </div>
        ) : modalView === "history" ? (
          /* History View */
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-3">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Báo cáo bạn đã gửi gần đây ({myReports.length})
            </h5>
            <div className="space-y-2.5">
              {myReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[240px]">
                      {rep.targetTitle}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {rep.status === "pending" ? "Đang thẩm định" : "Đã xử lý"}
                    </span>
                  </div>
                  <p className="text-rose-700 font-semibold text-[11px]">
                    Lý do: {rep.reasonContent}
                  </p>
                  <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 text-[11px]">
                    "{rep.description}"
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    Gửi lúc: {rep.submittedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-4">
              {/* Target Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeInfo.bg} ${badgeInfo.text} ${badgeInfo.border}`}
                  >
                    <BadgeIcon size={12} />
                    <span>{badgeInfo.label}</span>
                  </div>

                  {targetInfo.targetRating && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      ★ {targetInfo.targetRating}.0
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {targetInfo.targetTitle}
                  </h4>
                  {targetInfo.targetSubtitle && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {targetInfo.targetSubtitle}
                    </p>
                  )}
                </div>

                {targetInfo.targetContent && (
                  <p className="text-[11px] text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 line-clamp-2">
                    "{targetInfo.targetContent}"
                  </p>
                )}
              </div>

              {/* Reasons Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>Chọn lý do vi phạm</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalView("guide")}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle size={12} />
                    <span>Xem quy chuẩn</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {reportReasons.map((r) => {
                    const isSelected = selectedReasonId === r.code;
                    return (
                      <div
                        key={r.code}
                        onClick={() => setSelectedReasonId(r.code)}
                        className={`flex items-start gap-3 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/60 shadow-2xs"
                            : "border-slate-200 bg-white hover:bg-slate-50/60"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-rose-600 bg-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-rose-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs font-bold leading-tight block ${
                              isSelected ? "text-rose-950" : "text-slate-800"
                            }`}
                          >
                            {r.name}
                          </span>
                          <span
                            className={`text-[11px] block mt-0.5 leading-snug ${
                              isSelected ? "text-rose-800" : "text-slate-500"
                            }`}
                          >
                            {r.code}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    Mô tả chi tiết vi phạm
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {description.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vui lòng cung cấp thêm thông tin hoặc dẫn chứng để Quản trị viên dễ dàng xác minh..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                />
              </div>

              {/* File Attachment */}
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-1.5">
                  Ảnh bằng chứng (tùy chọn)
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {fileName ? (
                  <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                    <span className="flex items-center gap-2 truncate">
                      <UploadCloud size={14} className="text-rose-600 shrink-0" />
                      <span className="truncate">{fileName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileName("");
                        setFilePreview(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-1.5 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-2.5 text-center text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UploadCloud size={15} className="text-slate-400" />
                    <span>Tải lên ảnh chụp màn hình vi phạm</span>
                  </button>
                )}
              </div>

              {/* Anonymous Guarantee */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Báo cáo của bạn được gửi ẩn danh và bảo mật tuyệt đối.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setModalView("history")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Lịch sử ({myReports.length})
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-200/70 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={!selectedReasonId || isSubmitting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs ${
                    selectedReasonId && !isSubmitting
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Send size={13} />
                  <span>{isSubmitting ? "Đang gửi..." : "Gửi Báo Cáo"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};

export default ReportModal;
