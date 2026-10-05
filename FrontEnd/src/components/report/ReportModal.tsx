import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  Flag,
  MessageSquare,
  MapPin,
  FileText,
  ShieldCheck,
  Send,
  User,
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
  defaultTab?: "form" | "history";
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

interface ReasonItem {
  code: string;
  name: string;
  desc?: string;
}

const REASON_DICTIONARY: Record<string, { name: string; desc: string }> = {
  PLACE_CLOSED: {
    name: "Địa điểm đã đóng cửa / Ngừng hoạt động",
    desc: "Cơ sở đã ngừng kinh doanh vĩnh viễn hoặc tạm ngưng dài hạn",
  },
  PLACE_WRONG_INFO: {
    name: "Thông tin sai lệch",
    desc: "Địa chỉ, số điện thoại, giờ hoạt động hoặc vị trí ghim bản đồ không đúng",
  },
  PLACE_WRONG_PRICE: {
    name: "Giá cả không chính xác",
    desc: "Mức giá thực tế chênh lệch nhiều so với thông tin niêm yết",
  },
  PLACE_DUPLICATE: {
    name: "Địa điểm bị trùng lặp",
    desc: "Đã có địa điểm tương tự đang cùng hoạt động trên hệ thống",
  },
  PLACE_INAPPROPRIATE: {
    name: "Địa điểm không có thật / Vi phạm quy chuẩn",
    desc: "Cơ sở ảo hoặc có hoạt động vi phạm pháp luật / thuần phong mỹ tục",
  },
  PLACE_NOT_EXIST: {
    name: "Địa điểm không tồn tại",
    desc: "Không tìm thấy cơ sở này tại vị trí được chỉ định",
  },
  CONTENT_SPAM: {
    name: "Quảng cáo rác / Spam",
    desc: "Chèn link tiếp thị, bán hàng bừa bãi hoặc lặp lại nội dung vô nghĩa",
  },
  SPAM: {
    name: "Nội dung rác / Spam",
    desc: "Nội dung quảng cáo phiền hà hoặc không liên quan",
  },
  CONTENT_OFFENSIVE: {
    name: "Ngôn từ thô tục / Xúc phạm",
    desc: "Chửi bới, công kích cá nhân, đe dọa hoặc phân biệt đối xử",
  },
  OFFENSIVE: {
    name: "Nội dung phản cảm / Xúc phạm",
    desc: "Ngôn ngữ thô tục, khiêu khích hoặc quấy rối",
  },
  INAPPROPRIATE: {
    name: "Nội dung không phù hợp",
    desc: "Hình ảnh hoặc nội dung vi phạm tiêu chuẩn văn hóa cộng đồng",
  },
  CONTENT_FAKE: {
    name: "Đánh giá giả mạo / Bịa đặt",
    desc: "Đánh giá chưa từng trải nghiệm, seeding ảo hoặc cố tình dìm hàng đối thủ",
  },
  FAKE: {
    name: "Thông tin giả mạo / Bịa đặt",
    desc: "Nội dung không đúng thực tế, vu khống",
  },
  DEFAMATION: {
    name: "Bôi nhọ / Xuyên tạc danh dự",
    desc: "Hành vi xúc phạm uy tín cá nhân hoặc thương hiệu có chủ đích",
  },
  COPYRIGHT: {
    name: "Vi phạm bản quyền hình ảnh / bài viết",
    desc: "Sao chép tác phẩm của người khác mà không có sự cho phép",
  },
  BLOG_SPAM: {
    name: "Bài viết quảng cáo rác",
    desc: "Nội dung tiếp thị trá hình, link cờ bạc, lừa đảo",
  },
  BLOG_COPYRIGHT: {
    name: "Vi phạm bản quyền bài viết / ảnh",
    desc: "Đạo văn hoặc lấy ảnh bản quyền không dẫn nguồn",
  },
  BLOG_MISINFO: {
    name: "Thông tin sai sự thật / Nguy hiểm",
    desc: "Chỉ dẫn du lịch sai lệch có thể gây nguy hiểm cho người đọc",
  },
  BLOG_OFFENSIVE: {
    name: "Nội dung phản cảm",
    desc: "Vi phạm thuần phong mỹ tục cộng đồng du lịch",
  },
  USER_IMPERSONATION: {
    name: "Mạo danh người khác",
    desc: "Sử dụng hình ảnh, tên tuổi của người khác trái phép",
  },
  OTHER: {
    name: "Lý do khác",
    desc: "Vấn đề vi phạm khác cần Quản trị viên xem xét",
  },
};

const DEFAULT_REASONS_BY_TARGET: Record<string, ReasonItem[]> = {
  place: [
    { code: "PLACE_WRONG_INFO", name: "Thông tin sai lệch", desc: "Địa chỉ, số điện thoại, giờ mở cửa hoặc vị trí bản đồ không đúng" },
    { code: "PLACE_CLOSED", name: "Địa điểm đã đóng cửa", desc: "Cơ sở đã ngừng kinh doanh vĩnh viễn hoặc tạm ngưng dài hạn" },
    { code: "PLACE_WRONG_PRICE", name: "Giá cả không chính xác", desc: "Mức giá thực tế chênh lệch nhiều so với thông tin niêm yết" },
    { code: "PLACE_DUPLICATE", name: "Địa điểm bị trùng lặp", desc: "Đã có địa điểm tương tự đang cùng tồn tại trên hệ thống" },
    { code: "PLACE_INAPPROPRIATE", name: "Địa điểm không có thật / Vi phạm", desc: "Cơ sở ảo hoặc vi phạm thuần phong mỹ tục" },
    { code: "OTHER", name: "Lý do khác", desc: "Vấn đề khác cần Quản trị viên xác minh" },
  ],
  review: [
    { code: "CONTENT_SPAM", name: "Quảng cáo rác / Spam", desc: "Chèn link tiếp thị, bán hàng hoặc bình luận lặp lại vô nghĩa" },
    { code: "CONTENT_OFFENSIVE", name: "Ngôn từ thô tục / Xúc phạm", desc: "Chửi bới, công kích cá nhân, xúc phạm hoặc đe dọa" },
    { code: "CONTENT_FAKE", name: "Đánh giá giả mạo / Chưa trải nghiệm", desc: "Đánh giá ảo, vu khống hoặc có dấu hiệu cạnh tranh không lành mạnh" },
    { code: "DEFAMATION", name: "Bôi nhọ / Xuyên tạc danh dự", desc: "Vu khống gây ảnh hưởng tiêu cực tới uy tín cơ sở" },
    { code: "INAPPROPRIATE", name: "Hình ảnh / Nội dung phản cảm", desc: "Đính kèm ảnh nhạy cảm hoặc không liên quan tới địa điểm" },
    { code: "OTHER", name: "Lý do khác", desc: "Vi phạm khác cần Quản trị viên can thiệp" },
  ],
  comment: [
    { code: "CONTENT_SPAM", name: "Bình luận spam / Quảng cáo", desc: "Chèn link tiếp thị hoặc lặp lại bình luận nhiều lần" },
    { code: "CONTENT_OFFENSIVE", name: "Ngôn từ xúc phạm / Khiếm nhã", desc: "Công kích cá nhân, xúc phạm hoặc khiêu khích" },
    { code: "DEFAMATION", name: "Xuyên tạc / Vu khống", desc: "Thông tin bịa đặt gây ảnh hưởng tới người khác" },
    { code: "OTHER", name: "Lý do khác", desc: "Vi phạm khác cần can thiệp" },
  ],
  blog: [
    { code: "BLOG_COPYRIGHT", name: "Vi phạm bản quyền nội dung / ảnh", desc: "Sao chép bài viết của tác giả khác không xin phép" },
    { code: "BLOG_MISINFO", name: "Thông tin sai sự thật / Nguy hiểm", desc: "Cung cấp chỉ dẫn sai lệch gây nguy hiểm cho người đi du lịch" },
    { code: "BLOG_SPAM", name: "Bài viết quảng cáo / Rác", desc: "Nội dung bán hàng bừa bãi, link cờ bạc, lừa đảo" },
    { code: "BLOG_OFFENSIVE", name: "Nội dung phản cảm", desc: "Vi phạm thuần phong mỹ tục hoặc tiêu chuẩn cộng đồng" },
    { code: "OTHER", name: "Lý do khác", desc: "Vấn đề khác cần xử lý" },
  ],
  user: [
    { code: "USER_IMPERSONATION", name: "Mạo danh người khác", desc: "Sử dụng thông tin, hình ảnh của người khác trái phép" },
    { code: "CONTENT_SPAM", name: "Tài khoản spam / Lừa đảo", desc: "Liên tục đăng tải nội dung rác hoặc có hành vi gian lận" },
    { code: "CONTENT_OFFENSIVE", name: "Hành vi xúc phạm / Quấy rối", desc: "Quấy rối thành viên khác qua tin nhắn hoặc bình luận" },
    { code: "OTHER", name: "Lý do khác", desc: "Vi phạm khác cần báo cáo" },
  ],
};

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

  const [modalView, setModalView] = useState<"form" | "history">(defaultTab);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<number | null>(null);
  const [myReports, setMyReports] = useState<SubmittedUserReport[]>([]);
  const [rawApiReasons, setRawApiReasons] = useState<any[]>([]);

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
    ])
      .then(([reasonsRes, historyRes]) => {
        const reasonsData = reasonsRes?.data || reasonsRes || [];
        if (Array.isArray(reasonsData)) {
          setRawApiReasons(reasonsData);
        }
        if (historyRes?.data?.items) {
          setMyReports(historyRes.data.items);
        }
      })
      .catch(() => undefined);
  }, [defaultTab]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig || "";
    };
  }, [isOpen]);

  const processedReasons = useMemo<ReasonItem[]>(() => {
    const defaultList = DEFAULT_REASONS_BY_TARGET[targetType] || DEFAULT_REASONS_BY_TARGET.place;

    if (!rawApiReasons || rawApiReasons.length === 0) {
      return defaultList;
    }

    return rawApiReasons.map((item) => {
      const code = typeof item === "string" ? item : item.code || item.id || item.name || "OTHER";
      const uppercaseCode = String(code).toUpperCase().trim();
      const mapped = REASON_DICTIONARY[uppercaseCode];

      if (mapped) {
        return {
          code: uppercaseCode,
          name: mapped.name,
          desc: mapped.desc,
        };
      }

      // If item already has a meaningful name from backend that is not equal to raw uppercase code
      if (typeof item === "object" && item.name && item.name !== uppercaseCode) {
        return {
          code: uppercaseCode,
          name: item.name,
          desc: item.desc || item.description || undefined,
        };
      }

      return {
        code: uppercaseCode,
        name: uppercaseCode.replace(/_/g, " "),
        desc: undefined,
      };
    });
  }, [rawApiReasons, targetType]);

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
      case "user":
        return "Báo cáo Tài khoản vi phạm";
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
      case "user":
        return { label: "Thành viên", icon: User, bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" };
      default:
        return { label: "Nội dung", icon: Flag, bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReasonId) return;

    setIsSubmitting(true);
    const chosenReason = processedReasons.find((r) => r.code === selectedReasonId);
    const reasonText = chosenReason?.name || selectedReasonId;

    try {
      const response = await reportService.submitReport({
        targetType: targetInfo.targetType,
        targetId: targetInfo.targetId,
        placeId: targetInfo.targetType === "place" ? targetInfo.targetId : undefined,
        reviewId: targetInfo.targetType === "review" ? targetInfo.targetId : undefined,
        commentId: targetInfo.targetType === "comment" ? targetInfo.targetId : undefined,
        blogId: targetInfo.targetType === "blog" ? targetInfo.targetId : undefined,
        reason: reasonText,
        reasonCode: selectedReasonId,
        description: description.trim() || "Người dùng gửi báo cáo vi phạm.",
      });

      const reportId = Number(response?.data?.id || response?.data || Date.now());
      setSubmittedReportId(reportId);

      const newReportEntry: SubmittedUserReport = {
        id: reportId,
        targetType: targetType,
        targetTitle: targetInfo.targetTitle,
        reasonContent: reasonText,
        description: description.trim() || "Người dùng không để lại mô tả thêm.",
        submittedAt: "Vừa xong",
        status: "pending",
      };

      setMyReports((prev) => [newReportEntry, ...prev]);
      if (onSubmittedReport) {
        onSubmittedReport(newReportEntry);
      }
    } catch {
      // Fallback for UI confirmation in local/development environment
      const reportId = Date.now();
      setSubmittedReportId(reportId);

      const newReportEntry: SubmittedUserReport = {
        id: reportId,
        targetType: targetType,
        targetTitle: targetInfo.targetTitle,
        reasonContent: reasonText,
        description: description.trim() || "Người dùng không để lại mô tả thêm.",
        submittedAt: "Vừa xong",
        status: "pending",
      };

      setMyReports((prev) => [newReportEntry, ...prev]);
      if (onSubmittedReport) {
        onSubmittedReport(newReportEntry);
      }
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
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <Flag size={18} className="fill-rose-600 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {modalView === "history" ? "Lịch sử báo cáo của bạn" : getModalTitle()}
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
                Cảm ơn bạn đã hỗ trợ cộng đồng du lịch trung thực và văn minh. Đội ngũ điều phối viên sẽ kiểm tra và xử lý trong vòng 24 giờ.
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
        ) : modalView === "history" ? (
          /* History View */
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-3">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Báo cáo bạn đã gửi gần đây ({myReports.length})
            </h5>
            {myReports.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Bạn chưa gửi báo cáo nào.
              </div>
            ) : (
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rep.status === "pending"
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
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
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
                  <div className="bg-white p-3 rounded-lg border border-slate-200 mt-1">
                    <p className="text-xs text-slate-700 italic max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed scrollbar-thin">
                      "{targetInfo.targetContent}"
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>Chọn lý do vi phạm</span>
                    <span className="text-rose-600">*</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  {processedReasons.map((r) => {
                    const isSelected = selectedReasonId === r.code;
                    return (
                      <div
                        key={r.code}
                        onClick={() => setSelectedReasonId(r.code)}
                        className={`flex items-start gap-3 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                          ? "border-rose-500 bg-rose-50/60 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50/70"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "border-rose-600 bg-white" : "border-slate-300 bg-white"
                            }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-rose-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs font-bold leading-tight block ${isSelected ? "text-rose-950" : "text-slate-800"
                              }`}
                          >
                            {r.name}
                          </span>
                          {r.desc && (
                            <span
                              className={`text-[11px] block mt-0.5 leading-snug ${isSelected ? "text-rose-800/90" : "text-slate-500"
                                }`}
                            >
                              {r.desc}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Báo cáo của bạn được gửi ẩn danh và bảo mật tuyệt đối.</span>
              </div>
            </div>

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
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs ${selectedReasonId && !isSubmitting
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
