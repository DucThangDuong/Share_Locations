import React from "react";
import type { GroupedReport, AdminReportItem } from "@/types/admin.types";
import { X } from "lucide-react";
import { CustomSelect } from "@/components/common/CustomSelect";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

interface ModerationDrawerProps {
  activeReportGroup: GroupedReport | null;
  selectedReportInDrawer: AdminReportItem | null;
  setSelectedReportIdInDrawer: (id: number) => void;
  drawerDecisionTab: "accept" | "dismiss";
  setDrawerDecisionTab: (tab: "accept" | "dismiss") => void;
  drawerActionTaken: string;
  setDrawerActionTaken: (action: string) => void;
  drawerResolutionNote: string;
  setDrawerResolutionNote: (note: string) => void;
  drawerDismissReason: string;
  setDrawerDismissReason: (reason: string) => void;
  drawerAutoCloseDuplicates?: boolean;
  setDrawerAutoCloseDuplicates?: (v: boolean) => void;
  drawerAutoNotifyReporters?: boolean;
  setDrawerAutoNotifyReporters?: (v: boolean) => void;
  drawerAutoRecalculateRating?: boolean;
  setDrawerAutoRecalculateRating?: (v: boolean) => void;
  handleConfirmDrawerResolution: () => void;
  handleAssignToMe?: (groupKey: string) => void;
  onClose: () => void;
}

export const ModerationDrawer: React.FC<ModerationDrawerProps> = ({
  activeReportGroup,
  selectedReportInDrawer,
  setSelectedReportIdInDrawer,
  drawerDecisionTab,
  setDrawerDecisionTab,
  drawerActionTaken,
  setDrawerActionTaken,
  drawerResolutionNote,
  setDrawerResolutionNote,
  drawerDismissReason,
  setDrawerDismissReason,
  handleConfirmDrawerResolution,
  onClose,
}) => {
  if (!activeReportGroup) return null;

  const currentReport = selectedReportInDrawer || activeReportGroup.reportsList[0];

  // Multi-select actions state
  const selectedActions = React.useMemo(() => {
    if (!drawerActionTaken) return ["hide_target"];
    return drawerActionTaken.split(",").filter(Boolean);
  }, [drawerActionTaken]);

  const toggleAction = (key: string) => {
    const isPresent = selectedActions.includes(key) ||
      (key === "hide_target" && selectedActions.includes("hide_content")) ||
      (key === "delete_permanently" && selectedActions.includes("delete_content"));
    let next: string[];
    if (isPresent) {
      next = selectedActions.filter((a) => a !== key && a !== "hide_content" && a !== "delete_content");
    } else {
      next = [...selectedActions, key];
    }
    setDrawerActionTaken(next.join(","));
  };

  const isHideChecked = selectedActions.includes("hide_target") || selectedActions.includes("hide_content");
  const isDeleteChecked = selectedActions.includes("delete_permanently") || selectedActions.includes("delete_content");
  const hasAtLeastOneAction = drawerDecisionTab === "dismiss" || (isHideChecked || isDeleteChecked);

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-xs">
        <div className="p-4 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="font-mono text-slate-500">#{activeReportGroup.targetId}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-semibold">
                  {activeReportGroup.targetType === "place" && "Địa điểm"}
                  {activeReportGroup.targetType === "review" && "Đánh giá"}
                  {activeReportGroup.targetType === "blog" && "Bài viết"}
                  {activeReportGroup.targetType === "photo" && "Hình ảnh"}
                  {activeReportGroup.targetType === "comment" && "Bình luận"}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {activeReportGroup.targetTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Panel: Target Details & Reports Feed */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
            {/* Target Content Snapshot */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Nội dung đối tượng bị phản ánh
                </span>
                {activeReportGroup.targetRating && (
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    ★ {activeReportGroup.targetRating}.0
                  </span>
                )}
              </div>

              {activeReportGroup.targetContent ? (
                <blockquote className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 italic leading-relaxed">
                  "{activeReportGroup.targetContent}"
                </blockquote>
              ) : (
                <div className="text-slate-600">
                  <p className="font-medium text-slate-900">{activeReportGroup.targetTitle}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeReportGroup.targetSubtitle}</p>
                </div>
              )}
            </div>

            {/* Reports List for this Group */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">
                  Phản ánh từ cộng đồng
                </h4>
              </div>

              <div className="space-y-2">
                {activeReportGroup.reportsList.map((rep) => {
                  const isSelected = (currentReport && currentReport.id === rep.id);
                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReportIdInDrawer(rep.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200/80 bg-white hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold textslate-900">{rep.reporterName}</span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDateTime(rep.submittedAt)}
                        </span>
                      </div>
                      <p className="text-rose-700 font-semibold text-xs">{rep.reasonContent}</p>
                      {rep.description && (
                        <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">
                          "{rep.description}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Decision & Moderation Controls */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Decision Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDrawerDecisionTab("accept")}
                  className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${drawerDecisionTab === "accept"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Xác nhận vi phạm
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerDecisionTab("dismiss")}
                  className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${drawerDecisionTab === "dismiss"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Bác bỏ báo cáo
                </button>
              </div>

              {drawerDecisionTab === "accept" ? (
                /* Action taken when confirmed: Clean checklist options */
                <div className="space-y-3.5">
                  <div>
                    <label className="font-bold text-slate-800 block mb-2">
                      Hành động xử lý thực thi:
                    </label>
                    <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isHideChecked}
                          onChange={() => toggleAction("hide_target")}
                          className="w-4 h-4 mt-0.5 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-slate-800 font-bold text-xs block">
                            Ẩn đối tượng vi phạm
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                            {activeReportGroup.targetType === "place"}
                            {activeReportGroup.targetType === "review"}
                            {activeReportGroup.targetType === "comment"}
                            {activeReportGroup.targetType === "blog"}
                            {!["place", "review", "comment", "blog"].includes(activeReportGroup.targetType) && "Ẩn đối tượng vi phạm khỏi hệ thống người dùng."}
                          </span>
                        </div>
                      </label>
                    </div>
                    {!hasAtLeastOneAction && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        * Bắt buộc phải chọn ít nhất 1 hành động xử lý để thi hành.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Ghi chú kết luận kiểm duyệt:
                    </label>
                    <textarea
                      rows={3}
                      value={drawerResolutionNote}
                      onChange={(e) => setDrawerResolutionNote(e.target.value)}
                      placeholder="Nêu rõ lý do hoặc bằng chứng vi phạm..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </div>
              ) : (
                /* Dismiss Form */
                <div className="space-y-3">
                  <div>
                    <CustomSelect
                      label="Lý do bác bỏ phản ánh:"
                      value={drawerDismissReason}
                      onChange={(val) => setDrawerDismissReason(val)}
                      options={[
                        { value: "NO_VIOLATION", label: "Nội dung hợp lệ, không vi phạm điều khoản" },
                        { value: "INSUFFICIENT_EVIDENCE", label: "Không đủ bằng chứng xác thực" },
                        { value: "SPAM_ABUSE", label: "Báo cáo sai mục đích hoặc quấy rối" },
                        { value: "OTHER", label: "Lý do nghiệp vụ khác" },
                      ]}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Giải trình bác bỏ:
                    </label>
                    <textarea
                      rows={4}
                      value={drawerResolutionNote}
                      onChange={(e) => setDrawerResolutionNote(e.target.value)}
                      placeholder="Ghi chú chi tiết lý do bác bỏ để lưu hồ sơ kiểm toán..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={!hasAtLeastOneAction}
                onClick={handleConfirmDrawerResolution}
                className={`w-full py-2.5 rounded-xl font-bold text-white transition-all shadow-md ${!hasAtLeastOneAction
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : drawerDecisionTab === "accept"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 cursor-pointer"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer"
                  }`}
              >
                {drawerDecisionTab === "accept"
                  ? "Xác nhận & Thi hành xử lý"
                  : "Hoàn tất bác bỏ phản ánh"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDrawer;
